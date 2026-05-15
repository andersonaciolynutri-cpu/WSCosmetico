import React, { useState, useMemo, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import Header from './components/Header';
import CategoryFilter from './components/CategoryFilter';
import ProductCard from './components/ProductCard';
import OrderSummaryModal from './components/OrderSummaryModal';
import { CategoryID, CartItem, Product, StoreSettings } from './types';
import { ShoppingBag, Loader2 } from 'lucide-react';
import { productService } from './services/productService';
import { settingsService } from './services/settingsService';

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
  const [loading, setLoading] = useState(true);
  
  const [products, setProducts] = useState<Product[]>([]);
  const [settings, setSettings] = useState<any>(null);

  useEffect(() => {
    async function loadProductsAndSettings() {
      try {
        setLoading(true);
        const [allProducts, appSettings] = await Promise.all([
          productService.getActiveProducts(),
          settingsService.getAppSettings()
        ]);
        setProducts(allProducts);
        setSettings(appSettings);
      } catch (error) {
        console.error('Erro ao carregar dados:', error);
      } finally {
        setLoading(false);
      }
    }

    const clearCart = () => setCartQuantities({});

    loadProductsAndSettings();

    window.addEventListener("ws_products_updated", loadProductsAndSettings);
    window.addEventListener("ws_settings_updated", loadProductsAndSettings);
    window.addEventListener("ws_order_completed", clearCart);

    return () => {
      window.removeEventListener("ws_products_updated", loadProductsAndSettings);
      window.removeEventListener("ws_settings_updated", loadProductsAndSettings);
      window.removeEventListener("ws_order_completed", clearCart);
    };
  }, []);

  const displaySettings: StoreSettings = useMemo(() => {
    if (!settings) return {
      companyName: 'WS Cosméticos',
      whatsappNumber: '5521966972428',
      description: 'Distribuidora de cosméticos para lojas e revendedores.',
      primaryColor: '#2563eb'
    };
    return {
      companyName: settings.company_name,
      whatsappNumber: settings.whatsapp_number,
      logoUrl: settings.logo_url,
      description: settings.description || 'Distribuidora de cosméticos para lojas e revendedores.',
      primaryColor: settings.primary_color || '#212121'
    };
  }, [settings]);

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

  if (loading) {
    return (
      <div className="min-h-screen bg-brand-paper flex items-center justify-center">
        <Loader2 className="w-10 h-10 animate-spin text-brand-gold" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-brand-paper font-sans">
      <Header 
        onCartClick={() => setIsModalOpen(true)} 
        cartCount={cartItems.length}
        onSearch={setSearchQuery}
        settings={displaySettings}
      />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-10">
        <div className="mb-8 sm:mb-12">
          <h2 className="text-2xl sm:text-4xl font-serif font-bold text-brand-ink mb-2 sm:mb-3">Nosso Catálogo</h2>
          <p className="text-xs sm:text-sm text-brand-ink/60 mb-8 max-w-2xl">{displaySettings.description}</p>
          <CategoryFilter selectedCategory={selectedCategory} onSelect={setSelectedCategory} />
        </div>

        <div className="grid grid-cols-1 min-[390px]:grid-cols-2 lg:grid-cols-4 xl:grid-cols-5 gap-3 sm:gap-6 lg:gap-8">
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
        settings={displaySettings}
      />

      <footer className="py-10 border-t border-brand-ink/5 text-center">
        <p className="text-[10px] font-bold uppercase tracking-widest text-brand-ink/30 px-6">
          &copy; {new Date().getFullYear()} {displaySettings.companyName} - Todos os direitos reservados.
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
