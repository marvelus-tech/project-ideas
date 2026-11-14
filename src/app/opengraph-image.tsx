import { ImageResponse } from "next/og";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpenGraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          background: "#f3f0ea",
          color: "#1c1915",
          padding: 72,
        }}
      >
        <div style={{ fontSize: 28, color: "#c2410c" }}>CNSTRCT</div>
        <div style={{ fontSize: 72, lineHeight: 1.05, maxWidth: 900 }}>Spin up a real business from almost nothing.</div>
      </div>
    ),
    size,
  );
}
