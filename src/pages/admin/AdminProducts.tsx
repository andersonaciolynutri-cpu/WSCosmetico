import React, { useState, useMemo, useRef, useEffect } from 'react';
import { 
  Package, 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Check, 
  X,
  Image as ImageIcon,
  Upload,
  Scissors,
  Loader2
} from 'lucide-react';
import { productService } from '../../services/productService';
import { supabaseStorageService } from '../../services/supabaseStorageService';
import { Product, CategoryID } from '../../types';
import { validateImageType, fileToDataUrl } from '../../utils/imageUpload';
import ImageEditorModal from '../../components/ImageEditorModal';
import { formatCurrency, cn } from '../../lib/utils';

export default function AdminProducts() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryID | 'todos'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      setLoading(true);
      const data = await productService.getAllProducts();
      setProducts(data);
    } catch (error) {
      console.error('Erro ao carregar produtos:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isModalOpen) {
      setImagePreview(editingProduct?.image_url || null);
    } else {
      setImagePreview(null);
    }
  }, [isModalOpen, editingProduct]);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const error = validateImageType(file);
    if (error) {
      alert(error);
      return;
    }

    try {
      const dataUrl = await fileToDataUrl(file);
      setCurrentFileUrl(dataUrl);
      setEditorOpen(true);
    } catch (error) {
      console.error('Erro ao carregar imagem:', error);
      alert('Erro ao carregar a imagem.');
    }
  };

  const handleEditorSave = (finalImage: string) => {
    setImagePreview(finalImage);
    setEditorOpen(false);
  };

  const removeImage = () => {
    setImagePreview(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const handleSave = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isSaving) return;

    try {
      setIsSaving(true);
      const formData = new FormData(e.currentTarget);
      
      const name = formData.get('name') as string;
      const brand = formData.get('brand') as string;
      const category = formData.get('category') as string;
      const price = Number(formData.get('price'));
      const active = formData.get('active') === 'on';
      const directUrl = formData.get('image_url') as string;

      const productData: Partial<Product> = {
        name,
        brand,
        category,
        price,
        active,
        image_url: directUrl || (imagePreview?.startsWith('data:') ? undefined : imagePreview) || undefined
      };

      let savedProduct: Product;

      if (editingProduct) {
        // If image was changed (it's a data URL now)
        if (imagePreview && imagePreview.startsWith('data:')) {
          const blob = await fetch(imagePreview).then(r => r.blob());
          const file = new File([blob], 'product-image.webp', { type: 'image/webp' });
          
          // Delete old image if it exists
          if (editingProduct.image_path) {
            await supabaseStorageService.deleteProductImage(editingProduct.image_path).catch(console.error);
          }

          const uploadRes = await supabaseStorageService.uploadProductImage(file, editingProduct.id, productData.name!);
          productData.image_url = uploadRes.url;
          productData.image_path = uploadRes.path;
        } else if (!imagePreview) {
          // Image was removed
          productData.image_url = undefined;
          if (editingProduct.image_path) {
            await supabaseStorageService.deleteProductImage(editingProduct.image_path).catch(console.error);
            productData.image_path = undefined;
          }
        } else if (imagePreview !== editingProduct.image_url) {
          // It's a direct URL change (not a data URL, but different from before)
          if (editingProduct.image_path) {
            await supabaseStorageService.deleteProductImage(editingProduct.image_path).catch(console.error);
            productData.image_path = undefined;
          }
        } else {
          // Image didn't change (still the same URL or image_path)
          productData.image_path = editingProduct.image_path;
        }

        savedProduct = await productService.updateProduct(editingProduct.id, productData);
      } else {
        // New Product
        savedProduct = await productService.createProduct(productData as Omit<Product, 'id' | 'created_at' | 'updated_at'>);

        // Then upload image if exists and is a DataURL
        if (imagePreview && imagePreview.startsWith('data:')) {
          const blob = await fetch(imagePreview).then(r => r.blob());
          const file = new File([blob], 'product-image.webp', { type: 'image/webp' });
          const uploadRes = await supabaseStorageService.uploadProductImage(file, savedProduct.id, productData.name!);
          
          savedProduct = await productService.updateProduct(savedProduct.id, {
            image_url: uploadRes.url,
            image_path: uploadRes.path
          });
        }
      }

      await loadProducts();
      setIsModalOpen(false);
      setEditingProduct(null);
      window.dispatchEvent(new Event("ws_products_updated"));
    } catch (error) {
      console.error('Erro ao salvar produto:', error);
      alert('Erro ao salvar produto. Verifique sua conexão.');
    } finally {
      setIsSaving(false);
    }
  };

  const confirmDeleteProduct = async () => {
    if (!productToDelete) return;

    try {
      if (productToDelete.image_path) {
        await supabaseStorageService.deleteProductImage(productToDelete.image_path).catch(console.error);
      }
      await productService.deleteProduct(productToDelete.id);
      
      await loadProducts();
      setProductToDelete(null);
      setSuccessMessage("Produto excluído com sucesso.");

      window.dispatchEvent(new Event("ws_products_updated"));

      setTimeout(() => {
        setSuccessMessage("");
      }, 3000);
    } catch (error) {
      console.error('Erro ao excluir produto:', error);
      alert('Erro ao excluir produto.');
    }
  };

  const toggleActive = async (id: string) => {
    const product = products.find(p => p.id === id);
    if (!product) return;

    try {
      await productService.updateProduct(id, { active: !product.active });
      await loadProducts();
      window.dispatchEvent(new Event("ws_products_updated"));
    } catch (error) {
      console.error('Erro ao alternar status:', error);
    }
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 sm:gap-6">
        <div>
          <h1 className="text-2xl sm:text-4xl font-serif font-bold text-brand-ink">Produtos</h1>
          <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 mt-1 sm:mt-2">Catálogo de cosméticos</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="h-12 sm:h-14 px-6 sm:px-8 bg-brand-ink text-white rounded-xl sm:rounded-[2rem] flex items-center justify-center gap-2 sm:gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group"
        >
          <Plus className="w-4 h-4 sm:w-5 sm:h-5" />
          <span className="uppercase text-[10px] sm:text-xs tracking-[0.2em] font-bold">Novo Produto</span>
        </button>
      </header>

      <div className="bg-white rounded-2xl sm:rounded-[3rem] p-4 sm:p-8 border border-brand-ink/5 shadow-sm space-y-6 sm:space-y-8">
        <div className="flex flex-col sm:flex-row gap-4 sm:gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/30 group-focus-within:text-brand-gold" />
            <input 
              type="text"
              placeholder="Buscar..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl pl-11 pr-4 text-sm outline-none transition-all"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as any)}
            className="h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-4 sm:px-6 text-xs sm:text-sm outline-none transition-all font-bold uppercase tracking-widest text-brand-ink/60"
          >
            <option value="todos">Todas Categorias</option>
            <option value="Cabelos">Cabelos</option>
            <option value="Higiene e Cuidados Pessoais">Higiene</option>
            <option value="Infantil e Bebê">Infantil</option>
            <option value="Beleza e Corpo">Beleza</option>
            <option value="Maquiagem">Maquiagem</option>
          </select>
        </div>

        {/* Tabela Desktop */}
        <div className="hidden md:block overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="text-left border-b border-brand-ink/5">
                <th className="pb-4 text-[10px] uppercase tracking-widest text-brand-ink/40 font-bold px-4">Produto</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest text-brand-ink/40 font-bold px-4">Categoria</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest text-brand-ink/40 font-bold px-4">Preço</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest text-brand-ink/40 font-bold px-4">Status</th>
                <th className="pb-4 text-[10px] uppercase tracking-widest text-brand-ink/40 font-bold px-4 text-right">Ações</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map(product => (
                <tr key={product.id} className="border-b border-brand-ink/5 hover:bg-brand-paper/50 transition-colors group">
                  <td className="py-4 px-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl bg-brand-paper overflow-hidden border border-brand-ink/5 flex items-center justify-center">
                        <img 
                          src={product.image_url || '/placeholder-product.png'} 
                          alt="" 
                          className="w-full h-full object-contain" 
                          loading="lazy"
                          onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=WS'}
                        />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-brand-ink leading-tight">{product.name}</p>
                        <p className="text-[10px] uppercase tracking-widest text-brand-ink/40 font-bold">{product.brand}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-4">
                    <span className="px-3 py-1 bg-brand-paper rounded-full text-[10px] font-bold uppercase tracking-widest text-brand-ink/60">
                      {product.category}
                    </span>
                  </td>
                  <td className="py-4 px-4 text-sm font-bold text-brand-ink">
                    {formatCurrency(product.price)}
                  </td>
                  <td className="py-4 px-4">
                    <button 
                      onClick={() => toggleActive(product.id)}
                      className={cn(
                        "px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest transition-all border",
                        product.active 
                          ? "bg-green-50 text-green-600 border-green-100" 
                          : "bg-red-50 text-red-600 border-red-100"
                      )}
                    >
                      {product.active ? 'Ativo' : 'Inativo'}
                    </button>
                  </td>
                  <td className="py-4 px-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-2 bg-brand-paper text-brand-ink/60 hover:text-brand-ink hover:bg-brand-ink/5 rounded-xl transition-all"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => setProductToDelete(product)}
                        className="p-2 bg-brand-paper text-red-500/60 hover:text-red-500 hover:bg-red-500/10 rounded-xl transition-all"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Lista Mobile (Cards) */}
        <div className="md:hidden space-y-4">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-brand-paper/50 rounded-2xl p-4 border border-brand-ink/5">
              <div className="flex gap-4">
                <div className="w-20 h-20 bg-white rounded-xl overflow-hidden border border-brand-ink/5 shrink-0 flex items-center justify-center">
                  <img 
                    src={product.image_url || '/placeholder-product.png'} 
                    alt="" 
                    className="w-full h-full object-contain"
                    onError={e => e.currentTarget.src = 'https://placehold.co/100x100?text=WS'}
                  />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div>
                      <p className="text-xs font-bold text-brand-ink truncate">{product.name}</p>
                      <p className="text-[9px] uppercase font-bold text-brand-ink/40 tracking-widest">{product.brand}</p>
                    </div>
                    <button 
                      onClick={() => toggleActive(product.id)}
                      className={cn(
                        "shrink-0 px-2 py-0.5 rounded-full text-[8px] font-bold uppercase tracking-widest border transition-all",
                        product.active ? "bg-green-50 text-green-600 border-green-100" : "bg-red-50 text-red-600 border-red-100"
                      )}
                    >
                      {product.active ? 'On' : 'Off'}
                    </button>
                  </div>
                  <div className="mt-2 flex items-center justify-between">
                    <p className="text-sm font-bold text-brand-gold">{formatCurrency(product.price)}</p>
                    <div className="flex gap-2">
                      <button 
                        onClick={() => { setEditingProduct(product); setIsModalOpen(true); }}
                        className="p-2 bg-white text-brand-ink/60 rounded-lg border border-brand-ink/5"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button 
                        onClick={() => setProductToDelete(product)}
                        className="p-2 bg-white text-red-500/60 rounded-lg border border-brand-ink/5"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-brand-ink/40 font-bold uppercase tracking-widest text-xs">Nenhum produto encontrado</p>
            </div>
          )}
        </div>

  {/* Modal CRUD */}
  {isModalOpen && (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
      <div className="relative w-full max-w-2xl bg-white sm:rounded-[3rem] rounded-[2rem] shadow-2xl overflow-hidden flex flex-col max-h-[95vh]">
        <header className="px-6 sm:px-10 py-5 sm:py-8 border-b border-brand-ink/5 flex items-center justify-between shrink-0">
          <h2 className="text-xl sm:text-2xl font-serif font-bold text-brand-ink">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
          <button onClick={() => setIsModalOpen(false)} className="p-2 sm:p-3 bg-brand-paper rounded-xl sm:rounded-2xl hover:bg-brand-ink/5 transition-all">
            <X className="w-5 h-5" />
          </button>
        </header>

        <form onSubmit={handleSave} className="p-6 sm:p-10 space-y-5 sm:space-y-6 overflow-y-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6">
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Nome do Produto</label>
              <input 
                name="name"
                required
                defaultValue={editingProduct?.name}
                placeholder="Ex: Base Líquida Matte"
                className="w-full h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-5 text-sm sm:text-base md:text-sm outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Marca</label>
              <input 
                name="brand"
                required
                defaultValue={editingProduct?.brand}
                placeholder="Ex: Ruby Rose"
                className="w-full h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-5 text-sm sm:text-base md:text-sm outline-none transition-all"
              />
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Categoria</label>
              <select 
                name="category"
                required
                defaultValue={editingProduct?.category}
                className="w-full h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-5 text-sm sm:text-base md:text-sm outline-none transition-all"
              >
                <option value="Cabelos">Cabelos</option>
                <option value="Higiene e Cuidados Pessoais">Higiene</option>
                <option value="Infantil e Bebê">Infantil</option>
                <option value="Beleza e Corpo">Beleza</option>
                <option value="Maquiagem">Maquiagem</option>
              </select>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Preço (R$)</label>
              <input 
                name="price"
                type="number"
                step="0.01"
                required
                defaultValue={editingProduct?.price}
                placeholder="0.00"
                className="w-full h-11 sm:h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-5 text-sm sm:text-base md:text-sm outline-none transition-all font-bold"
              />
            </div>
            <div className="space-y-4 md:col-span-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Foto do Produto (Upload)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="relative group overflow-hidden bg-brand-paper border-2 border-dashed border-brand-ink/10 rounded-2xl p-4 sm:p-6 flex flex-col items-center justify-center transition-all hover:border-brand-gold/40">
                    <input 
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileChange}
                      accept="image/png,image/jpeg,image/webp"
                      className="absolute inset-0 opacity-0 cursor-pointer z-10"
                    />
                    <Upload className="w-6 h-6 text-brand-ink/30 mb-2" />
                    <p className="text-[8px] font-bold uppercase tracking-widest text-brand-ink/40">
                      Upload Imagem
                    </p>
                  </div>

                  <div className="flex flex-col gap-2 h-full min-h-[120px]">
                    <div className="flex items-center gap-4 sm:gap-6 p-4 sm:p-6 bg-brand-paper rounded-2xl sm:rounded-[2rem] border border-brand-ink/5 relative group h-full">
                      <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white rounded-xl overflow-hidden border border-brand-ink/5 flex items-center justify-center shadow-sm shrink-0">
                        {imagePreview ? (
                          <img src={imagePreview} alt="Preview" className="w-full h-full object-contain p-1" />
                        ) : (
                          <ImageIcon className="w-6 h-6 text-brand-ink/10" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[9px] font-bold uppercase tracking-widest text-brand-ink/40">Visualização</p>
                        {imagePreview && (
                          <div className="flex gap-2 mt-2">
                            <button 
                              type="button"
                              onClick={() => {
                                if (imagePreview) {
                                  setCurrentFileUrl(imagePreview);
                                  setEditorOpen(true);
                                }
                              }}
                              className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/5 transition-all p-1.5 sm:p-2 border border-brand-gold/20 flex items-center gap-1.5 rounded-lg whitespace-nowrap"
                            >
                              <Scissors className="w-3 h-3" /> Ajustar
                            </button>
                            <button 
                              type="button"
                              onClick={removeImage}
                              className="text-[8px] sm:text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all p-1.5 sm:p-2 border border-red-100 rounded-lg whitespace-nowrap"
                            >
                              Remover
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2 flex items-center gap-2 font-mono">
                  <ImageIcon className="w-3 h-3" /> Ou URL da Imagem Direta
                </label>
                <input 
                  name="image_url"
                  onChange={(e) => setImagePreview(e.target.value)}
                  defaultValue={editingProduct?.image_url}
                  placeholder="https://exemplo.com/imagem.png"
                  className="w-full h-11 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-xl sm:rounded-2xl px-5 text-xs outline-none transition-all font-mono"
                />
              </div>
            </div>
            <div className="md:col-span-2 flex items-center gap-3 px-2">
              <input 
                type="checkbox" 
                name="active" 
                id="active-checkbox"
                defaultChecked={editingProduct ? editingProduct.active : true}
                className="w-5 h-5 rounded-lg border-brand-ink/20 text-brand-gold focus:ring-brand-gold"
              />
              <label htmlFor="active-checkbox" className="text-[10px] sm:text-sm font-bold text-brand-ink/60 uppercase tracking-widest cursor-pointer">Produto Ativo</label>
            </div>
          </div>

          <div className="pt-6 border-t border-brand-ink/5 flex gap-3 sm:gap-4 shrink-0">
            <button 
              type="button" 
              onClick={() => setIsModalOpen(false)}
              className="flex-1 h-12 sm:h-14 bg-brand-paper text-brand-ink/40 rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:text-brand-ink transition-all"
            >
              Cancelar
            </button>
            <button 
              type="submit"
              disabled={isSaving}
              className="flex-2 h-12 sm:h-14 bg-brand-ink text-white rounded-xl sm:rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all disabled:opacity-50 shadow-lg shadow-brand-ink/20"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Check className="w-4 h-4" />
              )}
              {isSaving ? 'Salvando...' : 'Salvar'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}

      <ImageEditorModal 
        open={editorOpen}
        imageSrc={currentFileUrl || ''}
        onClose={() => setEditorOpen(false)}
        onSave={handleEditorSave}
        title="Ajustar Foto do Produto"
        aspect={1 / 1} // Aspect ratio for product photos (square)
      />

      {/* Modal de Confirmação de Exclusão */}
      {productToDelete && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm" onClick={() => setProductToDelete(null)} />

          <div className="relative bg-white rounded-[2.5rem] p-8 max-w-md w-full shadow-2xl overflow-hidden border border-brand-ink/5">
            <div className="w-16 h-16 bg-red-50 rounded-2xl flex items-center justify-center mb-6">
              <Trash2 className="w-8 h-8 text-red-500" />
            </div>
            <h2 className="text-xl font-serif font-bold text-brand-ink mb-3">
              Excluir produto
            </h2>

            <p className="text-sm text-brand-ink/60 mb-8 leading-relaxed">
              Tem certeza que deseja excluir o produto <span className="font-bold text-brand-ink">"{productToDelete.name}"</span>?
              Essa ação não poderá ser desfeita e ele será removido do catálogo.
            </p>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={() => setProductToDelete(null)}
                className="flex-1 h-14 rounded-2xl bg-brand-paper text-brand-ink font-bold uppercase tracking-widest text-[10px] hover:bg-brand-ink/5 transition-all"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDeleteProduct}
                className="flex-1 h-14 rounded-2xl bg-red-500 text-white font-bold uppercase tracking-widest text-[10px] hover:bg-red-600 transition-all shadow-lg shadow-red-500/20"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Mensagem de Sucesso */}
      {successMessage && (
        <div className="fixed top-8 left-1/2 -translate-x-1/2 md:left-auto md:right-8 md:translate-x-0 z-[300] bg-brand-ink text-white px-8 py-4 rounded-3xl shadow-2xl flex items-center gap-3 animate-in fade-in slide-in-from-top-4 duration-500 border border-white/10">
          <div className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center">
            <Check className="w-3 h-3 text-white" />
          </div>
          <span className="text-[10px] font-bold uppercase tracking-widest">{successMessage}</span>
        </div>
      )}
    </div>
  );
}
