import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { getTeamMember, createTeamMember, updateTeamMember, uploadImage, AuthError } from "../../lib/adminApi";
import { resolveImageUrl } from "../../lib/api";

export default function AdminTeamEditor() {
  const { id } = useParams();
  const isEdit = Boolean(id);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [title, setTitle] = useState("");
  const [exp, setExp] = useState("");
  const [education, setEducation] = useState("");
  const [bio, setBio] = useState("");
  const [tags, setTags] = useState("");
  const [image, setImage] = useState(null);

  const [loading, setLoading] = useState(isEdit);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const fileRef = useRef(null);

  useEffect(() => {
    if (!isEdit) return;
    getTeamMember(id)
      .then((m) => {
        setName(m.name);
        setTitle(m.title || "");
        setExp(m.exp || "");
        setEducation(m.education || "");
        setBio(m.bio || "");
        setTags((m.tags || []).join(", "));
        setImage(m.image);
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

  const save = async () => {
    if (!name.trim()) return setError("Name is required.");
    setSaving(true);
    setError("");
    const payload = {
      name,
      title,
      exp,
      education,
      bio,
      tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
      image,
    };
    try {
      if (isEdit) {
        await updateTeamMember(id, payload);
      } else {
        await createTeamMember(payload);
      }
      navigate("/team");
    } catch (err) {
      guardAuth(err);
    } finally {
      setSaving(false);
    }
  };

  const uploadPhoto = async (file) => {
    if (!file) return;
    try {
      const { url } = await uploadImage(file);
      setImage(url);
    } catch (err) {
      guardAuth(err);
    } finally {
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  if (loading) return <p className="text-sm text-[var(--fg-muted)]">Loading…</p>;

  return (
    <div className="max-w-xl">
      <button onClick={() => navigate("/team")} className="flex items-center gap-2 text-sm text-[var(--fg-muted)] hover:text-[var(--fg)] mb-6">
        <ArrowLeft size={14} />
        Back to Team
      </button>

      <h1 className="font-display font-bold text-2xl mb-6">{isEdit ? "Edit Team Member" : "New Team Member"}</h1>

      {error && <p className="text-sm text-red-500 mb-4">{error}</p>}

      <div className="flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <button
            onClick={() => fileRef.current?.click()}
            className="flex items-center gap-2 rounded-xl border px-4 py-3 text-sm"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          >
            <ImagePlus size={15} />
            {image ? "Change photo" : "Upload photo"}
          </button>
          <input ref={fileRef} type="file" accept="image/*" hidden onChange={(e) => uploadPhoto(e.target.files?.[0])} />
          {image && <img src={resolveImageUrl(image)} alt="" className="w-14 h-14 rounded-lg object-cover border" style={{ borderColor: "var(--line)" }} />}
        </div>

        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Full name"
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />
        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title (e.g. Senior Associate Partner)"
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />
        <div className="grid sm:grid-cols-2 gap-4">
          <input
            value={exp}
            onChange={(e) => setExp(e.target.value)}
            placeholder="Experience (e.g. 7 years)"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
          <input
            value={education}
            onChange={(e) => setEducation(e.target.value)}
            placeholder="Education / credentials"
            className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
            style={{ borderColor: "var(--line)", background: "var(--card)" }}
          />
        </div>
        <textarea
          value={bio}
          onChange={(e) => setBio(e.target.value)}
          placeholder="Short bio"
          rows={4}
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)] resize-y"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />
        <input
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Practice tags, comma separated (e.g. Bail, Civil, Family)"
          className="rounded-xl border px-4 py-3 text-sm outline-none focus:border-[var(--accent)]"
          style={{ borderColor: "var(--line)", background: "var(--card)" }}
        />

        <button
          onClick={save}
          disabled={saving}
          className="self-start rounded-full px-6 py-3 text-sm font-semibold disabled:opacity-60"
          style={{ background: "var(--accent)", color: "var(--color-navy)" }}
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>
    </div>
  );
}
