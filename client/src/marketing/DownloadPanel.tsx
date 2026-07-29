const STEPS = [
  "Download the extension (button above will link to the .zip once it's packaged).",
  "Unzip it somewhere you'll remember, e.g. ~/Downloads/real-tennis.",
  "Open a new tab and go to chrome://extensions.",
  'Turn on "Developer mode" — the toggle is in the top-right corner.',
  'Click "Load unpacked" and select the unzipped folder.',
  "Pin it from the extensions toolbar icon — it'll light up on any live match page.",
];

export default function DownloadPanel() {
  return (
    <div
      style={{
        width: "100%",
        maxWidth: 420,
        background: "var(--panel-solid)",
        border: "1px solid var(--hairline)",
        borderRadius: "var(--r-lg)",
        boxShadow: "var(--shadow-panel)",
        padding: "28px 28px 24px",
      }}
    >
      <h2
        style={{
          fontFamily: "var(--display)",
          fontSize: 22,
          fontWeight: 700,
          letterSpacing: "-0.01em",
          color: "var(--t-strong)",
          margin: 0,
        }}
      >
        Get the extension
      </h2>
      <p
        style={{
          fontSize: 13.5,
          color: "var(--t-mid)",
          lineHeight: 1.5,
          marginTop: 8,
          marginBottom: 22,
        }}
      >
        Real Tennis isn't on the Chrome Web Store yet. Load it manually in
        developer mode — it takes about a minute.
      </p>

      <button
        disabled
        title="Packaging isn't ready yet — check back soon"
        style={{
          width: "100%",
          padding: "13px 16px",
          borderRadius: "var(--r-sm)",
          border: "1px solid var(--hairline-strong)",
          background: "var(--surface-2)",
          color: "var(--t-dim)",
          fontFamily: "var(--display)",
          fontWeight: 600,
          fontSize: 14,
          letterSpacing: "-0.005em",
          cursor: "not-allowed",
        }}
      >
        Download for Chrome — coming soon
      </button>

      <div
        style={{
          marginTop: 24,
          paddingTop: 20,
          borderTop: "1px solid var(--hairline)",
        }}
      >
        <div
          className="mono"
          style={{
            fontSize: 10.5,
            color: "var(--t-dim)",
            letterSpacing: "0.08em",
            textTransform: "uppercase",
            marginBottom: 12,
          }}
        >
          Manual install (developer mode)
        </div>
        <ol style={{ margin: 0, padding: 0, listStyle: "none" }}>
          {STEPS.map((step, i) => (
            <li
              key={i}
              style={{
                display: "flex",
                gap: 10,
                alignItems: "flex-start",
                padding: "8px 0",
                borderTop: i > 0 ? "1px dashed var(--hairline)" : "none",
              }}
            >
              <span
                className="mono"
                style={{
                  flexShrink: 0,
                  width: 18,
                  height: 18,
                  borderRadius: "50%",
                  border: "1px solid var(--hairline-strong)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: 10,
                  color: "var(--t-mid)",
                  marginTop: 1,
                }}
              >
                {i + 1}
              </span>
              <span style={{ fontSize: 13, color: "var(--t-mid)", lineHeight: 1.45 }}>
                {step}
              </span>
            </li>
          ))}
        </ol>
      </div>
    </div>
  );
}
