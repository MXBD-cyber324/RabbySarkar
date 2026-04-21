import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { Product } from '../types';
import { useCart } from '../CartContext';
import { formatPrice, cn } from '../lib/utils';
import { ShoppingCart, Share2, ChevronLeft, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';

const ProductPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedSize, setSelectedSize] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [mainImage, setMainImage] = useState('');
  const [added, setAdded] = useState(false);
  const { addToCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProduct = async () => {
      if (!id) return;
      const docRef = doc(db, 'products', id);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        const data = docSnap.data() as Product;
        setProduct({ id: docSnap.id, ...data });
        setMainImage(data.images[0]);
        if (data.sizes?.length > 0) setSelectedSize(data.sizes[0]);
        if (data.colors?.length > 0) setSelectedColor(data.colors[0]);
      }
      setLoading(false);
    };
    fetchProduct();
  }, [id]);

  const handleAddToCart = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      selectedSize,
      selectedColor,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const handleShare = async () => {
    if (!product) return;
    if (navigator.share) {
      try {
        await navigator.share({
          title: product.name,
          text: product.description,
          url: window.location.href,
        });
      } catch (error) {
        console.log('Error sharing:', error);
      }
    } else {
      try {
        await navigator.clipboard.writeText(window.location.href);
        alert('লিংকটি কপি করা হয়েছে!');
      } catch (err) {
        console.error('Failed to copy: ', err);
      }
    }
  };

  const handleBuyNow = () => {
    if (!product) return;
    addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      quantity: 1,
      image: product.images[0],
      selectedSize,
      selectedColor,
    });
    navigate('/cart');
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">লোড হচ্ছে...</div>;
  if (!product) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">পণ্যটি খুঁজে পাওয়া যায়নি!</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-gray-500 hover:text-brand-primary mb-8 transition-colors">
        <ChevronLeft className="w-5 h-5" /> পিছনে যান
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* Images */}
        <div className="space-y-4">
          <div className="aspect-[4/5] rounded-3xl overflow-hidden bg-gray-100 border border-gray-100">
            <img 
                src={mainImage} 
                alt={product.name} 
                className="w-full h-full object-cover transition-opacity duration-300" 
                referrerPolicy="no-referrer"
            />
          </div>
          <div className="grid grid-cols-4 gap-4">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setMainImage(img)}
                className={cn(
                  "aspect-square rounded-2xl overflow-hidden border-2 transition-all",
                  mainImage === img ? "border-brand-accent" : "border-transparent opacity-60"
                )}
              >
                <img src={img} alt="" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
              </button>
            ))}
          </div>
        </div>

        {/* Details */}
        <div className="space-y-8">
          <div>
            <div className="flex gap-2 mb-2">
                <span className="text-xs bg-brand-accent/10 text-brand-accent px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                    {product.category}
                </span>
                {product.stock > 0 ? (
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        স্টক আছে ({product.stock})
                    </span>
                ) : (
                    <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full font-bold uppercase tracking-wider">
                        স্টক আউট
                    </span>
                )}
            </div>
            <h1 className="text-3xl md:text-4xl font-bold text-brand-primary mb-2">{product.name}</h1>
            <p className="text-3xl font-black text-brand-accent">{formatPrice(product.price)}</p>
          </div>

          <p className="text-gray-600 leading-relaxed whitespace-pre-line">{product.description}</p>

          {/* Sizes */}
          {product.sizes?.length > 0 && (
            <div>
              <h3 className="font-bold mb-4">সাইজ সিলেক্ট করুন</h3>
              <div className="flex flex-wrap gap-3">
                {product.sizes.map(s => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={cn(
                      "w-12 h-12 rounded-xl border-2 font-bold transition-all",
                      selectedSize === s ? "border-brand-accent bg-brand-accent text-white" : "border-gray-200 text-gray-600 hover:border-brand-accent/50"
                    )}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Colors */}
          {product.colors?.length > 0 && (
            <div>
              <h3 className="font-bold mb-4">রঙ সিলেক্ট করুন</h3>
              <div className="flex flex-wrap gap-4">
                {product.colors.map(c => (
                  <button
                    key={c}
                    onClick={() => setSelectedColor(c)}
                    className={cn(
                      "group relative w-8 h-8 rounded-full border-4 border-white ring-2 transition-all",
                      selectedColor === c ? "ring-brand-accent scale-110" : "ring-transparent hover:ring-gray-300"
                    )}
                    style={{ backgroundColor: c }}
                  >
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap font-bold uppercase">
                        {c}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
            <button
              onClick={handleAddToCart}
              disabled={product.stock <= 0}
              className="w-full bg-brand-primary text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
              <AnimatePresence mode="wait">
                {added ? (
                  <motion.span 
                    key="added"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <Check className="w-5 h-5" /> কার্টে যোগ হয়েছে
                  </motion.span>
                ) : (
                  <motion.span 
                    key="add"
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="flex items-center gap-2"
                  >
                    <ShoppingCart className="w-5 h-5" /> {product.stock > 0 ? 'কার্টে যোগ করুন' : 'স্টক আউট'}
                  </motion.span>
                )}
              </AnimatePresence>
            </button>
            <button
                onClick={handleBuyNow}
                disabled={product.stock <= 0}
                className="w-full bg-brand-accent text-white py-4 px-8 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-90 transition-all active:scale-95 disabled:opacity-50 disabled:grayscale disabled:cursor-not-allowed"
            >
                সরাসরি কিনুন
            </button>
          </div>
          <div className="flex gap-4">
            <button 
              onClick={handleShare}
              className="w-full p-4 border-2 border-gray-100 rounded-2xl hover:bg-gray-50 transition-colors flex items-center justify-center gap-2 font-bold text-gray-500"
            >
              <Share2 className="w-5 h-5" /> শেয়ার করুন
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductPage;
