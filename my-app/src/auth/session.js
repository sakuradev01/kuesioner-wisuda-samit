const KEY_TOKEN = "token";
const KEY_USER = "user";
const KEY_ROLE = "role";

export const session = {
  // token (student)
  getToken() {
    return localStorage.getItem(KEY_TOKEN);
  },
  setToken(token) {
    localStorage.setItem(KEY_TOKEN, token);
  },

  // user (student)
  getUser() {
    const raw = localStorage.getItem(KEY_USER);
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    localStorage.setItem(KEY_USER, JSON.stringify(user));
  },

  // role
  getRole() {
    return localStorage.getItem(KEY_ROLE);
  },
  setRole(role) {
    localStorage.setItem(KEY_ROLE, role);
  },

  clearAll() {
    localStorage.removeItem(KEY_TOKEN);
    localStorage.removeItem(KEY_USER);
    localStorage.removeItem(KEY_ROLE);
  },
};