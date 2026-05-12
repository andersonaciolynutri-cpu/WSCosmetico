export interface Product {
  id: string;
  name: string;
  brand: string;
  category: CategoryID;
  price: number;
  imageUrl?: string;
  imageDataUrl?: string;
  active: boolean;
}

export type CategoryID = 'Make' | 'Cabelo' | 'Higiene Pessoal' | 'Beleza' | 'Bebê';

export interface CartItem extends Product {
  quantity: number;
}

export interface CustomerData {
  name: string;
  phone: string;
  storeName?: string;
  document?: string;
  address?: string;
  observation?: string;
}

export interface StoreSettings {
  companyName: string;
  whatsappNumber: string;
  logoUrl?: string;
  logoDataUrl?: string;
  description: string;
  primaryColor: string;
}
