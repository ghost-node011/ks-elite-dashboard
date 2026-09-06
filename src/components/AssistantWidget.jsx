import { useEffect, useRef, useState } from "react";
import { MessageCircle, Send, Sparkles, X } from "lucide-react";
import { askAssistant, AuthError } from "../lib/adminApi";

const GREETING = {
  role: "assistant",
  content:
    "Hi, I'm your dashboard assistant. Ask me things like \"what's new today\", \"summarize the latest internship applicants\", or \"which contact leads need attention\".",
};

// Same markdown-safety net as the public chatbot — the model is told not to
// use markdown, but render **bold** properly if it slips rather than showing
// literal asterisks. No dangerouslySetInnerHTML.
function renderMessage(content) {
  return content.split("\n").map((line, li, lines) => (
    <span key={li}>
      {line.split(/(\*\*[^*]+\*\*)/g).map((part, pi) =>
        part.startsWith("**") && part.endsWith("**") && part.length > 4 ? (
          <strong key={pi}>{part.slice(2, -2)}</strong>
        ) : (
          part
        )
      )}
      {li < lines.length - 1 && <br />}
    </span>
  ));
}

export default function AssistantWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([GREETING]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const scrollRef = useRef(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [messages, open]);

  const send = async (e) => {
    e.preventDefault();
    const text = input.trim();
    if (!text || sending) return;

    const next = [...messages, { role: "user", content: text }];
    setMessages(next);
    setInput("");
    setError("");
    setSending(true);

    try {
      const { reply } = await askAssistant(next);
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } catch (err) {
      if (err instanceof AuthError) {
        setError("Your session expired — please log in again.");
      } else {
        setError(err.message || "Something went wrong. Please try again.");
      }
    } finally {
      setSending(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label={open ? "Close assistant" : "Open assistant"}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full flex items-center justify-center shadow-lg transition-transform hover:scale-105"
        style={{ background: "var(--accent)", color: "var(--color-navy)" }}
      >
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>

      {open && (
        <div
          className="fixed bottom-24 right-6 z-50 w-[min(380px,calc(100vw-3rem))] rounded-2xl border flex flex-col overflow-hidden shadow-2xl"
          style={{ borderColor: "var(--line)", background: "var(--card)", height: "min(560px, calc(100vh - 10rem))" }}
        >
          <div className="flex items-center gap-2 px-5 py-4 border-b" style={{ borderColor: "var(--line)" }}>
            <Sparkles size={15} style={{ color: "var(--accent)" }} />
            <div>
              <p className="font-display font-bold text-sm">Dashboard Assistant</p>
              <p className="text-xs text-[var(--fg-muted)] mt-0.5">Answers using your real lead & application data</p>
            </div>
          </div>

          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-3">
            {messages.map((m, i) => (
              <div
                key={i}
                className="max-w-[85%] text-sm leading-relaxed rounded-2xl px-4 py-2.5"
                style={
                  m.role === "user"
                    ? { alignSelf: "flex-end", background: "var(--accent)", color: "var(--color-navy)" }
                    : { alignSelf: "flex-start", background: "var(--bg)", border: "1px solid var(--line)" }
                }
              >
                {renderMessage(m.content)}
              </div>
            ))}
            {sending && (
              <div className="self-start text-xs text-[var(--fg-muted)] font-mono uppercase tracking-wide px-1">Thinking…</div>
            )}
            {error && <div className="self-start text-xs text-red-500 px-1">{error}</div>}
          </div>

          <form onSubmit={send} className="p-3 border-t flex items-center gap-2" style={{ borderColor: "var(--line)" }}>
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about leads, applicants…"
              className="flex-1 rounded-full border px-4 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
              style={{ borderColor: "var(--line)", background: "var(--bg)" }}
            />
            <button
              type="submit"
              disabled={sending || !input.trim()}
              aria-label="Send"
              className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 disabled:opacity-50"
              style={{ background: "var(--accent)", color: "var(--color-navy)" }}
            >
              <Send size={15} strokeWidth={2.4} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
