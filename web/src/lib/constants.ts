export const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE_URL ?? 'https://attendance-backend-0zqg.onrender.com';

export const ROLES = {
  EMPLOYEE: 'employee',
  HR: 'hr',
} as const;

export const HR_ROLE_ALIASES = ['hr', 'hr_manager', 'head_hr', 'super_admin'] as const;

export type Role = (typeof ROLES)[keyof typeof ROLES] | (typeof HR_ROLE_ALIASES)[number];
