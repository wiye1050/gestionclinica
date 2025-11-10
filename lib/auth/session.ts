export const SESSION_COOKIE_NAME = 'gc_session';
export const SESSION_COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 5; // 5 días

export const isAuthConfigured = () =>
  Boolean(
    process.env.FIREBASE_SERVICE_ACCOUNT_KEY ||
      (process.env.FIREBASE_ADMIN_PROJECT_ID &&
        process.env.FIREBASE_ADMIN_CLIENT_EMAIL &&
        process.env.FIREBASE_ADMIN_PRIVATE_KEY)
  );
