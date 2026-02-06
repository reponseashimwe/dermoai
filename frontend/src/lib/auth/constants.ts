export const ROLES = {
  USER: "USER",
  PRACTITIONER: "PRACTITIONER",
  ADMIN: "ADMIN",
} as const;

export const PRACTITIONER_TYPES = {
  GENERAL: "GENERAL",
  SPECIALIST: "SPECIALIST",
} as const;

export const AUTH_STORAGE_KEYS = {
  ACCESS_TOKEN: "dermoai_access_token",
  REFRESH_TOKEN: "dermoai_refresh_token",
} as const;
