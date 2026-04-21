import React, { useEffect, useState } from 'react';
import { useUser } from '../UserContext';
import { auth, db } from '../firebase';
import { GoogleAuthProvider, signInWithPopup, signOut } from 'firebase/auth';
import { collection, query, where, getDocs, orderBy, doc, getDoc, setDoc } from 'firebase/firestore';
import { Order, UserProfile } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { Package, MapPin, Phone, User, LogOut, Clock, CheckCircle2, Truck, XCircle, ChevronRight } from 'lucide-react';

const ProfilePage: React.FC = () => {
  const { user, profile, loading, refreshProfile } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [editing, setEditing] = useState(false);
  const [editForm, setEditForm] = useState({ name: '', phone: '', address: '' });
  const [saving, setSaving] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  useEffect(() => {
    if (profile) {
      setEditForm({
        name: profile.name || '',
        phone: profile.phone || '',
        address: profile.address || ''
      });
    }
  }, [profile]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const updatedData = {
        name: editForm.name.trim(),
        phone: editForm.phone.trim(),
        address: editForm.address.trim(),
        userId: user.uid,
        email: user.email || ''
      };
      
      await setDoc(doc(db, 'users', user.uid), updatedData, { merge: true });
      
      // Update local state immediately to avoid lockup feeling
      setEditing(false);
      alert('আপনার তথ্য সফলভাবে সেভ করা হয়েছে!');
      
      // Background refresh to sync with server
      refreshProfile().catch(err => console.error('BG Refresh failed:', err));
    } catch (error: any) {
      console.error('Profile update failed:', error);
      alert(`প্রোফাইল আপডেট করতে সমস্যা হয়েছে: ${error.message || 'Unknown error'}`);
    } finally {
      setSaving(false);
    }
  };
    
  useEffect(() => {
    const fetchOrders = async () => {
      if (user) {
        setFetchingOrders(true);
        const q = query(
          collection(db, 'orders'),
          where('userId', '==', user.uid),
          orderBy('createdAt', 'desc')
        );
        const querySnapshot = await getDocs(q);
        const items: Order[] = [];
        querySnapshot.forEach((doc) => {
          items.push({ id: doc.id, ...doc.data() } as Order);
        });
        setOrders(items);
        setFetchingOrders(false);
      }
    };
    fetchOrders();
  }, [user]);

  const handleLogin = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const u = result.user;
      
      // Save initial profile if doesn't exist
      const docRef = doc(db, 'users', u.uid);
      const docSnap = await getDoc(docRef);
      if (!docSnap.exists()) {
        await setDoc(docRef, {
          userId: u.uid,
          name: u.displayName || '',
          email: u.email || '',
          phone: '',
          address: ''
        });
      }
    } catch (error) {
      console.error(error);
    }
  };

  const statusIcons: Record<string, any> = {
    pending: { icon: Clock, color: 'text-orange-500', bg: 'bg-orange-100', text: 'পেন্ডিং' },
    confirmed: { icon: CheckCircle2, color: 'text-blue-500', bg: 'bg-blue-100', text: 'নিশ্চিত' },
    shipped: { icon: Truck, color: 'text-purple-500', bg: 'bg-purple-100', text: 'শিপড' },
    delivered: { icon: CheckCircle2, color: 'text-green-500', bg: 'bg-green-100', text: 'ডেলিভার' },
    cancelled: { icon: XCircle, color: 'text-red-500', bg: 'bg-red-100', text: 'বাতিল' }
  };

  if (loading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">লোড হচ্ছে...</div>;

  if (!user) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center space-y-8">
        <div className="w-24 h-24 bg-brand-accent/10 rounded-full flex items-center justify-center mx-auto">
            <User className="w-12 h-12 text-brand-accent" />
        </div>
        <div className="space-y-2">
            <h1 className="text-3xl font-bold">লগইন করুন</h1>
            <p className="text-gray-500">আপনার অর্ডার ও প্রোফাইল দেখতে লগইন থাকা প্রয়োজন।</p>
        </div>
        <button 
          onClick={handleLogin}
          className="w-full flex items-center justify-center gap-3 bg-white border-2 border-gray-100 py-4 rounded-2xl font-bold hover:bg-gray-50 transition-all shadow-sm"
        >
          <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" className="w-6 h-6" alt="" />
          গুগল দিয়ে লগইন করুন
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-12 space-y-12">
      {/* Header Profile */}
      <div className="flex flex-col md:flex-row items-center gap-8 bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4">
            <button onClick={() => signOut(auth)} className="flex items-center gap-2 text-red-500 text-sm font-bold hover:bg-red-50 px-4 py-2 rounded-xl transition-colors">
                <LogOut className="w-4 h-4" /> লগ আউট
            </button>
        </div>
        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-gray-50 flex-shrink-0">
          <img src={user.photoURL || `https://ui-avatars.com/api/?name=${profile?.name || 'User'}&background=random`} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
        </div>
        <div className="text-center md:text-left space-y-4 flex-1">
          {editing ? (
            <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
                <input 
                    className="w-full p-2 border rounded-lg text-sm" 
                    placeholder="নাম"
                    value={editForm.name} 
                    onChange={e => setEditForm({...editForm, name: e.target.value})}
                />
                <input 
                    className="w-full p-2 border rounded-lg text-sm" 
                    placeholder="ফোন নম্বর"
                    value={editForm.phone} 
                    onChange={e => setEditForm({...editForm, phone: e.target.value})}
                />
                <textarea 
                    className="w-full p-2 border rounded-lg text-sm" 
                    placeholder="ঠিকানা"
                    value={editForm.address} 
                    onChange={e => setEditForm({...editForm, address: e.target.value})}
                />
                <div className="flex gap-2">
                    <button type="submit" disabled={saving} className="bg-brand-accent text-white px-4 py-2 rounded-lg text-xs font-bold">
                        {saving ? 'আপডেট হচ্ছে...' : 'সেভ করুন'}
                    </button>
                    <button type="button" onClick={() => setEditing(false)} className="bg-gray-100 px-4 py-2 rounded-lg text-xs font-bold text-gray-500">
                        বাতিল
                    </button>
                </div>
            </form>
          ) : (
            <>
              <div>
                <h1 className="text-3xl font-bold">{profile?.name || user.displayName}</h1>
                <p className="text-gray-500 text-sm">{user.email}</p>
              </div>
              <div className="flex flex-wrap justify-center md:justify-start gap-4">
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600">
                    <Phone className="w-3 h-3" /> {profile?.phone || 'ফোন নেই'}
                </div>
                <div className="flex items-center gap-2 bg-gray-50 px-4 py-2 rounded-xl text-xs font-semibold text-gray-600">
                    <MapPin className="w-3 h-3" /> {profile?.address || 'ঠিকানা নেই'}
                </div>
                <button onClick={() => setEditing(true)} className="text-xs font-bold text-brand-accent hover:underline">
                    এডিট প্রোফাইল
                </button>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Orders Section */}
      <div className="space-y-6">
        <div className="flex items-center gap-3">
            <Package className="w-6 h-6 text-brand-primary" />
            <h2 className="text-2xl font-bold">আমার অর্ডারসমূহ</h2>
        </div>

        {fetchingOrders ? (
            <div className="space-y-4">
                {[1,2].map(n => <div key={n} className="h-32 bg-gray-100 rounded-3xl animate-pulse"></div>)}
            </div>
        ) : orders.length === 0 ? (
            <div className="text-center py-20 bg-white rounded-3xl border border-dashed border-gray-300">
                <p className="text-gray-500">আপনি এখনো কোনো অর্ডার করেননি।</p>
                <button onClick={() => window.location.href = '/shop'} className="mt-4 text-brand-accent font-bold">কেনাকাটা শুরু করুন</button>
            </div>
        ) : (
            <div className="space-y-6">
                {orders.map((order) => {
                    const status = statusIcons[order.status] || statusIcons.pending;
                    return (
                        <div key={order.id} className="bg-white rounded-3xl border border-gray-100 shadow-sm overflow-hidden group hover:shadow-md transition-shadow">
                            <div className="p-6 flex flex-col md:flex-row justify-between gap-6">
                                <div className="space-y-4 flex-1">
                                    <div className="flex flex-wrap items-center gap-3">
                                        <span className={`flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${status.bg} ${status.color}`}>
                                            <status.icon className="w-3.5 h-3.5" /> {status.text}
                                        </span>
                                        <span className="text-xs text-gray-400 font-medium">আইডি: {order.id.slice(0, 8)}...</span>
                                        <span className="text-xs text-gray-400 font-medium">তারিখ: {order.createdAt?.toDate().toLocaleDateString('bn-BD')}</span>
                                    </div>
                                    <div className="flex -space-x-3 overflow-hidden">
                                        {order.items.map((item, i) => (
                                            <img key={i} src={item.image} className="inline-block h-12 w-12 rounded-xl ring-4 ring-white object-cover" alt="" referrerPolicy="no-referrer" />
                                        ))}
                                        {order.items.length > 3 && (
                                            <div className="inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gray-100 text-xs font-medium text-gray-600 ring-4 ring-white">
                                                +{order.items.length - 3}
                                            </div>
                                        )}
                                    </div>
                                </div>
                                <div className="text-right flex flex-col justify-between items-end gap-2 pr-2">
                                    <p className="text-xl font-black text-brand-primary">{formatPrice(order.total)}</p>
                                    <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{order.paymentMethod}</p>
                                    <button 
                                        onClick={() => setSelectedOrder(order)}
                                        className="flex items-center gap-1 text-xs font-bold text-brand-accent group-hover:translate-x-1 transition-transform"
                                    >
                                        বিস্তারিত দেখুন <ChevronRight className="w-3 h-3" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    );
                })}
            </div>
        )}
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-[110] bg-brand-primary/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] shadow-2xl relative">
                  <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                      <XCircle className="w-6 h-6" />
                  </button>
                  
                  <div className="space-y-8">
                      <div>
                          <span className="text-xs bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full font-black uppercase tracking-widest">Order Details</span>
                          <h2 className="text-3xl font-black mt-2">#ORD-{selectedOrder.id.slice(0, 8)}</h2>
                          <p className="text-gray-400 text-sm font-bold">{selectedOrder.createdAt?.toDate().toLocaleString('bn-BD')}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">শিফিং ডিটেইলস</h3>
                              <div className="bg-gray-50 p-6 rounded-3xl space-y-2 border border-gray-100">
                                  <p className="font-bold text-lg">{selectedOrder.customerInfo.name}</p>
                                  <p className="text-gray-600 flex items-center gap-2 font-bold"><Phone className="w-4 h-4" /> {selectedOrder.customerInfo.phone}</p>
                                  <p className="text-gray-600 flex items-center gap-2 italic text-sm leading-relaxed"><MapPin className="w-4 h-4" /> {selectedOrder.customerInfo.address}</p>
                                  <p className="text-xs bg-brand-accent/10 text-brand-accent inline-block px-2 py-0.5 rounded font-bold mt-2">
                                      এরিয়া: {selectedOrder.customerInfo.location === 'Inside Dhaka' ? 'ঢাকার ভিতরে' : 'ঢাকার বাহিরে'}
                                  </p>
                              </div>
                          </div>
                          <div className="space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">পেমেন্ট ও স্ট্যাটাস</h3>
                              <div className="bg-gray-50 p-6 rounded-3xl space-y-3 border border-gray-100">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="font-bold">পেমেন্ট মেথড:</span>
                                      <span className="font-black text-brand-accent">{selectedOrder.paymentMethod}</span>
                                  </div>
                                  {selectedOrder.transactionId && (
                                       <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold">TxnID:</span>
                                            <span className="bg-white px-2 py-1 rounded border font-mono text-[10px]">{selectedOrder.transactionId}</span>
                                       </div>
                                  )}
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="font-bold">অর্ডার অবস্থা:</span>
                                      <span className={cn("px-2 py-0.5 rounded text-[10px] font-black uppercase", statusIcons[selectedOrder.status]?.bg, statusIcons[selectedOrder.status]?.color)}>
                                          {statusIcons[selectedOrder.status]?.text || selectedOrder.status}
                                      </span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">অর্ডার আইটেম</h3>
                          <div className="space-y-3">
                              {selectedOrder.items.map((item, i) => (
                                  <div key={i} className="flex items-center gap-4 bg-white p-3 rounded-2xl border border-gray-100">
                                      <img src={item.image} className="w-16 h-16 rounded-xl object-cover" alt="" referrerPolicy="no-referrer" />
                                      <div className="flex-1">
                                          <p className="font-bold text-sm">{item.name}</p>
                                          <p className="text-[10px] text-gray-400">সাইজ: {item.selectedSize} | রঙ: <span style={{backgroundColor: item.selectedColor}} className="inline-block w-2 h-2 rounded-full align-middle"></span></p>
                                      </div>
                                      <div className="text-right">
                                          <p className="font-black text-brand-accent text-sm">{formatPrice(item.price)}</p>
                                          <p className="text-[10px] font-bold text-gray-400">Qty: {item.quantity}</p>
                                      </div>
                                  </div>
                              ))}
                          </div>
                      </div>

                      <div className="bg-brand-primary text-white p-8 rounded-[2.5rem] space-y-4">
                          <div className="flex justify-between text-sm opacity-80">
                              <span>আইটেম টোটাল:</span>
                              <span className="font-bold">{formatPrice(selectedOrder.total - (selectedOrder.shipping || 0))}</span>
                          </div>
                          {selectedOrder.shipping && (
                              <div className="flex justify-between text-sm opacity-80">
                                  <span>ডেলিভারি চার্জ:</span>
                                  <span className="font-bold">{formatPrice(selectedOrder.shipping)}</span>
                              </div>
                          )}
                          <div className="h-px bg-white/10"></div>
                          <div className="flex justify-between items-center">
                              <div>
                                  <p className="text-xs font-bold opacity-60 uppercase tracking-widest">সর্বমোট পরিশোধযোগ্য</p>
                                  <p className="text-3xl font-black">{formatPrice(selectedOrder.total)}</p>
                              </div>
                          </div>
                      </div>
                      
                      {selectedOrder.status === 'pending' && (
                          <p className="text-center text-xs text-gray-400 font-medium">আমরা আপনার অর্ডারটি যাচাই করছি। শীঘ্রই নিশ্চিত করা হবে।</p>
                      )}
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default ProfilePage;
