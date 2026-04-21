import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { ShoppingBag, ChevronRight, TrendingUp, ShieldCheck, Clock, Layers } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, limit, getDocs, addDoc, serverTimestamp } from 'firebase/firestore';
import { Product } from '../types';
import { formatPrice } from '../lib/utils';
import { useUser } from '../UserContext';

const HomePage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useUser();

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'), limit(4));
      const querySnapshot = await getDocs(q);
      const items: Product[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      
      setProducts(items);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  return (
    <div className="space-y-12 pb-20">
      {/* Hero Section */}
      <section className="relative h-[50vh] flex items-center overflow-hidden bg-brand-primary rounded-b-[4rem]">
        <div className="max-w-7xl mx-auto px-4 relative z-10 w-full text-center">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="max-w-3xl mx-auto text-white space-y-6"
          >
            <h1 className="text-5xl md:text-7xl font-bold leading-tight">
              নিজের স্টাইলকে দিন <br />
              <span className="text-brand-accent italic">নতুন পরিচয়</span>
            </h1>
            <p className="text-lg text-gray-300">
              ভদ্রলোক ফ্যাশন-এ আমরা নিয়ে এসেছি ছেলেদের প্রিমিয়াম পাঞ্জাবীর বিশাল কালেকশন। 
            </p>
            <div className="flex justify-center gap-4">
                <Link to="/shop" className="bg-brand-accent text-white px-8 py-4 rounded-full font-bold flex items-center gap-2 hover:opacity-90 transition-opacity">
                    কালেকশন দেখুন <ChevronRight className="w-5 h-5" />
                </Link>
            </div>
          </motion.div>
        </div>
        {/* Subtle decorative elements */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-brand-accent/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2"></div>
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-brand-accent/5 rounded-full blur-3xl translate-y-1/2 -translate-x-1/2"></div>
      </section>

      {/* Collection Preview */}
      <section className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex justify-between items-end mb-12">
            <div>
                <h2 className="text-3xl font-bold mb-2 text-brand-primary">নতুন কালেকশন</h2>
                <div className="h-1.5 w-20 bg-brand-accent rounded-full"></div>
            </div>
            <Link to="/shop" className="text-brand-accent font-semibold flex items-center gap-1 hover:underline">
                সবগুলো দেখুন <ChevronRight className="w-4 h-4" />
            </Link>
        </div>

        {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[1,2,3,4].map(n => <div key={n} className="aspect-[3/4] bg-gray-100 rounded-3xl animate-pulse"></div>)}
            </div>
        ) : (
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {products.map((p) => (
                    <Link key={p.id} to={`/product/${p.id}`} className="group cursor-pointer">
                        <div className="aspect-[3/4] rounded-3xl overflow-hidden bg-gray-100 mb-4 relative">
                            <img 
                                src={p.images[0]} 
                                alt={p.name} 
                                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                                referrerPolicy="no-referrer"
                            />
                            {p.stock <= 0 && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
                                    <span className="bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">স্টক আউট</span>
                                </div>
                            )}
                        </div>
                        <h3 className="font-bold text-brand-primary text-lg mb-1">{p.name}</h3>
                        <p className="text-brand-accent font-bold">{formatPrice(p.price)}</p>
                    </Link>
                ))}
            </div>
        )}
      </section>
    </div>
  );
};

export default HomePage;
