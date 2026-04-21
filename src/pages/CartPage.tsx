import React, { useState } from 'react';
import { useCart } from '../CartContext';
import { useUser } from '../UserContext';
import { db } from '../firebase';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { formatPrice } from '../lib/utils';
import { Trash2, CreditCard, ChevronRight, CheckCircle2, Loader2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const CartPage: React.FC = () => {
  const { cart, removeFromCart, clearCart, cartTotal } = useCart();
  const { user } = useUser();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<string | null>(null);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    location: 'Inside Dhaka', // Default
    paymentMethod: 'COD',
    transactionId: '',
  });

  const shippingCharge = formData.location === 'Inside Dhaka' ? 80 : 150;

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const orderData = {
        userId: user?.uid || null,
        customerInfo: {
          name: formData.name,
          phone: formData.phone,
          address: formData.address,
          location: formData.location,
        },
        items: cart,
        subtotal: cartTotal,
        shipping: shippingCharge,
        total: cartTotal + shippingCharge,
        paymentMethod: formData.paymentMethod,
        transactionId: formData.transactionId,
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'orders'), orderData);
      setOrderSuccess(docRef.id);
      clearCart();
    } catch (error) {
      console.error(error);
      alert('অর্ডার করতে সমস্যা হয়েছে। আবার চেষ্টা করুন।');
    }
    setLoading(false);
  };

  if (orderSuccess) {
    return (
      <div className="max-w-xl mx-auto px-4 py-20 text-center space-y-6">
        <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto" />
        <h1 className="text-3xl font-bold">অর্ডার সফল হয়েছে!</h1>
        <p className="text-gray-600 italic">আপনার অর্ডার আইডি: <span className="font-bold text-brand-primary">{orderSuccess}</span></p>
        <p className="text-gray-500">আমরা শীঘ্রই আপনার সাথে যোগাযোগ করবো। অর্ডারের অবস্থা প্রোফাইল থেকে দেখতে পারেন।</p>
        <button onClick={() => navigate('/profile')} className="bg-brand-primary text-white px-8 py-3 rounded-xl font-bold">
            অর্ডার দেখুন
        </button>
      </div>
    );
  }

  if (cart.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">আপনার কার্ট খালি!</h1>
        <p className="text-gray-500 mb-8">কেনাকাটা শুরু করার জন্য আমাদের কালেকশন দেখুন।</p>
        <button onClick={() => navigate('/shop')} className="bg-brand-accent text-white px-8 py-3 rounded-xl font-bold">
            দোকানে যান
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col lg:flex-row gap-12">
        {/* Cart Items */}
        <div className="flex-1 space-y-6">
          <div className="flex items-center justify-between mb-8">
            <h1 className="text-3xl font-bold">ব্যাগ কালেকশন ({cart.length})</h1>
            <div className="flex gap-2">
                <span className={cn("w-3 h-3 rounded-full", step === 1 ? "bg-brand-accent" : "bg-gray-200")}></span>
                <span className={cn("w-3 h-3 rounded-full", step === 2 ? "bg-brand-accent" : "bg-gray-200")}></span>
            </div>
          </div>

          {step === 1 ? (
            <div className="space-y-4">
              {cart.map((item, index) => (
                <div key={`${item.productId}-${index}`} className="flex gap-4 p-4 bg-white rounded-3xl border border-gray-100 shadow-sm relative group">
                  <div className="w-24 h-24 rounded-2xl overflow-hidden bg-gray-100 flex-shrink-0">
                    <img src={item.image} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                  </div>
                  <div className="flex-1 space-y-1">
                    <h3 className="font-bold text-lg">{item.name}</h3>
                    <p className="text-xs text-gray-500">সাইজ: {item.selectedSize} | রঙ: <span style={{backgroundColor: item.selectedColor}} className="inline-block w-3 h-3 rounded-full align-middle"></span></p>
                    <p className="font-bold text-brand-accent">{formatPrice(item.price)} x {item.quantity}</p>
                  </div>
                  <button 
                    onClick={() => removeFromCart(index)}
                    className="absolute right-4 top-4 p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              ))}
              <div className="bg-white p-6 rounded-3xl border border-gray-100 mt-8 space-y-4 shadow-sm">
                <div className="flex justify-between text-lg font-bold">
                  <span>মোট খরচ:</span>
                  <span className="text-brand-accent">{formatPrice(cartTotal)}</span>
                </div>
                <button 
                    onClick={() => setStep(2)}
                    className="w-full bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-95 transition-opacity"
                >
                  পরবর্তী ধাপ <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6">
              <h2 className="text-2xl font-bold mb-6">শিফিং ডিটেইলস</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 px-1">আপনার নাম</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    placeholder="পুরো নাম লিখুন"
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 outline-none"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-gray-600 px-1">ফোন নম্বর</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    placeholder="০১৭... "
                    className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 outline-none"
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">ডেলিভারি এরিয়া</label>
                <select
                  name="location"
                  value={formData.location}
                  onChange={handleInputChange}
                  className="w-full p-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-brand-accent/20 outline-none bg-white font-bold"
                >
                  <option value="Inside Dhaka">ঢাকার ভিতরে (৮০ টাকা)</option>
                  <option value="Outside Dhaka">ঢাকার বাহিরে (১৫০ টাকা)</option>
                </select>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-gray-600 px-1">বিস্তারিত ঠিকানা</label>
                <textarea
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  placeholder="আপনার সঠিক ঠিকানা লিখুন (বাসা নং, রোড, এলাকা)"
                  className="w-full p-3 border border-gray-200 rounded-xl h-24 focus:ring-2 focus:ring-brand-accent/20 outline-none border-gray-200"
                  required
                ></textarea>
              </div>

              <div className="space-y-4">
                <h3 className="font-bold text-lg">পেমেন্ট মেথড</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  {['COD', 'bKash', 'Nagad', 'Rocket'].map(method => (
                    <button
                      key={method}
                      type="button"
                      onClick={() => setFormData({...formData, paymentMethod: method})}
                      className={cn(
                        "p-4 rounded-xl border-2 font-bold transition-all text-sm",
                        formData.paymentMethod === method ? "border-brand-accent bg-brand-accent/5 text-brand-accent" : "border-gray-100 hover:border-gray-200"
                      )}
                    >
                      {method === 'COD' ? 'ক্যাশ অন' : method}
                    </button>
                  ))}
                </div>
              </div>

              {formData.paymentMethod !== 'COD' && (
                <div className="space-y-2 animate-fade-in bg-brand-accent/5 p-6 rounded-2xl border border-brand-accent/10">
                  <p className="text-xs text-brand-accent font-bold mb-4">নিচের নম্বরে সেন্ড মানি করে ট্রানজেকশন আইডি দিন:</p>
                  <div className="flex justify-between items-center bg-white p-3 rounded-lg border border-brand-accent/20 mb-4">
                    <span className="font-bold text-gray-400">{formData.paymentMethod} Personal</span>
                    <span className="font-black text-brand-primary">০১৭১২-৩৪৫৬৭৮</span>
                  </div>
                  <label className="text-sm font-bold text-gray-600 px-1">ট্রানজেকশন আইডি (TxnID)</label>
                  <input
                    type="text"
                    name="transactionId"
                    value={formData.transactionId}
                    onChange={handleInputChange}
                    placeholder="উদাহরণ: ABC123XYZ"
                    className="w-full p-3 border border-orange-200 bg-white rounded-xl outline-none"
                    required
                  />
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button 
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 border-2 border-gray-100 py-4 rounded-2xl font-bold text-gray-500 hover:bg-gray-50"
                  disabled={loading}
                >
                  পিছনে যান
                </button>
                <button 
                  type="submit"
                  className="flex-[2] bg-brand-primary text-white py-4 rounded-2xl font-bold flex items-center justify-center gap-2 hover:opacity-95 disabled:opacity-50"
                  disabled={loading}
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <CreditCard className="w-5 h-5" />} 
                  অর্ডার সম্পন্ন করুন
                </button>
              </div>
            </form>
          )}
        </div>

        {/* Order Summary (Visible on MD+) */}
        <div className="w-full lg:w-96 space-y-6">
            <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-xl space-y-6 sticky top-24">
                <h2 className="text-xl font-bold">অর্ডার সামারি</h2>
                <div className="space-y-3">
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>আইটেম ({cart.length}):</span>
                        <span>{formatPrice(cartTotal)}</span>
                    </div>
                    <div className="flex justify-between text-sm text-gray-600">
                        <span>ডেলিভারি চার্জ ({formData.location === 'Inside Dhaka' ? 'ঢাকা' : 'ঢাকার বাহিরে'}):</span>
                        <span>{formatPrice(shippingCharge)}</span>
                    </div>
                    <div className="h-px bg-gray-100"></div>
                    <div className="flex justify-between text-lg font-bold">
                        <span>সর্বমোট:</span>
                        <span className="text-brand-accent">{formatPrice(cartTotal + shippingCharge)}</span>
                    </div>
                </div>
                <div className="bg-texture p-4 rounded-2xl text-[10px] text-gray-400">
                    * আপনার অর্ডারটি ৩-৫ কর্মদিবসের মধ্যে ডেলিভারি করা হবে। কোনো প্রয়োজনে আমাদের হটলাইনে যোগাযোগ করুন।
                </div>
            </div>
        </div>
      </div>
    </div>
  );
};

import { cn } from '../lib/utils';
export default CartPage;
