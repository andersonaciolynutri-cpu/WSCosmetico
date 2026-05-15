import { supabase } from '../lib/supabaseClient';

export const supabaseStorageService = {
  createSlug(text: string): string {
    return text
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '') // Remove acentos
      .replace(/[^a-z0-9\s-]/g, '') // Remove caracteres especiais
      .replace(/\s+/g, '-') // Troca espaços por hífen
      .replace(/-+/g, '-') // Evita hífens duplicados
      .replace(/^-+|-+$/g, ''); // Remove hífen no início e fim
  },

  buildProductImagePath(productId: string, productName: string): string {
    const slug = this.createSlug(productName);
    const shortId = productId.substring(0, 8);
    return `products/${slug}-${shortId}.webp`;
  },

  async uploadProductImage(file: File, productId: string, productName: string) {
    if (file.size > 2 * 1024 * 1024) throw new Error('Imagem muito grande. Limite de 2MB.');
    
    const filePath = this.buildProductImagePath(productId, productName);

    const { data, error } = await supabase.storage
      .from('product-images')
      .upload(filePath, file, {
        upsert: true,
        contentType: 'image/webp'
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('product-images')
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
    };
  },

  async deleteProductImage(path: string) {
    if (!path) return false;
    try {
      const { error } = await supabase.storage
        .from('product-images')
        .remove([path]);

      if (error) {
        console.warn('Erro ao remover imagem do storage:', error);
        return false;
      }
      return true;
    } catch (error) {
      console.warn('Erro inesperado ao remover imagem do storage:', error);
      return false;
    }
  },

  async uploadLogo(file: File) {
    if (file.size > 2 * 1024 * 1024) throw new Error('Logo muito grande. Limite de 2MB.');
    const filePath = `app/logo.webp`;

    const { data, error } = await supabase.storage
      .from('logos')
      .upload(filePath, file, {
        upsert: true,
        contentType: 'image/webp'
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('logos')
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
    };
  },

  async uploadOrderPdf(blob: Blob, orderId: string, orderNumber: number) {
    const filePath = `orders/${orderId}/pedido-${orderNumber}.pdf`;

    const { data, error } = await supabase.storage
      .from('order-pdfs')
      .upload(filePath, blob, {
        contentType: 'application/pdf',
        upsert: true,
      });

    if (error) throw error;

    const { data: publicData } = supabase.storage
      .from('order-pdfs')
      .getPublicUrl(filePath);

    return {
      url: publicData.publicUrl,
      path: filePath,
    };
  },
};
