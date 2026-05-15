export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  price: number;
  image_url?: string;
  image_path?: string;
  active: boolean;
  created_at?: string;
  updated_at?: string;
}

export type CategoryID = 'Cabelos' | 'Higiene e Cuidados Pessoais' | 'Infantil e Bebê' | 'Beleza e Corpo' | 'Maquiagem';

export type PaymentMethod = 'Pix' | 'Dinheiro' | 'Cartão de Débito' | 'Cartão de Crédito' | 'Boleto';

export interface Category {
  id: string;
  name: string;
  slug: string;
  active: boolean;
  sort_order: number;
}

export interface CartItem {
  id: string;
  name: string;
  brand: string;
  price: number;
  quantity: number;
  image_url?: string;
}

export interface CustomerData {
  name: string;
  phone: string;
  email?: string;
  document?: string;
  address?: string;
  zipCode?: string;
  street?: string;
  number?: string;
  complement?: string;
  neighborhood?: string;
  city?: string;
  state?: string;
  reference?: string;
  paymentMethod?: PaymentMethod;
  changeFor?: number;
  observations?: string;
}

export interface Order {
  id: string;
  order_number?: number;
  customer_name: string;
  customer_document?: string;
  customer_phone: string;
  customer_email?: string;
  customer_address?: string;
  customer_zip_code?: string;
  customer_street?: string;
  customer_number?: string;
  customer_complement?: string;
  customer_neighborhood?: string;
  customer_city?: string;
  customer_state?: string;
  customer_reference?: string;
  payment_method?: string;
  change_for?: number;
  observations?: string;
  total: number;
  status: 'pending' | 'completed' | 'cancelled';
  pdf_url?: string;
  pdf_path?: string;
  created_at?: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  product_name: string;
  quantity: number;
  unit_price: number;
  total_price: number;
}

export interface AppSettings {
  id: string;
  company_name: string;
  whatsapp_number: string;
  description?: string;
  primary_color?: string;
  logo_url?: string;
  logo_path?: string;
  admin_password_hash?: string;
  updated_at?: string;
}

export interface StoreSettings {
  companyName: string;
  whatsappNumber: string;
  logoUrl?: string;
  description: string;
  primaryColor: string;
}
