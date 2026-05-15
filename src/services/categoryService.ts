import { supabase } from '../lib/supabaseClient';
import { Category, CategoryID } from '../types';

const DEFAULT_CATEGORIES: Omit<Category, 'id'>[] = [
  { name: 'Cabelos', slug: 'cabelos', active: true, sort_order: 1 },
  { name: 'Higiene e Cuidados Pessoais', slug: 'higiene-e-cuidados-pessoais', active: true, sort_order: 2 },
  { name: 'Infantil e Bebê', slug: 'infantil-e-bebe', active: true, sort_order: 3 },
  { name: 'Beleza e Corpo', slug: 'beleza-e-corpo', active: true, sort_order: 4 },
  { name: 'Maquiagem', slug: 'maquiagem', active: true, sort_order: 5 },
];

export const categoryService = {
  async getActiveCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .eq('active', true)
      .order('sort_order', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      // Fallback para categorias padrão se a tabela falhar ou estiver vazia
      return DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: String(index + 1)
      })) as Category[];
    }

    if (!data || data.length === 0) {
      return DEFAULT_CATEGORIES.map((cat, index) => ({
        ...cat,
        id: String(index + 1)
      })) as Category[];
    }

    return data as Category[];
  },

  async getAllCategories(): Promise<Category[]> {
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('sort_order', { ascending: true });

    if (error) throw error;
    return data as Category[];
  },

  async ensureDefaultCategories() {
    const categories = await this.getActiveCategories();
    if (categories.length === 0 || (categories.length === DEFAULT_CATEGORIES.length && categories[0].name === DEFAULT_CATEGORIES[0].name)) {
      // Já existem ou são as padrão
      return;
    }
    
    // Opcional: Implementar lógica de semente se necessário
  },

  normalizeCategory(oldCategory: string): CategoryID {
    const cat = oldCategory.toLowerCase().trim();

    // Cabelos
    const cabelosKeywords = [
      'cabelo', 'shampoo', 'condicionador', 'mascara capilar', 'máscara capilar',
      'creme de tratamento', 'creme de pentear', 'gelatina capilar', 'gel fixador',
      'pomada', 'reparador de pontas', 'protetor térmico', 'kit capilar', 'matizador',
      'tintura capilar', 'progressiva', 'guanidina', 'alisante', 'henê', 'finalizador capilar',
      'tônico capilar', 'tonico capilar', 'barba capilar'
    ];
    if (cabelosKeywords.some(k => cat.includes(k))) return 'Cabelos';

    // Higiene e Cuidados Pessoais
    const higieneKeywords = [
      'sabonete', 'íntimo', 'intimo', 'lubrificante', 'hastes flexíveis', 'hastes flexiveis',
      'desodorante', 'colônia', 'colonia', 'absorvente', 'protetor diário', 'protetor diario',
      'lenço umedecido', 'lenco umedecido', 'higiene'
    ];
    if (higieneKeywords.some(k => cat.includes(k)) && !cat.includes('infantil') && !cat.includes('bebê') && !cat.includes('bebe')) {
      return 'Higiene e Cuidados Pessoais';
    }

    // Infantil e Bebê
    const infantilKeywords = [
      'infantil', 'bebê', 'bebe', 'fralda', 'amaciante de bebê', 'amaciante de bebe'
    ];
    if (infantilKeywords.some(k => cat.includes(k))) return 'Infantil e Bebê';

    // Beleza e Corpo
    const belezaKeywords = [
      'corpo', 'corporal', 'beleza', 'bronzeador', 'óleo', 'oleo', 'modelador'
    ];
    if (belezaKeywords.some(k => cat.includes(k))) return 'Beleza e Corpo';

    // Maquiagem
    const makeKeywords = [
      'make', 'maquiagem', 'gloss', 'lip tint', 'adesivo de unha', 'acessórios de unha', 'acessorios de unha'
    ];
    if (makeKeywords.some(k => cat.includes(k))) return 'Maquiagem';

    // Default mappings for the old categories if exact match
    if (cat === 'make') return 'Maquiagem';
    if (cat === 'cabelo') return 'Cabelos';
    if (cat === 'higiene pessoal' || cat === 'higiene') return 'Higiene e Cuidados Pessoais';
    if (cat === 'beleza') return 'Beleza e Corpo';
    if (cat === 'bebê' || cat === 'bebe') return 'Infantil e Bebê';

    return 'Higiene e Cuidados Pessoais'; // Fallback
  }
};
