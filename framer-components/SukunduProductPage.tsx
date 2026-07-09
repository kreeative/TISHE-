import { addPropertyControls, ControlType } from "framer"
import { useEffect, useMemo, useState } from "react"

/**
 * The Ivory Sukundu — Product Page
 * Fetches a real product live from Shopify (by handle), lets the
 * customer pick real variant options (Length, Density, etc.) as
 * pill buttons, shows live price + stock, and adds the exact chosen
 * variant to a real Shopify cart.
 *
 * Set your Shopify domain, Storefront token, and the product's handle
 * in the panel on the right (defaults are already filled in).
 */

const CART_ID_KEY = "sukundu_cart_id"

function findVariant(variants, selection) {
    return variants.find((v) =>
        v.selectedOptions.every((o) => selection[o.name] === o.value)
    )
}

function formatMoney(amount, currencyCode) {
    return new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode || "USD",
    }).format(Number(amount))
}

async function shopifyFetch(domain, token, query, variables) {
    const res = await fetch(`https://${domain}/api/2025-01/graphql.json`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            "X-Shopify-Storefront-Access-Token": token,
        },
        body: JSON.stringify({ query, variables }),
    })
    const json = await res.json()
    if (json.errors) {
        throw new Error(json.errors.map((e) => e.message).join("; "))
    }
    return json.data
}

const PRODUCT_QUERY = `
  query ProductByHandle($handle: String!) {
    product(handle: $handle) {
      id
      title
      descriptionHtml
      images(first: 8) { edges { node { url altText } } }
      options { name values }
      variants(first: 50) {
        edges {
          node {
            id
            availableForSale
            price { amount currencyCode }
            selectedOptions { name value }
          }
        }
      }
    }
  }
`

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
`

export default function SukunduProductPage(props) {
    const {
        shopifyDomain,
        storefrontToken,
        productHandle,
        accentColor,
        style,
    } = props

    const [product, setProduct] = useState(null)
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [selection, setSelection] = useState({})
    const [activeImage, setActiveImage] = useState(0)
    const [qty, setQty] = useState(1)
    const [adding, setAdding] = useState(false)
    const [checkoutUrl, setCheckoutUrl] = useState(null)
    const [addError, setAddError] = useState(null)

    useEffect(() => {
        if (!shopifyDomain || !storefrontToken || !productHandle) {
            setLoading(false)
            setError("Set Shopify domain, token, and product handle in the panel.")
            return
        }
        let cancelled = false
        setLoading(true)
        setError(null)
        shopifyFetch(shopifyDomain, storefrontToken, PRODUCT_QUERY, {
            handle: productHandle,
        })
            .then((data) => {
                if (cancelled) return
                if (!data.product) {
                    setError(`No product found for handle "${productHandle}".`)
                    return
                }
                const normalized = {
                    id: data.product.id,
                    title: data.product.title,
                    descriptionHtml: data.product.descriptionHtml,
                    images: data.product.images.edges.map((e) => e.node),
                    options: data.product.options,
                    variants: data.product.variants.edges.map((e) => e.node),
                }
                setProduct(normalized)
                const firstAvailable =
                    normalized.variants.find((v) => v.availableForSale) ??
                    normalized.variants[0]
                const seed = {}
                firstAvailable?.selectedOptions.forEach((o) => {
                    seed[o.name] = o.value
                })
                setSelection(seed)
            })
            .catch((err) => {
                if (!cancelled) setError(err.message || "Could not load this product.")
            })
            .finally(() => {
                if (!cancelled) setLoading(false)
            })
        return () => {
            cancelled = true
        }
    }, [shopifyDomain, storefrontToken, productHandle])

    const matchedVariant = useMemo(
        () => (product ? findVariant(product.variants, selection) : undefined),
        [product, selection]
    )

    const accent = accentColor || "#5A3224"
    const images = product?.images ?? []

    const handleAddToBag = async () => {
        if (!matchedVariant) return
        setAdding(true)
        setAddError(null)
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
                    `mutation CartLinesAdd($cartId: ID!, $lines: [CartLineInput!]!) {
            cartLinesAdd(cartId: $cartId, lines: $lines) {
              cart { ${CART_FIELDS} }
              userErrors { message }
            }
          }`,
                    { cartId: savedCartId, lines: [{ merchandiseId: matchedVariant.id, quantity: qty }] }
                )
                if (data.cartLinesAdd.userErrors.length) {
                    throw new Error(data.cartLinesAdd.userErrors[0].message)
                }
                setCheckoutUrl(data.cartLinesAdd.cart.checkoutUrl)
                window.localStorage.setItem(CART_ID_KEY, data.cartLinesAdd.cart.id)
            } else {
                data = await shopifyFetch(
                    shopifyDomain,
                    storefrontToken,
                    `mutation CartCreate($lines: [CartLineInput!]!) {
            cartCreate(input: { lines: $lines }) {
              cart { ${CART_FIELDS} }
              userErrors { message }
            }
          }`,
                    { lines: [{ merchandiseId: matchedVariant.id, quantity: qty }] }
                )
                if (data.cartCreate.userErrors.length) {
                    throw new Error(data.cartCreate.userErrors[0].message)
                }
                setCheckoutUrl(data.cartCreate.cart.checkoutUrl)
                if (typeof window !== "undefined") {
                    window.localStorage.setItem(CART_ID_KEY, data.cartCreate.cart.id)
                }
            }
        } catch (err) {
            setAddError(err.message || "Could not add that to your bag.")
        } finally {
            setAdding(false)
        }
    }

    const bodyFont = "'Montserrat', sans-serif"
    const displayFont = "Georgia, serif"

    if (loading) {
        return (
            <div style={{ ...wrapStyle, ...style }}>
                <p style={{ fontFamily: bodyFont, color: "#1a120c99" }}>Loading…</p>
            </div>
        )
    }

    if (error || !product) {
        return (
            <div style={{ ...wrapStyle, ...style }}>
                <p style={{ fontFamily: bodyFont, color: "#1a120c99", maxWidth: 420 }}>
                    {error ?? "Product not found."}
                </p>
            </div>
        )
    }

    return (
        <div
            style={{
                width: "100%",
                height: "100%",
                overflow: "auto",
                background: "#FFF8F2",
                padding: "48px 24px",
                boxSizing: "border-box",
                fontFamily: bodyFont,
                color: "#1a120c",
                ...style,
            }}
        >
            <div
                style={{
                    display: "grid",
                    gridTemplateColumns: "minmax(280px, 1fr) minmax(280px, 1fr)",
                    gap: 48,
                    maxWidth: 1100,
                    margin: "0 auto",
                }}
            >
                {/* gallery */}
                <div>
                    <div style={{ overflow: "hidden", aspectRatio: "4 / 5" }}>
                        {images[activeImage] && (
                            <img
                                src={images[activeImage].url}
                                alt={images[activeImage].altText || product.title}
                                style={{ width: "100%", height: "100%", objectFit: "cover" }}
                            />
                        )}
                    </div>
                    {images.length > 1 && (
                        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
                            {images.map((img, i) => (
                                <button
                                    key={img.url}
                                    onClick={() => setActiveImage(i)}
                                    style={{
                                        width: 64,
                                        height: 80,
                                        overflow: "hidden",
                                        border: `1px solid ${i === activeImage ? accent : accent + "33"}`,
                                        padding: 0,
                                        cursor: "pointer",
                                        background: "none",
                                    }}
                                >
                                    <img
                                        src={img.url}
                                        alt=""
                                        style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                    />
                                </button>
                            ))}
                        </div>
                    )}
                </div>

                {/* details */}
                <div>
                    <h1
                        style={{
                            fontFamily: displayFont,
                            fontSize: 40,
                            lineHeight: 1.05,
                            margin: 0,
                        }}
                    >
                        {product.title}
                    </h1>

                    {matchedVariant && (
                        <p style={{ fontSize: 24, fontWeight: 500, margin: "12px 0 0" }}>
                            {formatMoney(
                                matchedVariant.price.amount,
                                matchedVariant.price.currencyCode
                            )}
                        </p>
                    )}

                    {product.descriptionHtml && (
                        <div
                            style={{
                                fontSize: 14,
                                color: "#1a120cbf",
                                lineHeight: 1.6,
                                marginTop: 20,
                                maxWidth: 420,
                            }}
                            dangerouslySetInnerHTML={{ __html: product.descriptionHtml }}
                        />
                    )}

                    {product.options
                        .filter(
                            (opt) =>
                                !(opt.values.length === 1 && opt.values[0] === "Default Title")
                        )
                        .map((opt) => (
                            <div key={opt.name} style={{ marginTop: 28 }}>
                                <p
                                    style={{
                                        fontSize: 12,
                                        fontWeight: 600,
                                        textTransform: "uppercase",
                                        letterSpacing: "0.25em",
                                        color: accent,
                                        margin: 0,
                                    }}
                                >
                                    {opt.name}
                                </p>
                                <div
                                    style={{
                                        display: "flex",
                                        flexWrap: "wrap",
                                        gap: 8,
                                        marginTop: 12,
                                    }}
                                >
                                    {opt.values.map((value) => {
                                        const isActive = selection[opt.name] === value
                                        const wouldMatch = findVariant(product.variants, {
                                            ...selection,
                                            [opt.name]: value,
                                        })
                                        const disabled = !wouldMatch?.availableForSale
                                        return (
                                            <button
                                                key={value}
                                                disabled={disabled}
                                                onClick={() =>
                                                    setSelection({ ...selection, [opt.name]: value })
                                                }
                                                style={{
                                                    padding: "10px 20px",
                                                    fontSize: 12,
                                                    fontWeight: 600,
                                                    letterSpacing: "0.15em",
                                                    border: `1px solid ${
                                                        isActive ? accent : accent + "40"
                                                    }`,
                                                    background: isActive ? accent : "#ffffff66",
                                                    color: isActive
                                                        ? "#FFF8F2"
                                                        : disabled
                                                        ? "#1a120c40"
                                                        : "#1a120ca6",
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
                        ))}

                    <div style={{ display: "flex", alignItems: "center", gap: 12, marginTop: 32 }}>
                        <button
                            onClick={() => setQty((q) => Math.max(1, q - 1))}
                            style={qtyBtnStyle(accent)}
                        >
                            –
                        </button>
                        <span style={{ width: 24, textAlign: "center", fontWeight: 500 }}>
                            {qty}
                        </span>
                        <button onClick={() => setQty((q) => q + 1)} style={qtyBtnStyle(accent)}>
                            +
                        </button>
                    </div>

                    {addError && (
                        <p style={{ color: "#b91c1c", fontSize: 12, marginTop: 16 }}>{addError}</p>
                    )}

                    <button
                        onClick={handleAddToBag}
                        disabled={!matchedVariant || !matchedVariant.availableForSale || adding}
                        style={{
                            marginTop: 24,
                            padding: "16px 32px",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.2em",
                            textTransform: "uppercase",
                            background: accent + "0d",
                            border: `1px solid ${accent}66`,
                            color: "#1a120c",
                            cursor: "pointer",
                            opacity: !matchedVariant || !matchedVariant.availableForSale ? 0.5 : 1,
                        }}
                    >
                        {!matchedVariant || !matchedVariant.availableForSale
                            ? "Out of Stock"
                            : adding
                            ? "Adding…"
                            : `Add to Bag — ${formatMoney(
                                  matchedVariant.price.amount,
                                  matchedVariant.price.currencyCode
                              )}`}
                    </button>

                    {checkoutUrl && (
                        <a
                            href={checkoutUrl}
                            style={{
                                display: "block",
                                marginTop: 16,
                                fontSize: 12,
                                fontWeight: 600,
                                letterSpacing: "0.15em",
                                textTransform: "uppercase",
                                color: accent,
                            }}
                        >
                            View Bag & Checkout →
                        </a>
                    )}

                    <p style={{ fontSize: 11, color: "#1a120c73", marginTop: 16 }}>
                        Free shipping — already included in the price.
                    </p>
                </div>
            </div>
        </div>
    )
}

const wrapStyle = {
    width: "100%",
    height: "100%",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFF8F2",
}

function qtyBtnStyle(accent) {
    return {
        width: 36,
        height: 36,
        border: `1px solid ${accent}66`,
        background: "none",
        cursor: "pointer",
        fontSize: 16,
        color: "#1a120c",
    }
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
        defaultValue: "#5A3224",
    },
})
