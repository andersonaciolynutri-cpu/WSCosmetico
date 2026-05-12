import { Product, StoreSettings } from './types';
import { PRODUCTS as INITIAL_PRODUCTS } from './data/products';

const PRODUCTS_KEY = 'ws_products';
const SETTINGS_KEY = 'ws_settings';
const ADMIN_SESSION_KEY = 'ws_admin_session';
const ADMIN_PASSWORD_KEY = 'ws_admin_password';

const DEFAULT_ADMIN_PASSWORD = 'WS@2026';

const DEFAULT_SETTINGS: StoreSettings = {
  companyName: 'WS Cosméticos',
  whatsappNumber: '5521966972428',
  logoUrl: '/logo.png',
  description: 'Distribuidora de cosméticos para lojas e revendedores.',
  primaryColor: '#2563eb'
};

export const storageService = {
  // Products
  getProducts(): Product[] {
    const stored = localStorage.getItem(PRODUCTS_KEY);
    if (!stored) {
      const initial = INITIAL_PRODUCTS.map(p => ({ ...p, active: true }));
      this.saveProducts(initial);
      return initial;
    }
    return JSON.parse(stored);
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(PRODUCTS_KEY, JSON.stringify(products));
  },

  // Settings
  getSettings(): StoreSettings {
    const stored = localStorage.getItem(SETTINGS_KEY);
    if (!stored) {
      this.saveSettings(DEFAULT_SETTINGS);
      return DEFAULT_SETTINGS;
    }
    return JSON.parse(stored);
  },

  saveSettings(settings: StoreSettings) {
    localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
  }
};
