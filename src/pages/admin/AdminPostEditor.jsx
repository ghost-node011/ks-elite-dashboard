import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus, Images, Pencil, Plus, Sparkles, Trash2, Upload, Wand2 } from "lucide-react";
import {
  getPost,
  createPost,
  updatePost,
  draftPost,
  fixSectionHtml,
  suggestHeroImages,
  parseDocument,
  uploadImage,
  AuthError,
} from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";
import RichTextEditor from "../../components/RichTextEditor";

const CATEGORIES = [
  "Technology",
  "Inter-State Dispute",
  "Courts",
  "Laws",
  "Divorce",
  "Casteism",
  "Minority Educational Institutions",
  "Writs",
  "Intellectual Property",
];

export default function AdminPostEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [title, setTitle] = useState("");
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [excerpt, setExcerpt] = useState("");
  const [authorName, setAuthorName] = useState("");
  const [authorLinkedIn, setAuthorLinkedIn] = useState("");
  const [heroImage, setHeroImage] = useState(null);
  const [sections, setSections] = useState([{ text: "<p></p>", image: null }]);
  const [published, setPublished] = useState(false);
  // Published posts open read-only so they can't be accidentally edited; the
  // pencil button switches into edit mode. Drafts and new posts are always editable.
  const [editMode, setEditMode] = useState(!isEdit);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [aiTopic, setAiTopic] = useState("");
  const [aiNotes, setAiNotes] = useState("");
  const [aiBusy, setAiBusy] = useState(false);

  const [importBusy, setImportBusy] = useState(false);
  const [fixingIndex, setFixingIndex] = useState(null);
  const [imageSuggestions, setImageSuggestions] = useState(null);
  const [suggestingImages, setSuggestingImages] = useState(false);
  const heroFileRef = useRef(null);
  const docFileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    getPost(id)
      .then((p) => {
        setTitle(p.title);
        setCategory(p.category);
        setExcerpt(p.excerpt || "");
        setAuthorName(p.authorName || "");
        setAuthorLinkedIn(p.authorLinkedIn || "");
        setHeroImage(p.heroImage);
        setSections(p.sections?.length ? p.sections : [{ text: "<p></p>", image: null }]);
        setPublished(p.published);
        setEditMode(!p.published);
      })
      .catch((err) => {
        if (err instanceof AuthError) return navigate("/login", { replace: true });
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [id]);

  const guardAuth = (err) => {
    if (err instanceof AuthError) {
      navigate("/login", { replace: true });
      return true;
    }
    setError(err.message);
    return false;
  };

  const save = async (publishNow) => {
    if (!title.trim()) return setError("Title is required.");
    setSaving(true);
    setError("");
    const payload = {
      title,
      category,
      excerpt,
      authorName,
      authorLinkedIn,
      heroImage,
      sections,
      published: publishNow ?? published,
    };
    try {
      if (isEdit) {
        await updatePost(id, payload);
      } else {
        const created = await createPost(payload);
        navigate(`/posts/${created.id}/edit`, { replace: true });
      }
      if (publishNow !== undefined) setPublished(publishNow);
      if (publishNow === true) setEditMode(false);
    } catch (err) {
      guardAuth(err);
    } finally {
      setSaving(false);
    }
  };

  const runAiDraft = async () => {
    if (!aiTopic.trim()) return setError("Give the AI a topic first.");
    if (!aiNotes.trim()) return setError("Add a description or key points — a bare topic isn't enough for a good draft.");
    setAiBusy(true);
    setError("");
    try {
      const draft = await draftPost(aiTopic, aiNotes);
      setTitle(draft.title);
      setExcerpt(draft.excerpt);
      setCategory(draft.category);
      setSections(draft.sections.length ? draft.sections : [{ text: "<p></p>", image: null }]);
    } catch (err) {
      guardAuth(err);
    } finally {
      setAiBusy(false);
    }
  };

  const runImport = async (file) => {
    if (!file) return;
    setImportBusy(true);
    setError("");
    try {
      const parsed = await parseDocument(file);
      setTitle(parsed.title);
      setHeroImage(parsed.heroImage);
      setSections(parsed.sections.length ? parsed.sections : [{ text: "<p></p>", image: null }]);
    } catch (err) {
      guardAuth(err);
    } finally {
      setImportBusy(false);
      if (docFileRef.current) docFileRef.current.value = "";
    }
  };

  const suggestImages = async () => {
    if (!title.trim()) return setError("Give the post a title first, so the AI knows what to search for.");
    setSuggestingImages(true);
    setError("");
    try {
      const { results } = await suggestHeroImages(title, category, excerpt);
      setImageSuggestions(results);
    } catch (err) {
      guardAuth(err);
    } finally {
      setSuggestingImages(false);
    }
  };

  const pickSuggestedImage = (url) => {
    setHeroImage(url);
    setImageSuggestions(null);
  };

  const uploadHero = async (file) => {
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      setHeroImage(url);
    } catch (err) {
      guardAuth(err);
    } finally {
      if (heroFileRef.current) heroFileRef.current.value = "";
    }
  };

  const updateSection = (i, patch) => setSections((prev) => prev.map((s, idx) => (idx === i ? { ...s, ...patch } : s)));
  const addSection = () => setSections((prev) => [...prev, { text: "<p></p>", image: null }]);
  const removeSection = (i) => setSections((prev) => prev.filter((_, idx) => idx !== i));
  const moveSection = (i, dir) =>
    setSections((prev) => {
      const next = [...prev];
      const j = i + dir;
      if (j < 0 || j >= next.length) return prev;
      [next[i], next[j]] = [next[j], next[i]];
      return next;
    });

  const uploadSectionImage = async (i, file) => {
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      updateSection(i, { image: url });
    } catch (err) {
      guardAuth(err);
    }
  };

  const fixSection = async (i) => {
    const current = sections[i]?.text?.trim();
    if (!current) return;
    setFixingIndex(i);
    setError("");
    try {
      const { html } = await fixSectionHtml(current);
      updateSection(i, { text: html });
    } catch (err) {
      guardAuth(err);
    } finally {
      setFixingIndex(null);
    }
  };

  if (loading) return <p className="text-sm text-[var(--fg-muted)]">Loading…</p>;

  return (
    <div className="max-w-4xl">
      <button
        onClick={() => navigate("/posts")}
        className="flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6"
      >
        <ArrowLeft size={14} />
        Back to Posts
      </button>

      <div className="flex items-center justify-between mb-6 gap-4">
        <h1 className="font-display font-bold text-2xl">{isEdit ? title || "Edit Post" : "New Post"}</h1>
        {isEdit && (
          <div className="flex items-center gap-3 shrink-0">
            <span
              className="rounded-full px-3 py-1 text-xs font-mono uppercase tracking-wide"
              style={published ? { background: "rgba(34,197,94,0.15)", color: "#16a34a" } : { background: "var(--bg)", color: "var(--fg-muted)", border: "1px solid var(--line)" }}
            >
              {published ? "Published" : "Draft"}
            </span>
            {!editMode && (
              <button
                onClick={() => setEditMode(true)}
                className="flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium"
                style={{ borderColor: "var(--line)" }}
              >
                <Pencil size={12} />
                Edit
              </button>
            )}
          </div>
        )}
      </div>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      {!editMode ? (
        <div className="rounded-2xl border overflow-hidden" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
          {heroImage && (
            <div className="aspect-[21/9] overflow-hidden">
              <img src={resolveImageUrl(heroImage)} alt="" className="w-full h-full object-cover" />
            </div>
          )}
          <div className="p-6 sm:p-8">
            <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">{category}</span>
            {excerpt && <p className="text-[var(--fg-muted)] mt-3 italic">{excerpt}</p>}
            {authorName && (
              <p className="text-sm mt-3">
                By {authorName}
                {authorLinkedIn && (
                  <>
                    {" · "}
                    <a href={authorLinkedIn} target="_blank" rel="noreferrer" className="hover:text-[var(--accent)] underline">
                      LinkedIn
                    </a>
                  </>
                )}
              </p>
            )}
            <div className="prose-blog mt-6">
              {sections.map((s, i) => (
                <div key={i}>
                  {s.text && <div dangerouslySetInnerHTML={{ __html: s.text }} />}
                  {s.image && (
                    <img src={resolveImageUrl(s.image)} alt="" className="rounded-xl my-6 w-full border" style={{ borderColor: "var(--line)" }} />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      ) : (
        <>
      {/* AI draft assist */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <p className="flex items-center gap-2 font-display font-semibold text-sm mb-3">
          <Sparkles size={15} style={{ color: "var(--accent)" }} />
          Draft with AI
        </p>
        <div className="grid sm:grid-cols-2 gap-3 mb-3">
          <input
            value={aiTopic}
            onChange={(e) => setAiTopic(e.target.value)}
            placeholder="Topic (e.g. Bail provisions under BNSS)"
            className="rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
          />
          <textarea
            value={aiNotes}
            onChange={(e) => setAiNotes(e.target.value)}
            placeholder="Description / key points to cover (required) — the more specific, the better the draft"
            rows={2}
            className="rounded-xl border px-3.5 py-2.5 text-sm outline-none focus:border-[var(--accent)] resize-none"
            style={{ borderColor: "var(--line)", background: "var(--bg)" }}
          />
        </div>
        <div className="flex justify-end">
          <button
            onClick={runAiDraft}
            disabled={aiBusy}
            className="rounded-xl px-4 py-2.5 text-sm font-semibold disabled:opacity-60 whitespace-nowrap"
            style={{ background: "var(--accent)", color: "var(--color-navy)" }}
          >
            {aiBusy ? "Writing…" : "Generate"}
          </button>
        </div>
        <p className="text-xs text-[var(--fg-muted)] mt-2">Replaces the title, excerpt, category, and sections below with an AI-written draft you can edit.</p>
      </div>

      {/* Document import */}
      <div className="rounded-2xl border p-5 mb-6" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
        <p className="flex items-center gap-2 font-display font-semibold text-sm mb-3">
          <Upload size={15} style={{ color: "var(--accent)" }} />
          Import from Document
        </p>
        <input
          ref={docFileRef}
          type="file"
          accept=".docx,.pdf,.pptx"
          onChange={(e) => runImport(e.target.files?.[0])}
          disabled={importBusy}
          className="text-sm"
        />
        {importBusy && <p className="text-xs text-[var(--fg-muted)] mt-2">Parsing document…</p>}
        <p className="text-xs text-[var(--fg-muted)] mt-2">Upload a DOCX, PDF, or PPTX and its content becomes the title, hero image, and sections below.</p>
      </div>

      {/* Core fields */}
      <div className="flex flex-col gap-4 mb-6">
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Post title"
          className="rounded-xl border px-4 py-3 text-lg font-display font-semibold outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>

          <div className="flex items-center gap-3">
            <button
              onClick={() => heroFileRef.current?.click()}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
              style={{ borderColor: "var(--line)", background: "var(--card)" }}
            >
              <ImagePlus size={15} />
              {heroImage ? "Change" : "Upload hero image"}
            </button>
            <input ref={heroFileRef} type="file" accept="image/*" hidden onChange={(e) => uploadHero(e.target.files?.[0])} />
            <button
              onClick={suggestImages}
              disabled={suggestingImages}
              className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm disabled:opacity-60"
              style={{ borderColor: "var(--line)", background: "var(--card)", color: "var(--accent)" }}
            >
              <Images size={15} />
              {suggestingImages ? "Searching…" : "Suggest Images"}
            </button>
            {heroImage && (
              <img src={resolveImageUrl(heroImage)} alt="" className="w-12 h-12 rounded-lg object-cover border shrink-0" style={{ borderColor: "var(--line)" }} />
            )}
          </div>
        </div>

        {imageSuggestions && (
          <div className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs text-[var(--fg-muted)]">Pick one for the hero image:</p>
              <button onClick={() => setImageSuggestions(null)} className="text-xs text-[var(--fg-muted)] hover:text-[var(--fg)]">
                Dismiss
              </button>
            </div>
            <div className="grid grid-cols-5 gap-2">
              {imageSuggestions.map((img, i) => (
                <button
                  key={i}
                  onClick={() => pickSuggestedImage(img.url)}
                  className="group relative aspect-video rounded-lg overflow-hidden border hover:border-[var(--accent)]"
                  style={{ borderColor: "var(--line)" }}
                  title={img.photographer ? `Photo by ${img.photographer} on Unsplash` : undefined}
                >
                  <img src={img.thumbUrl} alt={img.description} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
            <p className="text-[10px] text-[var(--fg-muted)] mt-2">Photos via Unsplash</p>
          </div>
        )}

        <textarea
          value={excerpt}
          onChange={(e) => setExcerpt(e.target.value)}
          placeholder="Excerpt — one or two sentences shown on the blog list"
          rows={2}
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)] resize-none"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />

        <div className="grid sm:grid-cols-2 gap-4">
          <input
            value={authorName}
            onChange={(e) => setAuthorName(e.target.value)}
            placeholder="Author name (optional)"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
          <input
            value={authorLinkedIn}
            onChange={(e) => setAuthorLinkedIn(e.target.value)}
            placeholder="Author LinkedIn URL (optional)"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </div>
      </div>

      {/* Sections */}
      <div className="flex flex-col gap-4 mb-6">
        <p className="font-display font-semibold text-sm">Content Sections</p>
        {sections.map((s, i) => (
          <div key={i} className="rounded-2xl border p-4" style={{ borderColor: "var(--line)", background: "var(--card)" }}>
            <div className="flex items-center justify-between mb-2">
              <span className="font-mono text-[11px] uppercase tracking-wide text-[var(--fg-muted)]">Section {i + 1}</span>
              <div className="flex items-center gap-3 text-[var(--fg-muted)]">
                <button onClick={() => moveSection(i, -1)} disabled={i === 0} className="disabled:opacity-30 text-xs">
                  ↑
                </button>
                <button onClick={() => moveSection(i, 1)} disabled={i === sections.length - 1} className="disabled:opacity-30 text-xs">
                  ↓
                </button>
                <label className="cursor-pointer hover:text-[var(--accent)]">
                  <ImagePlus size={14} />
                  <input type="file" accept="image/*" hidden onChange={(e) => uploadSectionImage(i, e.target.files?.[0])} />
                </label>
                <button onClick={() => removeSection(i)} className="hover:text-red-500">
                  <Trash2 size={14} />
                </button>
              </div>
            </div>
            <RichTextEditor
              value={s.text}
              onChange={(html) => updateSection(i, { text: html })}
              placeholder="Write the section content — use the toolbar for bold, headings, and lists."
            />
            <button
              onClick={() => fixSection(i)}
              disabled={fixingIndex === i || !s.text?.trim()}
              className="mt-2 flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-medium disabled:opacity-50"
              style={{ borderColor: "var(--line)", color: "var(--accent)" }}
            >
              <Wand2 size={12} />
              {fixingIndex === i ? "Fixing…" : "Fix with AI"}
            </button>
            {s.image && (
              <img src={resolveImageUrl(s.image)} alt="" className="mt-2 h-20 rounded-lg object-cover border" style={{ borderColor: "var(--line)" }} />
            )}
          </div>
        ))}
        <button
          onClick={addSection}
          className="flex items-center gap-2 self-start rounded-full border px-4 py-2 text-sm"
          style={{ borderColor: "var(--line)", color: "var(--fg-muted)" }}
        >
          <Plus size={14} />
          Add Section
        </button>
      </div>

      {/* Save actions */}
      <div className="flex items-center gap-3 sticky bottom-0 py-4" style={{ background: "var(--bg)" }}>
        <button
          onClick={() => save(false)}
          disabled={saving}
          className="rounded-full border px-6 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ borderColor: "var(--line)" }}
        >
          Save Draft
        </button>
        <button
          onClick={() => save(true)}
          disabled={saving}
          className="rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          {saving ? "Saving…" : published ? "Update & Keep Published" : "Publish"}
        </button>
      </div>
        </>
      )}
    </div>
  );
}
