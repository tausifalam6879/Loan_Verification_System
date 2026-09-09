const publicAuthPaths = new Set([
  '/users/login', '/users/register', '/users/auth-config', '/users/test',
  '/users/request-otp', '/users/verify-otp', '/users/verify-firebase-phone'
]);

export const isPublicAuthRequest = (url = '') => publicAuthPaths.has(url.split('?')[0]);
