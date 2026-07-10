import { addPropertyControls, ControlType } from "framer"
import { useEffect, useRef, useState } from "react"

/**
 * The Ivory Sukundu — Spotlight Hero
 * Cursor-following spotlight reveals a second image (e.g. 613 blonde)
 * through a soft circular mask over a base image (e.g. jet-black hair).
 *
 * Drag onto the canvas, then set the two images + logo from the panel
 * on the right. Size and position are controlled by Framer like any
 * other frame — just resize this component like you would an image.
 */
export default function SukunduHero(props) {
    const {
        baseImage,
        revealImage,
        logoImage,
        subtitle,
        bottomLeftText,
        bottomRightText,
        spotlightRadius,
        style,
    } = props

    const containerRef = useRef(null)
    const mouse = useRef({ x: -999, y: -999 })
    const smooth = useRef({ x: -999, y: -999 })
    const rafRef = useRef(0)
    const [cursorPos, setCursorPos] = useState({ x: -999, y: -999 })

    useEffect(() => {
        const track = (clientX, clientY) => {
            const rect = containerRef.current?.getBoundingClientRect()
            mouse.current.x = clientX - (rect?.left ?? 0)
            mouse.current.y = clientY - (rect?.top ?? 0)
        }
        const onMove = (e) => track(e.clientX, e.clientY)
        const onTouch = (e) => {
            const t = e.touches[0]
            if (t) track(t.clientX, t.clientY)
        }
        window.addEventListener("mousemove", onMove)
        window.addEventListener("touchstart", onTouch, { passive: true })
        window.addEventListener("touchmove", onTouch, { passive: true })

        const loop = () => {
            const dx = mouse.current.x - smooth.current.x
            const dy = mouse.current.y - smooth.current.y
            if (Math.abs(dx) > 0.5 || Math.abs(dy) > 0.5) {
                smooth.current.x += dx * 0.1
                smooth.current.y += dy * 0.1
                setCursorPos({ x: smooth.current.x, y: smooth.current.y })
            }
            rafRef.current = requestAnimationFrame(loop)
        }
        rafRef.current = requestAnimationFrame(loop)

        return () => {
            window.removeEventListener("mousemove", onMove)
            window.removeEventListener("touchstart", onTouch)
            window.removeEventListener("touchmove", onTouch)
            cancelAnimationFrame(rafRef.current)
        }
    }, [])

    const radius = spotlightRadius ?? 260
    const getImageSrc = (image) =>
        typeof image === "string" ? image : image?.src
    const baseImageSrc = getImageSrc(baseImage)
    const revealImageSrc = getImageSrc(revealImage)
    const logoImageSrc = getImageSrc(logoImage)
    const mask = `radial-gradient(circle ${radius}px at ${cursorPos.x}px ${cursorPos.y}px,
    rgba(255,255,255,1) 0%,
    rgba(255,255,255,1) 40%,
    rgba(255,255,255,0.75) 60%,
    rgba(255,255,255,0.4) 75%,
    rgba(255,255,255,0.12) 88%,
    rgba(255,255,255,0) 100%)`

    return (
        <div
            ref={containerRef}
            style={{
                position: "relative",
                width: "100%",
                height: "100%",
                overflow: "hidden",
                background: "#000",
                ...style,
            }}
        >
            {/* base image */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: baseImageSrc
                        ? `url(${baseImageSrc})`
                        : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    zIndex: 1,
                }}
            />

            {/* reveal image, masked by the cursor spotlight */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    backgroundImage: revealImageSrc
                        ? `url(${revealImageSrc})`
                        : undefined,
                    backgroundSize: "cover",
                    backgroundPosition: "center",
                    backgroundRepeat: "no-repeat",
                    zIndex: 2,
                    maskImage: mask,
                    WebkitMaskImage: mask,
                    maskRepeat: "no-repeat",
                    WebkitMaskRepeat: "no-repeat",
                    pointerEvents: "none",
                }}
            />

            {/* legibility scrim */}
            <div
                style={{
                    position: "absolute",
                    inset: 0,
                    zIndex: 3,
                    background:
                        "linear-gradient(0deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 50%, rgba(0,0,0,0.2) 100%)",
                    pointerEvents: "none",
                }}
            />

            {/* logo + subtitle */}
            <div
                style={{
                    position: "absolute",
                    top: "50%",
                    left: 80,
                    transform: "translateY(-50%)",
                    zIndex: 5,
                    display: "flex",
                    flexDirection: "column",
                    alignItems: "flex-start",
                    pointerEvents: "none",
                    maxWidth: "60%",
                }}
            >
                {logoImageSrc && (
                    <img
                        src={logoImageSrc}
                        alt=""
                        style={{ width: 300, maxWidth: "100%", height: "auto" }}
                    />
                )}
                {subtitle && (
                    <span
                        style={{
                            color: "rgba(255,248,242,0.9)",
                            fontSize: 14,
                            fontWeight: 500,
                            textTransform: "uppercase",
                            letterSpacing: "0.35em",
                            marginTop: 20,
                        }}
                    >
                        {subtitle}
                    </span>
                )}
            </div>

            {/* bottom-left copy */}
            {bottomLeftText && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 56,
                        left: 100,
                        maxWidth: 260,
                        zIndex: 5,
                    }}
                >
                    <p
                        style={{
                            color: "rgba(255,248,242,0.85)",
                            fontSize: 14,
                            lineHeight: 1.6,
                            margin: 0,
                        }}
                    >
                        {bottomLeftText}
                    </p>
                </div>
            )}

            {/* bottom-right copy */}
            {bottomRightText && (
                <div
                    style={{
                        position: "absolute",
                        bottom: 96,
                        right: 56,
                        maxWidth: 260,
                        zIndex: 5,
                    }}
                >
                    <p
                        style={{
                            color: "rgba(255,248,242,0.85)",
                            fontSize: 13,
                            lineHeight: 1.6,
                            margin: 0,
                        }}
                    >
                        {bottomRightText}
                    </p>
                </div>
            )}
        </div>
    )
}

addPropertyControls(SukunduHero, {
    baseImage: {
        type: ControlType.ResponsiveImage,
        title: "Base Image",
        description: "Default look — e.g. jet-black hair",
    },
    revealImage: {
        type: ControlType.ResponsiveImage,
        title: "Reveal Image",
        description: "Revealed under the cursor — e.g. 613 blonde",
    },
    logoImage: {
        type: ControlType.ResponsiveImage,
        title: "Logo",
    },
    subtitle: {
        type: ControlType.String,
        title: "Subtitle",
        defaultValue: "Luxury raw hair, redefined",
    },
    bottomLeftText: {
        type: ControlType.String,
        title: "Bottom-Left Text",
        defaultValue:
            "Ethically sourced, raw virgin hair — luxuriously soft, endlessly versatile, and built to move exactly like it's yours.",
        displayTextArea: true,
    },
    bottomRightText: {
        type: ControlType.String,
        title: "Bottom-Right Text",
        defaultValue:
            "Campaign 01 — The Half-Wig Edit. Comb-in, glueless, installed in sixty seconds.",
        displayTextArea: true,
    },
    spotlightRadius: {
        type: ControlType.Number,
        title: "Spotlight Size",
        defaultValue: 260,
        min: 100,
        max: 500,
        step: 10,
    },
})
