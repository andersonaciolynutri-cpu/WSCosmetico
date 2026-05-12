const ADMIN_SESSION_KEY = 'ws_admin_session';
const ADMIN_PASSWORD_KEY = 'ws_admin_password';
const DEFAULT_ADMIN_PASSWORD = 'WS@2026';

export const adminAuth = {
  getAdminPassword(): string {
    return localStorage.getItem(ADMIN_PASSWORD_KEY) || DEFAULT_ADMIN_PASSWORD;
  },

  validateAdminPassword(password: string): boolean {
    return password === this.getAdminPassword();
  },

  updateAdminPassword(currentPassword: string, newPassword: string, confirmPassword: string) {
    if (currentPassword !== this.getAdminPassword()) {
      throw new Error('Senha atual incorreta.');
    }

    if (!newPassword || newPassword.length < 6) {
      throw new Error('A nova senha precisa ter no mínimo 6 caracteres.');
    }

    if (newPassword !== confirmPassword) {
      throw new Error('As senhas não coincidem.');
    }

    localStorage.setItem(ADMIN_PASSWORD_KEY, newPassword);
  },

  isAdminLoggedIn(): boolean {
    return localStorage.getItem(ADMIN_SESSION_KEY) === 'true';
  },

  loginAdmin() {
    localStorage.setItem(ADMIN_SESSION_KEY, 'true');
  },

  logoutAdmin() {
    localStorage.removeItem(ADMIN_SESSION_KEY);
  }
};
