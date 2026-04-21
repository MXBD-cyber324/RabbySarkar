import React, { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useNavigate } from 'react-router-dom';
import { ShoppingCart, User, Search, Home as HomeIcon, Package, LogOut } from 'lucide-react';
import { useCart } from './CartContext';
import { useUser } from './UserContext';
import { cn } from './lib/utils';
import AdminPanel from './pages/AdminPanel';
import HomePage from './pages/HomePage';
import ProductPage from './pages/ProductPage';
import CartPage from './pages/CartPage';
import ProfilePage from './pages/ProfilePage';
import ShopPage from './pages/ShopPage';

const Navbar = () => {
  const { cart } = useCart();
  const { user, isAdmin } = useUser();
  const [searchQuery, setSearchQuery] = useState('');
  const [showAdminBtn, setShowAdminBtn] = useState(false);
  const navigate = useNavigate();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.toLowerCase() === 'admin') {
      setShowAdminBtn(true);
    } else {
      setShowAdminBtn(false);
      if (searchQuery.trim()) {
        navigate(`/shop?q=${encodeURIComponent(searchQuery.trim())}`);
      }
    }
  };

  return (
    <>
      {/* Top Search Bar */}
      <div className="bg-brand-primary py-2 px-4 border-b border-brand-accent/20">
        <div className="max-w-7xl mx-auto flex items-center justify-center">
            <form onSubmit={handleSearch} className="w-full max-w-2xl relative">
                <input
                    type="text"
                    placeholder="পণ্য খুঁজুন (যেমন: পাঞ্জাবি, শার্ট...)"
                    className="w-full bg-white/10 text-white placeholder:text-gray-400 border border-white/20 rounded-full py-1.5 px-10 focus:ring-2 focus:ring-brand-accent/50 outline-none transition-all text-xs"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-white/40 w-3.5 h-3.5" />
                {showAdminBtn && (
                    <button
                        onClick={() => navigate('/admin-login')}
                        className="absolute right-2 top-1/2 -translate-y-1/2 bg-brand-accent text-white text-[9px] px-2 py-0.5 rounded-md font-bold animate-pulse"
                    >
                        ADMIN PANEL
                    </button>
                )}
            </form>
        </div>
      </div>

    <nav className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b border-gray-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between gap-4">
        <Link to="/" className="text-xl font-bold tracking-tighter text-brand-primary">
          ভদ্রলোক <span className="text-brand-accent">ফ্যাশন</span>
        </Link>

        <div className="flex items-center gap-2 md:gap-4">
          <Link to="/shop" className="p-2 hover:bg-gray-100 rounded-full transition-colors hidden sm:block">
            <Package className="w-5 h-5 text-gray-600" />
          </Link>
          <Link to="/cart" className="p-2 hover:bg-gray-100 rounded-full transition-colors relative">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            {cart.length > 0 && (
              <span className="absolute top-1 right-1 bg-brand-accent text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
                {cart.length}
              </span>
            )}
          </Link>
          <Link to="/profile" className="p-2 hover:bg-gray-100 rounded-full transition-colors">
            <User className="w-5 h-5 text-gray-600" />
          </Link>
          {isAdmin && (
            <Link to="/admin" className="p-2 bg-brand-accent/10 border border-brand-accent/20 rounded-full text-brand-accent hover:bg-brand-accent/20 transition-colors">
              <Package className="w-5 h-5" />
            </Link>
          )}
        </div>
      </div>
    </nav>
    </>
  );
};

const Footer = () => (
    <footer className="bg-brand-primary text-white py-12 mt-20">
        <div className="max-w-7xl mx-auto px-4 grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
            <div>
                <h3 className="text-xl font-bold mb-4">ভদ্রলোক ফ্যাশন</h3>
                <p className="text-gray-400 text-sm">আমাদের লক্ষ্য হলো পুরুষদের জন্য সেরা ও আধুনিক পোশাক সরবরাহ করা।</p>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">দ্রুত লিঙ্ক</h3>
                <ul className="space-y-2 text-gray-400 text-sm">
                    <li><Link to="/">হোম</Link></li>
                    <li><Link to="/shop">দোকান</Link></li>
                    <li><Link to="/cart">কার্ট</Link></li>
                    <li><Link to="/profile">প্রোফাইল</Link></li>
                </ul>
            </div>
            <div>
                <h3 className="text-lg font-semibold mb-4">যোগাযোগ</h3>
                <p className="text-gray-400 text-sm">support@bhodrolokfashion.com</p>
                <p className="text-gray-400 text-sm">+৮৮০ ১৭১২-৩৪৫৬৭৮</p>
            </div>
        </div>
        <div className="border-t border-gray-800 mt-12 py-6 text-center text-xs text-gray-500">
            &copy; ২০২৪ ভদ্রলোক ফ্যাশন। সর্বস্বত্ব সংরক্ষিত।
        </div>
    </footer>
);

const App = () => {
  return (
    <Router>
      <div className="min-h-screen flex flex-col font-sans">
        <Navbar />
        <main className="flex-1">
          <Routes>
            <Route path="/" element={<HomePage />} />
            <Route path="/shop" element={<ShopPage />} />
            <Route path="/product/:id" element={<ProductPage />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/profile" element={<ProfilePage />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/admin-login" element={<AdminLoginPage />} />
          </Routes>
        </main>
        <Footer />
      </div>
    </Router>
  );
};

const AdminLoginPage = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { setAdminStatus, user } = useUser();
  const navigate = useNavigate();

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (username === 'Admin' && password === 'Rabby Sarkar') {
      if (!user) {
        alert('এডমিন প্যানেল ব্যবহারের আগে আপনার প্রোফাইল পেজ থেকে গুগল দিয়ে লগইন করে নিন (mx.morshad567@gmail.com)।');
        return;
      }
      
      const adminEmail = 'mx.morshad567@gmail.com';
      if (user.email?.toLowerCase().trim() !== adminEmail) {
        alert(`এই ইমেইল (${user.email?.trim()}) দিয়ে এডমিন প্যানেল প্রবেশ সম্ভব নয়। সঠিক এডমিন ইমেইল ব্যবহার করুন (mx.morshad567@gmail.com)।`);
        return;
      }
      
      setAdminStatus(true);
      setTimeout(() => {
        navigate('/admin');
      }, 100);
    } else {
      alert('ভুল ইউজারনেম বা পাসওয়ার্ড!');
    }
  };

  return (
    <div className="max-w-md mx-auto mt-20 p-8 bg-white rounded-2xl shadow-xl border border-gray-100">
      <h2 className="text-2xl font-bold mb-6 text-center">এডমিন লগইন</h2>
      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-1">ইউজারনেম</label>
          <input
            type="text"
            className="w-full border p-2 rounded-lg"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            required
          />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">পাসওয়ার্ড</label>
          <input
            type="password"
            className="w-full border p-2 rounded-lg"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <button type="submit" className="w-full bg-brand-primary text-white py-3 rounded-xl font-bold hover:opacity-90 transition-opacity">
          লগইন করুন
        </button>
      </form>
    </div>
  );
};

export default App;
