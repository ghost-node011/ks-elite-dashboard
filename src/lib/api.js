export const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:4000/api";
const API_ORIGIN = API_BASE.replace(/\/api\/?$/, "");

// Local-dev uploads return a path relative to the backend ("/uploads/x.jpg"); in
// production (Cloudinary) they're already absolute URLs and pass through unchanged.
export function resolveImageUrl(url) {
  return url?.startsWith("/uploads/") ? `${API_ORIGIN}${url}` : url;
}
