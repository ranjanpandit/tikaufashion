export function hasPermission(admin, permKey) {
  if (!admin) return false;
  if (admin.role === "super_admin") return true;
  return !!admin.permissions?.[permKey];
}

export function requirePermission(admin, permKey) {
  if (!admin) return false;
  if (!permKey) return true;
  return hasPermission(admin, permKey);
}
