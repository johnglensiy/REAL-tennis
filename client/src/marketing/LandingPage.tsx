import { StackNavigator } from "../features/tournament-tracker/StackNavigator";
import DownloadPanel from "./DownloadPanel";

function BrandMark() {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
      <span
        style={{
          width: 16,
          height: 16,
          borderRadius: "50%",
          background: "var(--live)",
          boxShadow: "0 0 0 4px var(--live-soft)",
          display: "inline-block",
        }}
      />
      <span
        style={{
          fontFamily: "var(--display)",
          fontWeight: 700,
          fontSize: 16,
          letterSpacing: "-0.01em",
          color: "var(--t-strong)",
        }}
      >
        Real Tennis
      </span>
    </div>
  );
}

// The extension itself, standalone — the actual StackNavigator UI (stub
// data, no SSE connection needed) at its real panel width, no browser/page
// mockup around it.
function ExtensionPreview() {
  return (
    <div
      className="device-frame"
      style={{
        position: "relative",
        width: 400,
        height: 640,
        borderRadius: "var(--r-lg)",
        overflow: "hidden",
        border: "1px solid var(--hairline)",
        boxShadow: "var(--shadow-panel)",
        margin: 0,
      }}
    >
      <StackNavigator />
    </div>
  );
}

export default function LandingPage() {
  return (
    <div
      style={{
        minHeight: "100svh",
        background: "var(--bg)",
        padding: "48px 32px 64px",
      }}
    >
      <div style={{ maxWidth: 1180, margin: "0 auto" }}>
        <BrandMark />

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "minmax(0, 1.15fr) minmax(320px, 0.85fr)",
            gap: 48,
            marginTop: 40,
            alignItems: "start",
          }}
        >
          <div>
            <h1
              style={{
                fontFamily: "var(--display)",
                fontSize: "clamp(32px, 4vw, 48px)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                lineHeight: 1.08,
                color: "var(--t-strong)",
                margin: "0 0 16px",
              }}
            >
              Live tennis, right on the page you're already watching.
            </h1>
            <p
              style={{
                fontSize: 16,
                lineHeight: 1.55,
                color: "var(--t-mid)",
                maxWidth: 520,
                margin: "0 0 32px",
              }}
            >
              Real Tennis overlays live ATP &amp; WTA scores, point-by-point
              history, and rally detail directly on top of match pages — no
              extra tab, no refreshing.
            </p>

            <ExtensionPreview />
          </div>

          <div style={{ display: "flex", justifyContent: "flex-start" }}>
            <DownloadPanel />
          </div>
        </div>
      </div>
    </div>
  );
}
