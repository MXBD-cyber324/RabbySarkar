import React, { useEffect, useState } from 'react';
import { db } from '../firebase';
import { collection, getDocs, query, orderBy } from 'firebase/firestore';
import { Product } from '../types';
import { Link, useSearchParams } from 'react-router-dom';
import { formatPrice } from '../lib/utils';
import { Filter, Search } from 'lucide-react';

const ShopPage: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [category, setCategory] = useState('All');
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get('q') || '');

  useEffect(() => {
    const q = searchParams.get('q');
    if (q) setSearchTerm(q);
  }, [searchParams]);

  useEffect(() => {
    const fetchProducts = async () => {
      const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'));
      const querySnapshot = await getDocs(q);
      const items: Product[] = [];
      querySnapshot.forEach((doc) => {
        items.push({ id: doc.id, ...doc.data() } as Product);
      });
      setProducts(items);
      setFilteredProducts(items);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  useEffect(() => {
    let filtered = products;
    if (category !== 'All') {
      filtered = filtered.filter(p => p.category === category);
    }
    if (searchTerm) {
      filtered = filtered.filter(p => p.name.toLowerCase().includes(searchTerm.toLowerCase()));
    }
    setFilteredProducts(filtered);
  }, [category, searchTerm, products]);

  const categories = ['All', 'Panjabi', 'Shirt', 'T-Shirt', 'Pants'];

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Sidebar Filters */}
        <aside className="w-full md:w-64 space-y-8">
          <div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                <Filter className="w-5 h-5" /> ফিল্টার
            </h3>
            <div className="space-y-2">
              {categories.map((c) => (
                <button
                  key={c}
                  onClick={() => setCategory(c)}
                  className={`w-full text-left px-4 py-2 rounded-xl text-sm transition-all ${
                    category === c ? 'bg-brand-accent text-white font-bold' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                  }`}
                >
                  {c === 'All' ? 'সব ধরণের' : c}
                </button>
              ))}
            </div>
          </div>

          <div className="relative">
            <input 
                type="text" 
                placeholder="রঙ বা নাম দিয়ে খুঁজুন..." 
                className="w-full bg-white border border-gray-200 rounded-xl py-3 px-10 text-sm focus:ring-2 focus:ring-brand-accent/20 outline-none"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
            />
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
          </div>
        </aside>

        {/* Product Grid */}
        <div className="flex-1">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-2xl font-bold">শপ কালেকশন ({filteredProducts.length})</h1>
          </div>

          {loading ? (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
                 {[1,2,3,4,5,6].map(n => <div key={n} className="aspect-[3/4] bg-gray-100 rounded-3xl animate-pulse"></div>)}
            </div>
          ) : filteredProducts.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <p className="text-gray-500">কোনো পণ্য পাওয়া যায়নি।</p>
                <button onClick={() => {setCategory('All'); setSearchTerm('');}} className="mt-4 text-brand-accent font-bold">সব পণ্য দেখুন</button>
            </div>
          ) : (
            <div className="grid grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredProducts.map((p) => (
                <Link key={p.id} to={`/product/${p.id}`} className="group p-4 bg-white rounded-3xl hover:shadow-xl transition-shadow border border-gray-50">
                  <div className="aspect-[3/4] rounded-2xl overflow-hidden bg-gray-100 mb-4 relative">
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
                  <h3 className="font-bold text-gray-800 line-clamp-1">{p.name}</h3>
                  <div className="flex items-center justify-between mt-2">
                    <p className="text-brand-accent font-bold">{formatPrice(p.price)}</p>
                    <div className="text-[10px] bg-gray-100 px-2 py-0.5 rounded-md text-gray-500 font-medium">
                        {p.category}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ShopPage;
