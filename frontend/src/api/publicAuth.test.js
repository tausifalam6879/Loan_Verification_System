import { isPublicAuthRequest } from './publicAuth';

test('only exact public authentication paths omit a saved session', () => {
  expect(isPublicAuthRequest('/users/login')).toBe(true);
  expect(isPublicAuthRequest('/users/auth-config?refresh=1')).toBe(true);
  expect(isPublicAuthRequest('/users/me')).toBe(false);
  expect(isPublicAuthRequest('/users/session')).toBe(false);
  expect(isPublicAuthRequest('/users/login/other')).toBe(false);
  expect(isPublicAuthRequest()).toBe(false);
});
