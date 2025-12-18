export const session = {
  getToken() {
    return sessionStorage.getItem("token");
  },
  setToken(token) {
    sessionStorage.setItem("token", token);
  },
  clearToken() {
    sessionStorage.removeItem("token");
  },

  getUser() {
    const raw = sessionStorage.getItem("user");
    return raw ? JSON.parse(raw) : null;
  },
  setUser(user) {
    sessionStorage.setItem("user", JSON.stringify(user));
  },
  clearAll() {
    sessionStorage.removeItem("token");
    sessionStorage.removeItem("user");
  },
};
