import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import OrderSummaryModal from './components/OrderSummaryModal';
import { CategoryID, CartItem, Product, StoreSettings } from './types';
import { ShoppingBag } from 'lucide-react';
import { storageService } from './storageService';

// Admin Pages
import AdminLogin from './pages/admin/AdminLogin';
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminProducts from './pages/admin/AdminProducts';
import AdminSettings from './pages/admin/AdminSettings';

function PublicCatalog() {
  const [selectedCategory, setSelectedCategory] = useState<CategoryID | 'todos'>('todos');
  const [searchQuery, setSearchQuery] = useState('');
  const [cartQuantities, setCartQuantities] = useState<Record<string, number>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<StoreSettings>(storageService.getSettings());

  useEffect(() => {
    function loadProductsAndSettings() {
      // Carrega apenas produtos ativos
      const allProducts = storageService.getProducts();
      setProducts(allProducts.filter(p => p.active));
      setSettings(storageService.getSettings());
    }

    loadProductsAndSettings();

    window.addEventListener("ws_products_updated", loadProductsAndSettings);
    window.addEventListener("storage", loadProductsAndSettings);

    return () => {
      window.removeEventListener("ws_products_updated", loadProductsAndSettings);
      window.removeEventListener("storage", loadProductsAndSettings);
    };
  }, []);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      const matchesCategory = selectedCategory === 'todos' || p.category === selectedCategory;
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          p.brand.toLowerCase().includes(searchQuery.toLowerCase());
      return matchesCategory && matchesSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const cartItems = useMemo(() => {
    return Object.entries(cartQuantities)
      .filter(([_, qty]) => (qty as number) > 0)
      .map(([id, qty]) => {
        const product = products.find(p => p.id === id);
        return product ? { ...product, quantity: qty } as CartItem : null;
      })
      .filter((item): item is CartItem => item !== null);
  }, [cartQuantities, products]);

  const total = useMemo(() => {
    return cartItems.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  }, [cartItems]);

  const updateQuantity = (id: string, delta: number) => {
    setCartQuantities(prev => ({
      ...prev,
      [id]: Math.max(0, (prev[id] || 0) + delta)
    }));
  };

  return (
    <div className="min-h-screen bg-brand-paper font-sans">
      <Header 
        onCartClick={() => setIsModalOpen(true)} 
        cartCount={cartItems.length}
        onSearch={setSearchQuery}
        settings={settings}
      />

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="mb-10">
          <h2 className="text-3xl font-serif font-bold text-brand-ink mb-2">Nosso Catálogo</h2>
          <p className="text-sm text-brand-ink/60 mb-8">{settings.description}</p>
          <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-8">
          {filteredProducts.map((product) => (
            <ProductCard 
              key={product.id}
              product={product}
              quantity={cartQuantities[product.id] || 0}
              onUpdateQuantity={updateQuantity}
            />
          ))}
        </div>

        {filteredProducts.length === 0 && (
          <div className="text-center py-20 bg-white rounded-[3rem] border border-brand-ink/5">
            <p className="text-brand-ink/40 text-lg">Nenhum produto disponível.</p>
          </div>
        )}
      </main>

      <div className="sm:hidden fixed bottom-8 right-6 z-40">
        <button 
          onClick={() => setIsModalOpen(true)}
          className="luxury-button w-16 h-16 rounded-full flex items-center justify-center shadow-2xl relative"
        >
          <ShoppingBag className="w-6 h-6" />
          {cartItems.length > 0 && (
             <span className="absolute -top-1 -right-1 w-6 h-6 bg-brand-gold text-brand-ink text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-brand-paper">
             {cartItems.length}
           </span>
          )}
        </button>
      </div>

      <OrderSummaryModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        items={cartItems}
        total={total}
        settings={settings}
      />

      <footer className="py-10 border-t border-brand-ink/5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 px-6">
          &copy; {new Date().getFullYear()} {settings.companyName} - Todos os direitos reservados.
        </p>
      </footer>
    </div>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<PublicCatalog />} />
        <Route path="/admin" element={<AdminLogin />} />
        <Route path="/admin/dashboard" element={<AdminLayout><AdminDashboard /></AdminLayout>} />
        <Route path="/admin/produtos" element={<AdminLayout><AdminProducts /></AdminLayout>} />
        <Route path="/admin/configuracoes" element={<AdminLayout><AdminSettings /></AdminLayout>} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
