import { addPropertyControls, ControlType } from "framer"
import { useEffect, useState } from "react"

/**
 * The Ivory Sukundu — Product Page (clean white aesthetic)
 * Fetches a real product live from Shopify (by handle), lets the
 * customer pick real variant options (Length, Density, etc.) as
 * pill buttons, shows live price + stock, and adds the exact chosen
 * variant to a real Shopify cart.
 *
 * Set your Shopify domain, Storefront token, and the product's handle
 * in the panel on the right (defaults are already filled in).
 */

const CART_ID_KEY = "sukundu_cart_id"
const bodyFont = "'Montserrat', sans-serif"
const displayFont = "Georgia, serif"

function stripHtml(html) {
    if (!html) return ""
    return html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim()
}

function findVariant(variants, selection) {
    return variants.find((v) =>
        v.selectedOptions.every((o) => selection[o.name] === o.value)
    )
}

function formatMoney(amount, currencyCode) {
    const n = Number(amount)
    if (isNaN(n)) return ""
    try {
        return new Intl.NumberFormat("en-US", {
            style: "currency",
            currency: currencyCode || "USD",
        }).format(n)
    } catch (e) {
        return `$${n.toFixed(2)}`
    }
}

async function shopifyFetch(domain, token, query, variables) {
    const res = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query: query, variables: variables }),
    })
    const json = await res.json()
    if (json.errors && json.errors.length > 0) {
        throw new Error(json.errors.map((e) => e.message).join("; "))
    }
    return json.data
}

const PRODUCT_QUERY =
    "query ProductByHandle($handle: String!) { product(handle: $handle) { id title descriptionHtml images(first: 8) { edges { node { url altText } } } options { name values } variants(first: 50) { edges { node { id availableForSale price { amount currencyCode } selectedOptions { name value } } } } } }"

const CART_CREATE_MUTATION =
    "mutation CartCreate($lines: [CartLineInput!]!) { cartCreate(input: { lines: $lines }) { cart { id checkoutUrl totalQuantity } userErrors { message } } }"

const CART_ADD_MUTATION =
    "mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) { cartLinesAdd(cartId: $cartId, lines: $lines) { cart { id checkoutUrl totalQuantity } userErrors { message } } }"

export default function SukunduProductPage(props) {
    const shopifyDomain = props.shopifyDomain || "r3dmi1-jm.myshopify.com"
    const storefrontToken =
        props.storefrontToken || "73a99755f0c52cc51f2957f806878246"
    const productHandle = props.productHandle || ""
    const accent = props.accentColor || "#111111"
    const featuresRaw = props.features || ""
    const style = props.style

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [errorMsg, setErrorMsg] = useState("")
    const [selection, setSelection] = useState({})
    const [activeImage, setActiveImage] = useState(0)
    const [qty, setQty] = useState(1)
    const [adding, setAdding] = useState(false)
    const [checkoutUrl, setCheckoutUrl] = useState("")
    const [addError, setAddError] = useState("")

    useEffect(() => {
        if (!shopifyDomain || !storefrontToken || !productHandle) {
            setLoading(false)
            setErrorMsg("Set the Product Handle in the panel on the right.")
            return
        }
        let cancelled = false
        setLoading(true)
        setErrorMsg("")
        shopifyFetch(shopifyDomain, storefrontToken, PRODUCT_QUERY, {
            handle: productHandle,
        })
            .then(function (data) {
                if (cancelled) return
                if (!data || !data.product) {
                    setErrorMsg('No product found for handle "' + productHandle + '".')
                    return
                }
                const p = data.product
                const normalized = {
                    id: p.id,
                    title: p.title,
                    descriptionHtml: p.descriptionHtml,
                    images: (p.images && p.images.edges ? p.images.edges : []).map(
                        function (e) {
                            return e.node
                        }
                    ),
                    options: p.options || [],
                    variants: (p.variants && p.variants.edges
                        ? p.variants.edges
                        : []
                    ).map(function (e) {
                        return e.node
                    }),
                }
                setProduct(normalized)
                const firstAvailable =
                    normalized.variants.filter(function (v) {
                        return v.availableForSale
                    })[0] || normalized.variants[0]
                const seed = {}
                if (firstAvailable) {
                    firstAvailable.selectedOptions.forEach(function (o) {
                        seed[o.name] = o.value
                    })
                }
                setSelection(seed)
            })
            .catch(function (err) {
                if (!cancelled) {
                    setErrorMsg(
                        err && err.message ? err.message : "Could not load this product."
                    )
                }
            })
            .finally(function () {
                if (!cancelled) setLoading(false)
            })
        return function () {
            cancelled = true
        }
    }, [shopifyDomain, storefrontToken, productHandle])

    const matchedVariant = product
        ? findVariant(product.variants, selection)
        : null
    const images = product && product.images ? product.images : []
    const featureList = featuresRaw
        .split("\n")
        .map(function (f) {
            return f.trim()
        })
        .filter(Boolean)
    const descriptionText = product ? stripHtml(product.descriptionHtml) : ""

    const handleAddToBag = async function () {
        if (!matchedVariant) return
        setAdding(true)
        setAddError("")
        try {
            const savedCartId =
                typeof window !== "undefined"
                    ? window.localStorage.getItem(CART_ID_KEY)
                    : null
            let data
            if (savedCartId) {
                data = await shopifyFetch(
                    shopifyDomain,
                    storefrontToken,
                    CART_ADD_MUTATION,
                    {
                        cartId: savedCartId,
                        lines: [{ merchandiseId: matchedVariant.id, quantity: qty }],
                    }
                )
                if (data.cartLinesAdd.userErrors.length > 0) {
                    throw new Error(data.cartLinesAdd.userErrors[0].message)
                }
                setCheckoutUrl(data.cartLinesAdd.cart.checkoutUrl)
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(CART_ID_KEY, data.cartLinesAdd.cart.id)
                }
            } else {
                data = await shopifyFetch(
                    shopifyDomain,
                    storefrontToken,
                    CART_CREATE_MUTATION,
                    { lines: [{ merchandiseId: matchedVariant.id, quantity: qty }] }
                )
                if (data.cartCreate.userErrors.length > 0) {
                    throw new Error(data.cartCreate.userErrors[0].message)
                }
                setCheckoutUrl(data.cartCreate.cart.checkoutUrl)
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(CART_ID_KEY, data.cartCreate.cart.id)
                }
            }
        } catch (err) {
            setAddError(
                err && err.message ? err.message : "Could not add that to your bag."
            )
        } finally {
            setAdding(false)
        }
    }

    if (loading) {
        return (
            <div style={Object.assign({}, wrapStyle, style)}>
                <p style={{ fontFamily: bodyFont, color: "#00000099" }}>Loading…</p>
            </div>
        )
    }

    if (errorMsg || !product) {
        return (
            <div style={Object.assign({}, wrapStyle, style)}>
                <p
                    style={{
                        fontFamily: bodyFont,
                        color: "#00000099",
                        maxWidth: 420,
                        textAlign: "center",
                        padding: 24,
                    }}
                >
                    {errorMsg || "Product not found."}
                </p>
            </div>
        )
    }

    const visibleOptions = product.options.filter(function (opt) {
        return !(opt.values.length === 1 && opt.values[0] === "Default Title")
    })

    return (
        <div
            style={Object.assign(
                {
                    width: "100%",
                    height: "100%",
                    minHeight: 600,
                    overflow: "auto",
                    background: "#FFFFFF",
                    padding: "56px 24px",
                    boxSizing: "border-box",
                    fontFamily: bodyFont,
                    color: "#111111",
                },
                style
            )}
        >
            <div
                style={{
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "center",
                    maxWidth: 480,
                    margin: "0 auto",
                }}
            >
                <div
                    style={{
                        width: "100%",
                        aspectRatio: "1 / 1.1",
                        overflow: "hidden",
                        background: "#f5f5f5",
                    }}
                >
                    {images[activeImage] ? (
                        <img
                            src={images[activeImage].url}
                            alt={images[activeImage].altText || product.title}
                            style={{ width: "100%", height: "100%", objectFit: "cover" }}
                        />
                    ) : null}
                </div>

                {images.length > 1 ? (
                    <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                        {images.map(function (img, i) {
                            return (
                                <button
                                    key={img.url + i}
                                    onClick={function () {
                                        setActiveImage(i)
                                    }}
                                    style={{
                                        width: 88,
                                        height: 96,
                                        overflow: "hidden",
                                        border:
                                            i === activeImage
                                                ? "2px solid " + accent
                                                : "1px solid #e5e5e5",
                                        padding: 0,
                                        cursor: "pointer",
                                        background: "#f5f5f5",
                                    }}
                                >
                                    <img
                                        src={img.url}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </button>
                            )
                        })}
                    </div>
                ) : null}

                <h1
                    style={{
                        fontFamily: displayFont,
                        fontSize: 26,
                        lineHeight: 1.2,
                        margin: "28px 0 0",
                        textAlign: "center",
                    }}
                >
                    {product.title}
                </h1>

                {matchedVariant ? (
                    <p style={{ fontSize: 18, fontWeight: 500, margin: "8px 0 0" }}>
                        {formatMoney(
                            matchedVariant.price.amount,
                            matchedVariant.price.currencyCode
                        )}
                    </p>
                ) : null}

                {descriptionText ? (
                    <p
                        style={{
                            fontSize: 13,
                            color: "#00000099",
                            lineHeight: 1.6,
                            marginTop: 12,
                            textAlign: "center",
                            maxWidth: 360,
                        }}
                    >
                        {descriptionText}
                    </p>
                ) : null}

                {featureList.length > 0 ? (
                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            margin: "20px 0 0",
                            display: "flex",
                            flexDirection: "column",
                            gap: 6,
                            alignItems: "center",
                        }}
                    >
                        {featureList.map(function (f) {
                            return (
                                <li
                                    key={f}
                                    style={{
                                        fontSize: 12,
                                        color: "#00000080",
                                        letterSpacing: "0.02em",
                                    }}
                                >
                                    {f}
                                </li>
                            )
                        })}
                    </ul>
                ) : null}

                {visibleOptions.map(function (opt) {
                    return (
                        <div
                            key={opt.name}
                            style={{ marginTop: 24, width: "100%", textAlign: "center" }}
                        >
                            <p
                                style={{
                                    fontSize: 11,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.2em",
                                    color: "#00000099",
                                    margin: 0,
                                }}
                            >
                                {opt.name}
                            </p>
                            <div
                                style={{
                                    display: "flex",
                                    flexWrap: "wrap",
                                    justifyContent: "center",
                                    gap: 8,
                                    marginTop: 10,
                                }}
                            >
                                {opt.values.map(function (value) {
                                    const isActive = selection[opt.name] === value
                                    const nextSelection = Object.assign({}, selection)
                                    nextSelection[opt.name] = value
                                    const wouldMatch = findVariant(
                                        product.variants,
                                        nextSelection
                                    )
                                    const disabled = !wouldMatch || !wouldMatch.availableForSale
                                    return (
                                        <button
                                            key={value}
                                            disabled={disabled}
                                            onClick={function () {
                                                setSelection(nextSelection)
                                            }}
                                            style={{
                                                padding: "9px 18px",
                                                fontSize: 12,
                                                fontWeight: 500,
                                                letterSpacing: "0.05em",
                                                border:
                                                    "1px solid " + (isActive ? accent : "#dddddd"),
                                                background: isActive ? accent : "#ffffff",
                                                color: isActive
                                                    ? "#ffffff"
                                                    : disabled
                                                    ? "#00000033"
                                                    : "#111111",
                                                textDecoration: disabled ? "line-through" : "none",
                                                cursor: disabled ? "not-allowed" : "pointer",
                                            }}
                                        >
                                            {value}
                                        </button>
                                    )
                                })}
                            </div>
                        </div>
                    )
                })}

                <div
                    style={{
                        display: "flex",
                        alignItems: "center",
                        gap: 12,
                        marginTop: 28,
                    }}
                >
                    <button
                        onClick={function () {
                            setQty(Math.max(1, qty - 1))
                        }}
                        style={qtyBtnStyle}
                    >
                        –
                    </button>
                    <span style={{ width: 24, textAlign: "center", fontWeight: 500 }}>
                        {qty}
                    </span>
                    <button
                        onClick={function () {
                            setQty(qty + 1)
                        }}
                        style={qtyBtnStyle}
                    >
                        +
                    </button>
                </div>

                {addError ? (
                    <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 16 }}>
                        {addError}
                    </p>
                ) : null}

                <button
                    onClick={handleAddToBag}
                    disabled={!matchedVariant || !matchedVariant.availableForSale || adding}
                    style={{
                        marginTop: 20,
                        width: "100%",
                        padding: "16px 32px",
                        fontSize: 12,
                        fontWeight: 600,
                        letterSpacing: "0.15em",
                        textTransform: "uppercase",
                        background: "#111111",
                        border: "none",
                        color: "#ffffff",
                        cursor: "pointer",
                        opacity:
                            !matchedVariant || !matchedVariant.availableForSale ? 0.4 : 1,
                    }}
                >
                    {!matchedVariant || !matchedVariant.availableForSale
                        ? "Out of Stock"
                        : adding
                        ? "Adding…"
                        : "Add to Bag — " +
                          formatMoney(
                              matchedVariant.price.amount,
                              matchedVariant.price.currencyCode
                          )}
                </button>

                {checkoutUrl ? (
                    <a
                        href={checkoutUrl}
                        style={{
                            display: "block",
                            marginTop: 14,
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.1em",
                            textTransform: "uppercase",
                            color: "#111111",
                            textAlign: "center",
                        }}
                    >
                        View Bag & Checkout →
                    </a>
                ) : null}

                <p
                    style={{
                        fontSize: 11,
                        color: "#00000066",
                        marginTop: 16,
                        textAlign: "center",
                    }}
                >
                    Free shipping — already included in the price.
                </p>
            </div>
        </div>
    )
}

const wrapStyle = {
    width: "100%",
    height: "100%",
    minHeight: 400,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFFFFF",
}

const qtyBtnStyle = {
    width: 36,
    height: 36,
    border: "1px solid #dddddd",
    background: "none",
    cursor: "pointer",
    fontSize: 16,
    color: "#111111",
}

addPropertyControls(SukunduProductPage, {
    shopifyDomain: {
        type: ControlType.String,
        title: "Shopify Domain",
        defaultValue: "r3dmi1-jm.myshopify.com",
    },
    storefrontToken: {
        type: ControlType.String,
        title: "Storefront Token",
        defaultValue: "73a99755f0c52cc51f2957f806878246",
    },
    productHandle: {
        type: ControlType.String,
        title: "Product Handle",
        defaultValue: "kinky-curly-half-wig-12a",
        description: "Find this in Shopify: Products → your product → URL handle",
    },
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#111111",
    },
    features: {
        type: ControlType.String,
        title: "Feature List",
        displayTextArea: true,
        defaultValue:
            'Single wefts for a flat, undetectable install\nAvailable in lengths 14" – 32"\nLifts and dyes easily without compromising quality',
        description: "One feature per line",
    },
})
