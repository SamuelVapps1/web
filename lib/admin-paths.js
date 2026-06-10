function normalizePath(pathname) {
  return pathname.replace(/\/+$/, '') || '/';
}

export function isAdminLoginPath(pathname) {
  return normalizePath(pathname) === '/admin/login';
}

export function isProtectedAdminPath(pathname) {
  const normalized = normalizePath(pathname);
  return (
    (normalized === '/admin' || normalized.startsWith('/admin/')) &&
    !isAdminLoginPath(normalized)
  );
}

export function buildAdminLoginRedirectPath(pathname) {
  const nextPath = normalizePath(pathname);
  const params = new URLSearchParams();
  params.set('next', nextPath);
  return `/admin/login?${params.toString()}`;
}
