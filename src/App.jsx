import { lazy, Suspense, useEffect } from "react";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import ScrollToTop from "./components/ScrollToTop";
import ErrorBoundary from "./components/ErrorBoundary";
import Loader from "./components/Loader";

const AdminLogin = lazy(() => import("./pages/admin/AdminLogin"));
const AdminGuard = lazy(() => import("./pages/admin/AdminGuard"));
const AdminLayout = lazy(() => import("./pages/admin/AdminLayout"));
const AdminLeads = lazy(() => import("./pages/admin/AdminLeads"));
const AdminPosts = lazy(() => import("./pages/admin/AdminPosts"));
const AdminPostEditor = lazy(() => import("./pages/admin/AdminPostEditor"));
const AdminTeam = lazy(() => import("./pages/admin/AdminTeam"));
const AdminTeamEditor = lazy(() => import("./pages/admin/AdminTeamEditor"));
const AdminTestimonials = lazy(() => import("./pages/admin/AdminTestimonials"));
const AdminTestimonialEditor = lazy(() => import("./pages/admin/AdminTestimonialEditor"));
const AdminSubscribers = lazy(() => import("./pages/admin/AdminSubscribers"));
const AdminAnalytics = lazy(() => import("./pages/admin/AdminAnalytics"));
const AdminUsers = lazy(() => import("./pages/admin/AdminUsers"));

export default function App() {
  // A successful mount means chunks loaded fine — clear the one-time reload
  // flag so a future stale-chunk failure (after the next deploy) can also
  // trigger exactly one auto-reload instead of going straight to the fallback.
  useEffect(() => {
    sessionStorage.removeItem("ks_chunk_reload_attempted");
  }, []);

  return (
    <BrowserRouter>
      <ScrollToTop />
      <ErrorBoundary>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login" element={<AdminLogin />} />
            <Route
              path="/"
              element={
                <AdminGuard>
                  <AdminLayout />
                </AdminGuard>
              }
            >
              <Route index element={<Navigate to="leads" replace />} />
              <Route path="leads" element={<AdminLeads />} />
              <Route path="posts" element={<AdminPosts />} />
              <Route path="posts/new" element={<AdminPostEditor />} />
              <Route path="posts/:id/edit" element={<AdminPostEditor />} />
              <Route path="team" element={<AdminTeam />} />
              <Route path="team/new" element={<AdminTeamEditor />} />
              <Route path="team/:id/edit" element={<AdminTeamEditor />} />
              <Route path="testimonials" element={<AdminTestimonials />} />
              <Route path="testimonials/new" element={<AdminTestimonialEditor />} />
              <Route path="testimonials/:id/edit" element={<AdminTestimonialEditor />} />
              <Route path="subscribers" element={<AdminSubscribers />} />
              <Route path="analytics" element={<AdminAnalytics />} />
              <Route path="users" element={<AdminUsers />} />
            </Route>
          </Routes>
        </Suspense>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
