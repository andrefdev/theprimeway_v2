type AuthSessionHandlers = {
  getToken: () => string | null;
  setTokens: (token: string, refreshToken?: string | null) => void;
  logout: () => Promise<void>;
};

let handlers: AuthSessionHandlers = {
  getToken: () => null,
  setTokens: () => {},
  logout: async () => {},
};

export function configureAuthSession(nextHandlers: AuthSessionHandlers) {
  handlers = nextHandlers;
}

export function getAuthToken() {
  return handlers.getToken();
}

export function setAuthTokens(token: string, refreshToken?: string | null) {
  handlers.setTokens(token, refreshToken);
}

export async function logoutAuthSession() {
  await handlers.logout();
}
