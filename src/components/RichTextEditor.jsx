import { useEffect, useRef } from "react";
import { Bold, Italic, Underline, List, ListOrdered, Link2, Heading2, RemoveFormatting } from "lucide-react";

const BUTTONS = [
  { icon: Bold, command: "bold", label: "Bold" },
  { icon: Italic, command: "italic", label: "Italic" },
  { icon: Underline, command: "underline", label: "Underline" },
  { icon: Heading2, command: "formatBlock", arg: "h2", label: "Heading" },
  { icon: List, command: "insertUnorderedList", label: "Bullet list" },
  { icon: ListOrdered, command: "insertOrderedList", label: "Numbered list" },
];

// Staff who aren't developers were seeing raw <p> tags in a plain textarea —
// this swaps that for a visual editor (bold/italic/lists) backed by the same
// contentEditable + execCommand approach as most lightweight WYSIWYG widgets,
// so no new dependency is needed for a handful of formatting commands.
export default function RichTextEditor({ value, onChange, placeholder }) {
  const ref = useRef(null);
  const lastValue = useRef(value);

  useEffect(() => {
    if (ref.current && value !== lastValue.current && value !== ref.current.innerHTML) {
      ref.current.innerHTML = value || "";
      lastValue.current = value;
    }
  }, [value]);

  const emit = () => {
    const html = ref.current?.innerHTML ?? "";
    lastValue.current = html;
    onChange(html);
  };

  const run = (command, arg) => {
    ref.current?.focus();
    document.execCommand(command, false, arg);
    emit();
  };

  const addLink = () => {
    const url = window.prompt("Link URL");
    if (url) run("createLink", url);
  };

  const clearFormatting = () => run("removeFormat");

  return (
    <div className="rounded-xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--bg)" }}>
      <div className="flex items-center gap-1 px-2 py-1.5 border-b" style={{ borderColor: "var(--line)" }}>
        {BUTTONS.map(({ icon: Icon, command, arg, label }) => (
          <button
            key={label}
            type="button"
            title={label}
            onMouseDown={(e) => e.preventDefault()}
            onClick={() => run(command, arg)}
            className="p-1.5 rounded-lg hover:bg-[var(--card)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
          >
            <Icon size={14} />
          </button>
        ))}
        <button
          type="button"
          title="Link"
          onMouseDown={(e) => e.preventDefault()}
          onClick={addLink}
          className="p-1.5 rounded-lg hover:bg-[var(--card)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <Link2 size={14} />
        </button>
        <button
          type="button"
          title="Clear formatting"
          onMouseDown={(e) => e.preventDefault()}
          onClick={clearFormatting}
          className="p-1.5 rounded-lg hover:bg-[var(--card)] text-[var(--fg-muted)] hover:text-[var(--fg)]"
        >
          <RemoveFormatting size={14} />
        </button>
      </div>
      <div
        ref={ref}
        contentEditable
        suppressContentEditableWarning
        onInput={emit}
        onBlur={emit}
        data-placeholder={placeholder}
        className="prose-blog rte-editable px-3.5 py-3 text-sm outline-none min-h-[120px] max-h-[400px] overflow-y-auto"
      />
    </div>
  );
}
