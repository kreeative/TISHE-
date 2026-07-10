import { addPropertyControls, ControlType } from "framer"
import { useEffect, useState } from "react"

/**
 * The Ivory Sukundu — Customer Account
 * Real Shopify customer sign-up / sign-in (Storefront API), with a
 * branded "Sukundu Circle" welcome card shown once logged in.
 *
 * Set your Shopify domain + Storefront token in the panel (defaults
 * already filled in). Session persists across visits via localStorage.
 *
 * Note: if your store uses Shopify's newer hosted account system
 * instead of classic accounts, sign-in/sign-up will show a fallback
 * message with a link to Shopify's own account page — that's expected,
 * not a bug, and just means this store type doesn't support a fully
 * custom in-page form.
 */

const TOKEN_KEY = "sukundu_customer_token"

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

const CREATE_MUTATION = `
  mutation CustomerCreate($input: CustomerCreateInput!) {
    customerCreate(input: $input) {
      customer { firstName lastName email }
      customerUserErrors { field message }
    }
  }
`

const TOKEN_MUTATION = `
  mutation CustomerAccessTokenCreate($input: CustomerAccessTokenCreateInput!) {
    customerAccessTokenCreate(input: $input) {
      customerAccessToken { accessToken expiresAt }
      customerUserErrors { field message }
    }
  }
`

const CUSTOMER_QUERY = `
  query GetCustomer($customerAccessToken: String!) {
    customer(customerAccessToken: $customerAccessToken) {
      firstName
      lastName
      email
    }
  }
`

export default function SukunduAccount(props) {
    const { shopifyDomain, storefrontToken, accentColor, style } = props
    const accent = accentColor || "#111111"

    const [mode, setMode] = useState("create") // "create" | "signin"
    const [firstName, setFirstName] = useState("")
    const [lastName, setLastName] = useState("")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState(null)
    const [fallback, setFallback] = useState(false)
    const [customer, setCustomer] = useState(null)
    const [checkingSession, setCheckingSession] = useState(true)

    // restore an existing session
    useEffect(() => {
        const token = typeof window !== "undefined" ? window.localStorage.getItem(TOKEN_KEY) : null
        if (!token || !shopifyDomain || !storefrontToken) {
            setCheckingSession(false)
            return
        }
        shopifyFetch(shopifyDomain, storefrontToken, CUSTOMER_QUERY, { customerAccessToken: token })
            .then((data) => {
                if (data.customer) setCustomer(data.customer)
                else window.localStorage.removeItem(TOKEN_KEY)
            })
            .catch(() => window.localStorage.removeItem(TOKEN_KEY))
            .finally(() => setCheckingSession(false))
    }, [shopifyDomain, storefrontToken])

    const signIn = async (emailValue, passwordValue) => {
        const data = await shopifyFetch(shopifyDomain, storefrontToken, TOKEN_MUTATION, {
            input: { email: emailValue, password: passwordValue },
        })
        const errs = data.customerAccessTokenCreate.customerUserErrors
        if (errs.length) throw new Error(errs[0].message)
        const token = data.customerAccessTokenCreate.customerAccessToken.accessToken
        window.localStorage.setItem(TOKEN_KEY, token)
        const customerData = await shopifyFetch(shopifyDomain, storefrontToken, CUSTOMER_QUERY, {
            customerAccessToken: token,
        })
        setCustomer(customerData.customer)
    }

    const handleSubmit = async (e) => {
        e.preventDefault()
        setLoading(true)
        setError(null)
        try {
            if (mode === "create") {
                const data = await shopifyFetch(shopifyDomain, storefrontToken, CREATE_MUTATION, {
                    input: { firstName, lastName, email, password },
                })
                const errs = data.customerCreate.customerUserErrors
                if (errs.length) throw new Error(errs[0].message)
                await signIn(email, password)
            } else {
                await signIn(email, password)
            }
        } catch (err) {
            const msg = err.message || "Something went wrong."
            if (/disabled|not supported|deprecated/i.test(msg)) {
                setFallback(true)
            } else {
                setError(msg)
            }
        } finally {
            setLoading(false)
        }
    }

    const signOut = () => {
        window.localStorage.removeItem(TOKEN_KEY)
        setCustomer(null)
    }

    const bodyFont = "'Montserrat', sans-serif"
    const displayFont = "Georgia, serif"

    if (checkingSession) {
        return (
            <div style={{ ...wrapStyle, ...style }}>
                <p style={{ fontFamily: bodyFont, color: "#00000099" }}>Loading…</p>
            </div>
        )
    }

    if (fallback) {
        return (
            <div style={{ ...wrapStyle, ...style }}>
                <div style={{ maxWidth: 360, textAlign: "center", fontFamily: bodyFont }}>
                    <h2 style={{ fontFamily: displayFont, fontSize: 24, margin: 0 }}>
                        Sign in on Shopify
                    </h2>
                    <p style={{ fontSize: 13, color: "#00000099", marginTop: 12, lineHeight: 1.6 }}>
                        Your store uses Shopify's hosted account system, so sign-in happens on a
                        Shopify page rather than here.
                    </p>
                    <a
                        href={`https://${shopifyDomain}/account/login`}
                        style={{
                            display: "inline-block",
                            marginTop: 20,
                            padding: "14px 28px",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            background: "#111111",
                            color: "#ffffff",
                            textDecoration: "none",
                        }}
                    >
                        Continue to Sign In
                    </a>
                </div>
            </div>
        )
    }

    if (customer) {
        const displayName = customer.firstName || customer.email
        return (
            <div style={{ ...wrapStyle, ...style }}>
                <div style={{ width: "100%", maxWidth: 380, fontFamily: bodyFont, textAlign: "center" }}>
                    <p
                        style={{
                            fontSize: 11,
                            fontWeight: 600,
                            textTransform: "uppercase",
                            letterSpacing: "0.25em",
                            color: accent,
                            margin: 0,
                        }}
                    >
                        Welcome to the Circle
                    </p>
                    <h2 style={{ fontFamily: displayFont, fontSize: 30, margin: "8px 0 24px" }}>
                        {displayName}
                    </h2>

                    {/* membership card */}
                    <div
                        style={{
                            width: "100%",
                            aspectRatio: "8 / 5",
                            padding: 24,
                            display: "flex",
                            flexDirection: "column",
                            justifyContent: "space-between",
                            boxSizing: "border-box",
                            background:
                                "linear-gradient(135deg, #1a0f08 0%, #2b1409 55%, #4a2a14 100%)",
                            border: "1px solid rgba(201,155,111,0.4)",
                            textAlign: "left",
                        }}
                    >
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                            <span style={{ color: "#FFF8F2", fontFamily: displayFont, fontSize: 18 }}>
                                The Ivory Sukundu
                            </span>
                            <span
                                style={{
                                    color: "#c99b6f",
                                    fontSize: 10,
                                    fontWeight: 600,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.25em",
                                }}
                            >
                                Ivory Member
                            </span>
                        </div>
                        <div>
                            <p style={{ color: "#FFF8F2", fontFamily: displayFont, fontSize: 20, margin: 0 }}>
                                {displayName}
                            </p>
                            <p
                                style={{
                                    color: "rgba(255,248,242,0.55)",
                                    fontSize: 10,
                                    textTransform: "uppercase",
                                    letterSpacing: "0.25em",
                                    marginTop: 4,
                                }}
                            >
                                The Sukundu Circle — est. 2026
                            </p>
                        </div>
                    </div>

                    <ul
                        style={{
                            listStyle: "none",
                            padding: 0,
                            marginTop: 24,
                            textAlign: "left",
                            fontSize: 13,
                            color: "#00000099",
                            lineHeight: 1.8,
                        }}
                    >
                        <li>— Every $1 earns 1 strand. 200 strands = $20 off.</li>
                        <li>— Early access to every drop and restock.</li>
                        <li>— Full access to Sukundu School care guides.</li>
                        <li>— A gift on your birthday, always.</li>
                    </ul>

                    <button
                        onClick={signOut}
                        style={{
                            marginTop: 20,
                            fontSize: 11,
                            fontWeight: 600,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            color: "#00000073",
                            background: "none",
                            border: "none",
                            cursor: "pointer",
                        }}
                    >
                        Sign Out
                    </button>
                </div>
            </div>
        )
    }

    return (
        <div style={{ ...wrapStyle, ...style }}>
            <div style={{ width: "100%", maxWidth: 360, fontFamily: bodyFont }}>
                <div
                    style={{
                        display: "flex",
                        gap: 32,
                        borderBottom: "1px solid #e5e5e5",
                        marginBottom: 24,
                    }}
                >
                    {["create", "signin"].map((m) => (
                        <button
                            key={m}
                            onClick={() => {
                                setMode(m)
                                setError(null)
                            }}
                            style={{
                                paddingBottom: 12,
                                marginBottom: -1,
                                fontSize: 11,
                                fontWeight: 600,
                                textTransform: "uppercase",
                                letterSpacing: "0.15em",
                                background: "none",
                                border: "none",
                                borderBottom: mode === m ? `2px solid ${accent}` : "2px solid transparent",
                                color: mode === m ? "#111111" : "#00000066",
                                cursor: "pointer",
                            }}
                        >
                            {m === "create" ? "Join the Circle" : "Sign In"}
                        </button>
                    ))}
                </div>

                {mode === "create" && (
                    <p style={{ fontSize: 13, color: "#00000099", lineHeight: 1.6, marginTop: -12, marginBottom: 20 }}>
                        Free to join. Earn strands on every order, unlock early access, and learn
                        with Sukundu School.
                    </p>
                )}

                <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                    {mode === "create" && (
                        <>
                            <input
                                required
                                placeholder="First name"
                                value={firstName}
                                onChange={(e) => setFirstName(e.target.value)}
                                style={inputStyle}
                            />
                            <input
                                placeholder="Last name"
                                value={lastName}
                                onChange={(e) => setLastName(e.target.value)}
                                style={inputStyle}
                            />
                        </>
                    )}
                    <input
                        required
                        type="email"
                        placeholder="you@email.com"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        style={inputStyle}
                    />
                    <input
                        required
                        type="password"
                        placeholder="Password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        style={inputStyle}
                    />

                    {error && <p style={{ color: "#b91c1c", fontSize: 12, margin: 0 }}>{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        style={{
                            marginTop: 8,
                            padding: "16px 32px",
                            fontSize: 12,
                            fontWeight: 600,
                            letterSpacing: "0.15em",
                            textTransform: "uppercase",
                            background: "#111111",
                            color: "#ffffff",
                            border: "none",
                            cursor: loading ? "default" : "pointer",
                            opacity: loading ? 0.6 : 1,
                        }}
                    >
                        {loading
                            ? "Please wait…"
                            : mode === "create"
                            ? "Create My Account"
                            : "Sign In"}
                    </button>
                </form>
            </div>
        </div>
    )
}

const wrapStyle = {
    width: "100%",
    height: "100%",
    minHeight: 480,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    background: "#FFFFFF",
    padding: 24,
    boxSizing: "border-box",
}

const inputStyle = {
    padding: "14px 16px",
    fontSize: 14,
    fontFamily: "'Montserrat', sans-serif",
    border: "1px solid #dddddd",
    outline: "none",
    boxSizing: "border-box",
    width: "100%",
}

addPropertyControls(SukunduAccount, {
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
    accentColor: {
        type: ControlType.Color,
        title: "Accent Color",
        defaultValue: "#111111",
    },
})
