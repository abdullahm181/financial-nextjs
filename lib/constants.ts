/**
 * Application-wide constants.
 * Keep route paths, magic numbers, and shared strings here
 * instead of scattering them across components.
 */

export const ROUTES = {
  home: "/",
  login: "/login",
  dashboard: "/dashboard",
  summary: "/summary",
} as const;

export const DEFAULT_CURRENCY = "IDR";
export const DEFAULT_LOCALE = "id-ID";
