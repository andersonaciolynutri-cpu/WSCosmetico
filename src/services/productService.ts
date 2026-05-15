import { supabase } from '../lib/supabaseClient';
import { Product } from '../types';
import { supabaseStorageService } from './supabaseStorageService';

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

  async getProductById(id: string) {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();

    if (error) throw error;
    return data as Product;
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
    // 1. Buscar o produto para obter o image_path
    const { data: product } = await supabase
      .from('products')
      .select('image_path')
      .eq('id', id)
      .single();

    // 2. Se houver imagem, tentar excluir do storage
    if (product?.image_path) {
      await supabaseStorageService.deleteProductImage(product.image_path).catch(err => {
        console.warn('Erro ao excluir imagem durante a remoção do produto:', err);
      });
    }

    // 3. Excluir o registro da tabela
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) throw error;
  },
};
