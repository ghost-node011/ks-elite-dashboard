import { createContext, useContext } from "react";

const AdminUserContext = createContext(null);

export const AdminUserProvider = AdminUserContext.Provider;

// { email, label, permissions } while loading is null; permissions is either
// ["*"] (superadmin) or a subset of the section keys in permissions.js.
export function useAdminUser() {
  return useContext(AdminUserContext);
}

export function hasPermission(user, section) {
  if (!user) return false;
  return user.permissions.includes("*") || user.permissions.includes(section);
}
