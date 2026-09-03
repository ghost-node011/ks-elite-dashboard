import { Component } from "react";

const RELOAD_FLAG = "ks_chunk_reload_attempted";

function isChunkLoadError(error) {
  const msg = String(error?.message || error || "");
  return /dynamically imported module|Failed to fetch|Loading chunk|ChunkLoadError|import\(\)/i.test(msg);
}

// A stale tab still holding an old index.html can try to fetch a JS chunk that
// no longer exists after a redeploy (hashed filenames change every deploy) — that
// failed dynamic import throws during render, and with no boundary React just
// unmounts the tree, leaving a blank page. This catches that, reloads once
// automatically (a fresh load gets the current index.html/chunks), and falls back
// to a friendly retry screen for anything a reload can't fix.
export default class ErrorBoundary extends Component {
  state = { hasError: false };

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error) {
    if (isChunkLoadError(error) && !sessionStorage.getItem(RELOAD_FLAG)) {
      sessionStorage.setItem(RELOAD_FLAG, "1");
      window.location.reload();
      return;
    }
    console.error("Render error caught by ErrorBoundary:", error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="min-h-screen w-full flex flex-col items-center justify-center gap-4 px-6 text-center"
          style={{ background: "var(--color-ivory)" }}
        >
          <p className="font-display font-bold text-xl" style={{ color: "var(--color-navy)" }}>
            Something went wrong loading this page.
          </p>
          <button
            onClick={() => {
              sessionStorage.removeItem(RELOAD_FLAG);
              window.location.reload();
            }}
            className="rounded-full px-6 py-3 text-sm font-semibold"
            style={{ background: "var(--color-gold)", color: "var(--color-navy)" }}
          >
            Reload page
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}
