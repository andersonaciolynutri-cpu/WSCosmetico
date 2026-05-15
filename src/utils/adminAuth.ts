import { supabase } from '../lib/supabaseClient';

export const adminAuth = {
  async getSession() {
    const { data: { session }, error } = await supabase.auth.getSession();
    if (error) return null;
    return session;
  },

  async getUser() {
    const { data: { user }, error } = await supabase.auth.getUser();
    if (error) return null;
    return user;
  },

  async isAdmin(): Promise<boolean> {
    const user = await this.getUser();
    if (!user) return false;

    const { data, error } = await supabase
      .from('admin_users')
      .select('user_id, role')
      .eq('user_id', user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (error || !data) return false;
    return true;
  },

  async login(email: string, password: string) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    
    if (error) throw error;
    
    // Verificar se o usuário está na tabela admin_users
    const isUserAdmin = await this.isAdmin();
    if (!isUserAdmin) {
      await this.logout();
      throw new Error('Usuário sem permissão de administrador.');
    }

    return data;
  },

  async logout() {
    await supabase.auth.signOut();
  }
};
