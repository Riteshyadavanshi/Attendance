import { HR_ROLE_ALIASES, ROLES, type Role } from './constants';

export function isHrRole(roles: string[]): boolean {
  return roles.some((r) => (HR_ROLE_ALIASES as readonly string[]).includes(r));
}

export function hasRole(userRoles: string[] | undefined, ...roles: Role[]): boolean {
  if (!userRoles?.length) return false;
  return roles.some((role) => {
    if (role === ROLES.HR) return isHrRole(userRoles);
    return userRoles.includes(role);
  });
}
