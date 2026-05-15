import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';

export const productService = {
  async getActiveProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('active', true)
      .order('name');

    if (error) throw error;
    return data as Product[];
  },

  async getAllProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');

    if (error) throw error;
    return data as Product[];
  },

  async createProduct(product: Omit<Product, 'id' | 'created_at' | 'updated_at'>) {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async updateProduct(id: string, product: Partial<Product>) {
    const { data, error } = await supabase
      .from('products')
      .update({ ...product, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data as Product;
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
