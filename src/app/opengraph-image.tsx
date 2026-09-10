import { ImageResponse } from "next/og"

export const runtime = "edge"
export const alt = "Kelasi 360 — plateforme de gestion scolaire"
export const size = { width: 1200, height: 630 }
export const contentType = "image/png"

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          padding: "72px",
          background: "linear-gradient(135deg, #111827 0%, #1e1b4b 48%, #312e81 100%)",
          color: "white",
          fontFamily: "sans-serif",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: "28px",
            marginBottom: "36px",
          }}
        >
          <div
            style={{
              width: "96px",
              height: "96px",
              borderRadius: "24px",
              background: "#4f46e5",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              fontSize: "42px",
              fontWeight: 800,
            }}
          >
            K
          </div>
          <div style={{ display: "flex", flexDirection: "column" }}>
            <div style={{ fontSize: "64px", fontWeight: 800, letterSpacing: "-1px" }}>
              Kelasi 360
            </div>
            <div style={{ fontSize: "28px", color: "#c7d2fe", marginTop: "4px" }}>
              Gestion scolaire pour la RDC
            </div>
          </div>
        </div>
        <div style={{ fontSize: "30px", color: "#e5e7eb", maxWidth: "900px", lineHeight: 1.35 }}>
          Élèves, notes, frais, parents et trésorerie — une seule plateforme.
        </div>
        <div style={{ marginTop: "40px", fontSize: "22px", color: "#a5b4fc" }}>
          kelasi360.com
        </div>
      </div>
    ),
    { ...size }
  )
}
