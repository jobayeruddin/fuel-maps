import { forbidden, redirect } from "next/navigation";

import { ROLES } from "./authorization";

export function requireAuthPage(session) {
  if (!session?.user) {
    redirect("/login");
  }
  return session.user;
}

export function requireRolePage(session, ...allowedRoles) {
  const user = requireAuthPage(session);
  if (!allowedRoles.includes(user.role)) {
    forbidden();
  }
  return user;
}

export function requireUserPage(session) {
  return requireRolePage(session, ROLES.USER, ROLES.OPERATOR, ROLES.ADMIN);
}

export function requireOperatorPage(session) {
  return requireRolePage(session, ROLES.OPERATOR, ROLES.ADMIN);
}

export function requireAdminPage(session) {
  return requireRolePage(session, ROLES.ADMIN);
}
