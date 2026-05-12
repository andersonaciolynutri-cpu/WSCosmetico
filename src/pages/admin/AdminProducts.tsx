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
  Scissors
} from 'lucide-react';
import { storageService } from '../../storageService';
import { Product, CategoryID } from '../../types';
import { validateImageType, fileToDataUrl } from '../../utils/imageUpload';
import ImageEditorModal from '../../components/ImageEditorModal';
import { formatCurrency, cn } from '../../lib/utils';

export default function AdminProducts() {
  const [products, setProducts] = useState(storageService.getProducts());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<CategoryID | 'todos'>('todos');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [editorOpen, setEditorOpen] = useState(false);
  const [currentFileUrl, setCurrentFileUrl] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isModalOpen) {
      setImagePreview(editingProduct?.imageDataUrl || editingProduct?.imageUrl || null);
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

  const handleSave = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    const productData: Product = {
      id: editingProduct?.id || Date.now().toString(),
      name: formData.get('name') as string,
      brand: formData.get('brand') as string,
      category: formData.get('category') as CategoryID,
      price: Number(formData.get('price')),
      imageUrl: (formData.get('imageUrl') as string) || undefined,
      imageDataUrl: imagePreview?.startsWith('data:image') ? imagePreview : (editingProduct?.imageDataUrl || undefined),
      active: formData.get('active') === 'on'
    };

    // If we have a data URL but no image URL, we use the data URL.
    // If the image was removed (preview is null), we clear both.
    if (!imagePreview) {
      productData.imageDataUrl = undefined;
      productData.imageUrl = undefined;
    }

    let newProducts;
    if (editingProduct) {
      newProducts = products.map(p => p.id === editingProduct.id ? productData : p);
    } else {
      newProducts = [productData, ...products];
    }

    storageService.saveProducts(newProducts);
    setProducts(newProducts);
    setIsModalOpen(false);
    setEditingProduct(null);
    window.dispatchEvent(new Event("ws_products_updated"));
  };

  const confirmDeleteProduct = () => {
    if (!productToDelete) return;

    const newProducts = products.filter(p => p.id !== productToDelete.id);
    storageService.saveProducts(newProducts);
    setProducts(newProducts);
    setProductToDelete(null);
    setSuccessMessage("Produto excluído com sucesso.");

    window.dispatchEvent(new Event("ws_products_updated"));

    setTimeout(() => {
      setSuccessMessage("");
    }, 3000);
  };

  const toggleActive = (id: string) => {
    const newProducts = products.map(p => 
      p.id === id ? { ...p, active: !p.active } : p
    );
    storageService.saveProducts(newProducts);
    setProducts(newProducts);
  };

  return (
    <div className="space-y-10">
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div>
          <h1 className="text-4xl font-serif font-bold text-brand-ink">Gerenciar Produtos</h1>
          <p className="text-xs font-bold uppercase tracking-widest text-brand-ink/40 mt-2">Adicione, edite ou remova produtos do catálogo</p>
        </div>
        <button 
          onClick={() => { setEditingProduct(null); setIsModalOpen(true); }}
          className="h-14 px-8 bg-brand-ink text-white rounded-[2rem] flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all shadow-xl shadow-brand-ink/20 group"
        >
          <Plus className="w-5 h-5" />
          <span className="uppercase text-xs tracking-[0.2em] font-bold">Novo Produto</span>
        </button>
      </header>

      <div className="bg-white rounded-[3rem] p-8 border border-brand-ink/5 shadow-sm space-y-8">
        <div className="flex flex-col md:flex-row gap-6">
          <div className="flex-1 relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-brand-ink/30 group-focus-within:text-brand-gold" />
            <input 
              type="text"
              placeholder="Buscar por nome ou marca..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl pl-11 pr-4 text-sm outline-none transition-all"
            />
          </div>
          <select 
            value={selectedCategory}
            onChange={e => setSelectedCategory(e.target.value as any)}
            className="h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-6 text-sm outline-none transition-all font-bold uppercase tracking-widest text-brand-ink/60"
          >
            <option value="todos">Todas Categorias</option>
            <option value="Make">Make</option>
            <option value="Cabelo">Cabelo</option>
            <option value="Higiene Pessoal">Higiene</option>
            <option value="Beleza">Beleza</option>
            <option value="Bebê">Bebê</option>
          </select>
        </div>

        <div className="overflow-x-auto">
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
                      <div className="w-12 h-12 rounded-xl bg-brand-paper overflow-hidden border border-brand-ink/5">
                        <img 
                          src={product.imageDataUrl || product.imageUrl || '/placeholder-product.png'} 
                          alt="" 
                          className="w-full h-full object-cover" 
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
          {filteredProducts.length === 0 && (
            <div className="text-center py-20">
              <p className="text-brand-ink/40 font-bold uppercase tracking-widest text-xs">Nenhum produto encontrado</p>
            </div>
          )}
        </div>
      </div>

      {/* Modal CRUD */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-brand-ink/60 backdrop-blur-sm" onClick={() => setIsModalOpen(false)} />
          <div className="relative w-full max-w-2xl bg-white rounded-[3rem] shadow-2xl overflow-hidden">
            <header className="px-10 py-8 border-b border-brand-ink/5 flex items-center justify-between">
              <h2 className="text-2xl font-serif font-bold text-brand-ink">{editingProduct ? 'Editar Produto' : 'Novo Produto'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-3 bg-brand-paper rounded-2xl hover:bg-brand-ink/5 transition-all">
                <X className="w-5 h-5" />
              </button>
            </header>

            <form onSubmit={handleSave} className="p-10 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Nome do Produto</label>
                  <input 
                    name="name"
                    required
                    defaultValue={editingProduct?.name}
                    placeholder="Ex: Base Líquida Matte"
                    className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 text-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Marca</label>
                  <input 
                    name="brand"
                    required
                    defaultValue={editingProduct?.brand}
                    placeholder="Ex: Ruby Rose"
                    className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 text-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Categoria</label>
                  <select 
                    name="category"
                    required
                    defaultValue={editingProduct?.category}
                    className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 text-sm outline-none transition-all"
                  >
                    <option value="Make">Make</option>
                    <option value="Cabelo">Cabelo</option>
                    <option value="Higiene Pessoal">Higiene</option>
                    <option value="Beleza">Beleza</option>
                    <option value="Bebê">Bebê</option>
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
                    className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 text-sm outline-none transition-all"
                  />
                </div>
                <div className="space-y-4 md:col-span-2">
                  <div className="space-y-2">
                    <label className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40 px-2">Foto do Produto (Upload)</label>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="relative group overflow-hidden bg-brand-paper border-2 border-dashed border-brand-ink/10 rounded-2xl p-6 flex flex-col items-center justify-center transition-all hover:border-brand-gold/40">
                        <input 
                          type="file"
                          ref={fileInputRef}
                          onChange={handleFileChange}
                          accept="image/png,image/jpeg,image/webp"
                          className="absolute inset-0 opacity-0 cursor-pointer z-10"
                        />
                        <Upload className="w-6 h-6 text-brand-ink/30 mb-2" />
                        <p className="text-[8px] font-bold uppercase tracking-widest text-brand-ink/40">
                          Upload Imagem (Ajustável)
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-6 p-6 bg-brand-paper rounded-[2rem] border border-brand-ink/5 relative group h-full">
                          <div className="w-24 h-24 bg-white rounded-2xl overflow-hidden border border-brand-ink/5 flex items-center justify-center shadow-sm">
                            {imagePreview ? (
                              <img src={imagePreview} alt="Preview" className="w-full h-full object-cover" />
                            ) : (
                              <ImageIcon className="w-8 h-8 text-brand-ink/10" />
                            )}
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/40">Visualização da Foto</p>
                            {imagePreview && (
                              <div className="flex gap-3 mt-3">
                                <button 
                                  type="button"
                                  onClick={() => {
                                    if (imagePreview) {
                                      setCurrentFileUrl(imagePreview);
                                      setEditorOpen(true);
                                    }
                                  }}
                                  className="text-[10px] font-bold uppercase tracking-widest text-brand-gold hover:bg-brand-gold/5 transition-all p-2 px-3 rounded-lg border border-brand-gold/20 flex items-center gap-2"
                                >
                                  <Scissors className="w-3 h-3" />
                                  Ajustar
                                </button>
                                <button 
                                  type="button"
                                  onClick={removeImage}
                                  className="text-[10px] font-bold uppercase tracking-widest text-red-500 hover:bg-red-50 transition-all p-2 px-3 rounded-lg border border-red-100"
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
                      <ImageIcon className="w-3 h-3" /> Ou URL da Imagem (Opcional)
                    </label>
                    <input 
                      name="imageUrl"
                      defaultValue={editingProduct?.imageUrl}
                      placeholder="https://exemplo.com/imagem.png"
                      className="w-full h-12 bg-brand-paper border border-transparent focus:border-brand-gold/30 rounded-2xl px-5 text-sm outline-none transition-all font-mono"
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
                  <label htmlFor="active-checkbox" className="text-sm font-bold text-brand-ink/60 uppercase tracking-widest cursor-pointer">Produto Ativo</label>
                </div>
              </div>

              <div className="pt-6 border-t border-brand-ink/5 flex gap-4">
                <button 
                  type="button" 
                  onClick={() => setIsModalOpen(false)}
                  className="flex-1 h-14 bg-brand-paper text-brand-ink/40 rounded-2xl font-bold uppercase tracking-widest text-[10px] hover:text-brand-ink transition-all"
                >
                  Cancelar
                </button>
                <button 
                  type="submit"
                  className="flex-2 h-14 bg-brand-ink text-white rounded-2xl font-bold uppercase tracking-widest text-[10px] flex items-center justify-center gap-3 hover:bg-brand-gold hover:text-brand-ink transition-all"
                >
                  <Check className="w-4 h-4" />
                  Salvar Produto
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
