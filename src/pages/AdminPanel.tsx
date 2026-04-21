import React, { useEffect, useState } from 'react';
import { useUser } from '../UserContext';
import { db } from '../firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, serverTimestamp, orderBy, deleteDoc } from 'firebase/firestore';
import { Product, Order } from '../types';
import { formatPrice, cn } from '../lib/utils';
import { Package, ShoppingBag, Plus, Edit2, Trash2, Check, X, Clock, Truck, CheckCircle2, Search, Filter, Phone, MapPin, ChevronRight } from 'lucide-react';

const AdminPanel: React.FC = () => {
  const { isAdmin, loading: userLoading } = useUser();
  const [tab, setTab] = useState<'products' | 'orders'>('orders');
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingProduct, setEditingProduct] = useState<Partial<Product> | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);

  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);

  const fetchProducts = async () => {
    const prodSnap = await getDocs(query(collection(db, 'products'), orderBy('createdAt', 'desc')));
    const pList: Product[] = [];
    prodSnap.forEach(d => pList.push({ id: d.id, ...d.data() } as Product));
    setProducts(pList);
  };

  useEffect(() => {
    if (!isAdmin) return;
    const fetchData = async () => {
      setLoading(true);
      try {
          await fetchProducts();
          const ordSnap = await getDocs(query(collection(db, 'orders'), orderBy('createdAt', 'desc')));
          const oList: Order[] = [];
          ordSnap.forEach(d => oList.push({ id: d.id, ...d.data() } as Order));
          setOrders(oList);
      } catch (err) {
          console.error('Fetch failed:', err);
      }
      setLoading(false);
    };
    fetchData();
  }, [isAdmin]);

  const handleUpdateStatus = async (orderId: string, status: string) => {
    await updateDoc(doc(db, 'orders', orderId), { status });
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: status as any } : o));
    if (selectedOrder?.id === orderId) {
        setSelectedOrder(prev => prev ? { ...prev, status: status as any } : null);
    }
  };

  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;
    setLoading(true);
    
    try {
        const pData = {
          ...editingProduct,
          price: Number(editingProduct.price),
          stock: Number(editingProduct.stock || 0),
          createdAt: editingProduct.id ? editingProduct.createdAt : serverTimestamp(),
          images: typeof editingProduct.images === 'string' ? (editingProduct.images as string).split(/[,\n]/).map(s => s.trim()).filter(Boolean) : editingProduct.images,
          sizes: typeof editingProduct.sizes === 'string' ? (editingProduct.sizes as string).split(/[,\n]/).map(s => s.trim()).filter(Boolean) : editingProduct.sizes,
          colors: typeof editingProduct.colors === 'string' ? (editingProduct.colors as string).split(/[,\n]/).map(s => s.trim()).filter(Boolean) : editingProduct.colors,
        };

        if (editingProduct.id) {
           await updateDoc(doc(db, 'products', editingProduct.id), pData);
        } else {
           await addDoc(collection(db, 'products'), pData);
        }
        
        await fetchProducts();
        setShowAddModal(false);
        setEditingProduct(null);
        alert('পণ্যটি সফলভাবে সেভ করা হয়েছে!');
    } catch (error) {
        console.error(error);
        alert('পণ্য সেভ করতে সমস্যা হয়েছে।');
    }
    setLoading(false);
  };

  const handleDeleteProduct = async (id: string) => {
      if (confirm('আপনি কি নিশ্চিত যে এই পণ্যটি ডিলিট করতে চান?')) {
          await deleteDoc(doc(db, 'products', id));
          setProducts(prev => prev.filter(p => p.id !== id));
      }
  }

  if (userLoading) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">এডমিন ভেরিফাই করা হচ্ছে...</div>;
  if (!isAdmin) return <div className="max-w-7xl mx-auto px-4 py-20 text-center">আপনি এডমিন নন!</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 py-12">
      <div className="flex flex-col md:flex-row justify-between items-center mb-12 gap-6">
        <h1 className="text-4xl font-black tracking-tighter uppercase italic">Control <span className="text-brand-accent underline">Center</span></h1>
        <div className="flex bg-white p-1.5 rounded-2xl border border-gray-100 shadow-sm">
          <button 
            onClick={() => setTab('orders')}
            className={cn("px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2", tab === 'orders' ? "bg-brand-primary text-white" : "text-gray-500 hover:bg-gray-50")}
          >
            <ShoppingBag className="w-5 h-5" /> অর্ডারসমূহ
          </button>
          <button 
            onClick={() => setTab('products')}
            className={cn("px-8 py-2.5 rounded-xl font-bold transition-all flex items-center gap-2", tab === 'products' ? "bg-brand-primary text-white" : "text-gray-500 hover:bg-gray-50")}
          >
            <Package className="w-5 h-5" /> পণ্যসমূহ
          </button>
        </div>
      </div>

      {tab === 'orders' ? (
        <div className="space-y-6">
           {orders.map(order => (
             <div key={order.id} className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm space-y-6">
                <div className="flex flex-col md:flex-row justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2 mb-2">
                        <span className={cn("px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest", 
                            order.status === 'pending' ? 'bg-orange-100 text-orange-600' :
                            order.status === 'confirmed' ? 'bg-blue-100 text-blue-600' : 'bg-green-100 text-green-600'
                        )}>{order.status}</span>
                        <span className="text-xs text-gray-400 font-bold">#ORD-{order.id.slice(0, 8)}</span>
                    </div>
                    <h3 className="text-xl font-bold">{order.customerInfo.name}</h3>
                    <div className="flex gap-4 mt-2">
                        <p className="text-sm text-gray-500 font-bold">{order.customerInfo.phone}</p>
                        <button 
                            onClick={() => setSelectedOrder(order)}
                            className="text-xs font-black text-brand-accent hover:underline decoration-brand-accent/30 underline-offset-4"
                        >
                            বিস্তারিত দেখুন
                        </button>
                    </div>
                  </div>
                  <div className="text-right flex flex-col items-end gap-2">
                    <p className="text-2xl font-black text-brand-accent">{formatPrice(order.total)}</p>
                    <div className="flex gap-2">
                        {order.status === 'pending' && (
                            <button onClick={() => handleUpdateStatus(order.id, 'confirmed')} className="bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-blue-600">CONFIRM</button>
                        )}
                        {order.status === 'confirmed' && (
                            <button onClick={() => handleUpdateStatus(order.id, 'shipped')} className="bg-purple-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-purple-600">SHIP</button>
                        )}
                        {['confirmed', 'shipped'].includes(order.status) && (
                            <button onClick={() => handleUpdateStatus(order.id, 'delivered')} className="bg-green-500 text-white px-4 py-2 rounded-xl text-xs font-bold hover:bg-green-600">DELIVER</button>
                        )}
                        {order.status !== 'cancelled' && order.status !== 'delivered' && (
                            <button onClick={() => handleUpdateStatus(order.id, 'cancelled')} className="bg-red-50 text-red-500 px-4 py-2 rounded-xl text-xs font-bold hover:bg-red-100">CANCEL</button>
                        )}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                  {order.items.map((item, i) => (
                    <div key={i} className="flex gap-3 bg-gray-50 p-2 rounded-2xl border border-gray-100">
                      <img src={item.image} className="w-12 h-12 rounded-lg object-cover" alt="" referrerPolicy="no-referrer" />
                      <div className="min-w-0">
                        <p className="text-[10px] font-bold line-clamp-1">{item.name}</p>
                        <p className="text-xs font-black text-brand-accent">{item.quantity} x {item.selectedSize}</p>
                      </div>
                    </div>
                  ))}
                </div>
             </div>
           ))}
        </div>
      ) : (
        <div className="space-y-8">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl font-bold">ম্যানেজ প্রোডাক্টস ({products.length})</h2>
            <button 
                onClick={() => {setEditingProduct({ name: '', description: '', price: 0, images: [], sizes: [], colors: [], category: 'Panjabi', stock: 10 }); setShowAddModal(true);}}
                className="bg-brand-primary text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:shadow-lg transition-all"
            >
              <Plus className="w-5 h-5" /> নতুন পণ্য যোগ করুন
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {products.map(p => (
              <div key={p.id} className="bg-white p-5 rounded-[2rem] border border-gray-100 shadow-sm group hover:shadow-md transition-all">
                <div className="aspect-[4/3] rounded-2xl overflow-hidden mb-4 relative">
                  <img src={p.images[0]} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  {p.stock <= 0 && (
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center p-2">
                          <span className="bg-red-500 text-white text-[10px] font-black uppercase px-3 py-1 rounded-full">স্টক আউট</span>
                      </div>
                  )}
                </div>
                <h3 className="font-bold text-lg mb-1 line-clamp-1">{p.name}</h3>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <p className="font-black text-brand-accent">{formatPrice(p.price)}</p>
                        <p className="text-[10px] font-bold text-gray-400">স্টক: {p.stock || 0} টি</p>
                    </div>
                    <span className="text-[10px] font-bold text-gray-400 border px-2 py-0.5 rounded-full">{p.category}</span>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => {setEditingProduct(p); setShowAddModal(true);}} 
                        className="flex-1 py-2 bg-brand-primary/5 text-brand-primary rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-primary hover:text-white transition-all flex items-center justify-center gap-2"
                    >
                        <Edit2 className="w-3 h-3" /> এডিট
                    </button>
                    <button 
                        onClick={() => handleDeleteProduct(p.id)} 
                        className="p-2 bg-red-50 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-all"
                    >
                        <Trash2 className="w-4 h-4" />
                    </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Order Details Modal */}
      {selectedOrder && (
          <div className="fixed inset-0 z-[110] bg-brand-primary/80 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] shadow-2xl relative">
                  <button onClick={() => setSelectedOrder(null)} className="absolute top-6 right-6 p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                      <X className="w-6 h-6" />
                  </button>
                  
                  <div className="space-y-8">
                      <div>
                          <span className="text-xs bg-brand-accent/10 text-brand-accent px-3 py-1 rounded-full font-black uppercase tracking-widest">Order Details</span>
                          <h2 className="text-3xl font-black mt-2">#ORD-{selectedOrder.id.slice(0, 8)}</h2>
                          <p className="text-gray-400 text-sm font-bold">{selectedOrder.createdAt?.toDate().toLocaleString('bn-BD')}</p>
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                          <div className="space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Customer Info</h3>
                              <div className="bg-gray-50 p-6 rounded-3xl space-y-2 border border-gray-100">
                                  <p className="font-bold text-lg">{selectedOrder.customerInfo.name}</p>
                                  <p className="text-gray-600 flex items-center gap-2 font-bold"><Phone className="w-4 h-4" /> {selectedOrder.customerInfo.phone}</p>
                                  <p className="text-gray-600 flex items-center gap-2 italic"><MapPin className="w-4 h-4" /> {selectedOrder.customerInfo.address}</p>
                              </div>
                          </div>
                          <div className="space-y-4">
                              <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Payment & Status</h3>
                              <div className="bg-gray-50 p-6 rounded-3xl space-y-3 border border-gray-100">
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="font-bold">মেথড:</span>
                                      <span className="font-black text-brand-accent">{selectedOrder.paymentMethod}</span>
                                  </div>
                                  {selectedOrder.transactionId && (
                                       <div className="flex justify-between items-center text-sm">
                                            <span className="font-bold">TxnID:</span>
                                            <span className="bg-white px-2 py-1 rounded border font-mono text-[10px]">{selectedOrder.transactionId}</span>
                                       </div>
                                  )}
                                  <div className="flex justify-between items-center text-sm">
                                      <span className="font-bold">অবস্থা:</span>
                                      <span className="font-black uppercase text-brand-primary">{selectedOrder.status}</span>
                                  </div>
                              </div>
                          </div>
                      </div>

                      <div className="space-y-4">
                          <h3 className="text-xs font-black uppercase tracking-widest text-gray-400">Order Items</h3>
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

                      <div className="bg-brand-primary text-white p-6 rounded-[2rem] flex flex-col md:flex-row justify-between items-center gap-6">
                          <div className="text-center md:text-left">
                              <p className="text-xs font-bold opacity-60 uppercase tracking-widest">Total Amount</p>
                              <p className="text-3xl font-black">{formatPrice(selectedOrder.total)}</p>
                          </div>
                          <div className="flex flex-wrap justify-center gap-2">
                              {selectedOrder.status === 'pending' && (
                                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'confirmed')} className="bg-white text-brand-primary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all">Confirm</button>
                              )}
                              {selectedOrder.status === 'confirmed' && (
                                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'shipped')} className="bg-white text-brand-primary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all">Ship</button>
                              )}
                              {selectedOrder.status === 'shipped' && (
                                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'delivered')} className="bg-white text-brand-primary px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-brand-accent hover:text-white transition-all">Delivered</button>
                              )}
                              {selectedOrder.status !== 'cancelled' && selectedOrder.status !== 'delivered' && (
                                  <button onClick={() => handleUpdateStatus(selectedOrder.id, 'cancelled')} className="bg-red-500/20 text-red-500 px-6 py-3 rounded-xl text-xs font-black uppercase tracking-widest hover:bg-red-500 hover:text-white transition-all">Cancel</button>
                              )}
                          </div>
                      </div>
                  </div>
              </div>
          </div>
      )}

      {/* Add/Edit Modal */}
      {showAddModal && editingProduct && (
        <div className="fixed inset-0 z-[100] bg-brand-primary/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] p-10 overflow-y-auto max-h-[90vh] shadow-2xl animate-fade-in relative">
            <button onClick={() => setShowAddModal(false)} className="absolute top-6 right-6 p-3 hover:bg-gray-100 rounded-2xl transition-colors">
                <X className="w-6 h-6" />
            </button>
            <h2 className="text-3xl font-black mb-8 tracking-tighter uppercase italic">
                {editingProduct.id ? 'Edit' : 'Create'} <span className="text-brand-accent">Item</span>
            </h2>
            <form onSubmit={handleSaveProduct} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">নাম</label>
                  <input type="text" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent/20" value={editingProduct.name} onChange={e => setEditingProduct({...editingProduct, name: e.target.value})} required />
                </div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400">দাম (৳)</label>
                      <input type="number" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent/20" value={editingProduct.price} onChange={e => setEditingProduct({...editingProduct, price: Number(e.target.value)})} required />
                    </div>
                    <div className="space-y-2">
                      <label className="text-xs font-black uppercase text-gray-400">স্টক (সংখ্যা)</label>
                      <input type="number" className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent/20" value={editingProduct.stock || 0} onChange={e => setEditingProduct({...editingProduct, stock: Number(e.target.value)})} required />
                    </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">বিবরণ</label>
                <textarea className="w-full p-4 bg-gray-50 border-none rounded-2xl h-24 outline-none focus:ring-2 focus:ring-brand-accent/20" value={editingProduct.description} onChange={e => setEditingProduct({...editingProduct, description: e.target.value})} required></textarea>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-gray-400">ইমেজ লিঙ্ক (প্রতি লাইনে একটি দিলেও হবে)</label>
                <textarea 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl h-24 outline-none focus:ring-2 focus:ring-brand-accent/20" 
                    value={Array.isArray(editingProduct.images) ? editingProduct.images.join('\n') : editingProduct.images || ''} 
                    onChange={e => setEditingProduct({...editingProduct, images: e.target.value})} 
                    placeholder="https://link1.jpg&#10;https://link2.jpg"
                    required
                ></textarea>
                <p className="text-[10px] text-brand-accent font-bold italic">* ImgBB থেকে অবশ্যই 'Direct Link' কপি করে দিবেন।</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">ক্যাটাগরি</label>
                  <select className="w-full p-4 bg-gray-50 border-none rounded-2xl outline-none focus:ring-2 focus:ring-brand-accent/20" value={editingProduct.category} onChange={e => setEditingProduct({...editingProduct, category: e.target.value})}>
                    <option value="Panjabi">Panjabi</option>
                    <option value="Shirt">Shirt</option>
                    <option value="T-Shirt">T-Shirt</option>
                    <option value="Pants">Pants</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">সাইজ (কমা বা নতুন লাইন)</label>
                  <textarea 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl h-20 outline-none focus:ring-2 focus:ring-brand-accent/20" 
                    value={Array.isArray(editingProduct.sizes) ? editingProduct.sizes.join('\n') : editingProduct.sizes || ''} 
                    onChange={e => setEditingProduct({...editingProduct, sizes: e.target.value})} 
                    placeholder="M&#10;L&#10;XL"
                  ></textarea>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-black uppercase text-gray-400">রঙ (কমা বা নতুন লাইন)</label>
                  <textarea 
                    className="w-full p-4 bg-gray-50 border-none rounded-2xl h-20 outline-none focus:ring-2 focus:ring-brand-accent/20" 
                    value={Array.isArray(editingProduct.colors) ? editingProduct.colors.join('\n') : editingProduct.colors || ''} 
                    onChange={e => setEditingProduct({...editingProduct, colors: e.target.value})} 
                    placeholder="Black&#10;Blue&#10;Red"
                  ></textarea>
                </div>
              </div>

              <button type="submit" className="w-full bg-brand-primary text-white py-5 rounded-[1.5rem] font-black uppercase tracking-widest text-sm hover:translate-y-[-2px] transition-all shadow-xl shadow-brand-primary/20">
                পণ্যটি সংরক্ষণ করুন
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminPanel;
