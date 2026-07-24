'use client';

import { useState, useEffect, useRef } from 'react';
import { ShoppingBag, X, Plus, Minus, Trash2, CheckCircle2, Package, Tag, Clock } from 'lucide-react';
import { submitMerchOrder, CartItem } from '@/actions/merchandise';
import { motion, AnimatePresence } from 'framer-motion';

const ITEMS = [
  {
    id: 'oversized_tshirt',
    name: 'Oversized Tshirt',
    price: 55,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL'],
    colors: ['White Print', 'Blue Print'],
    popular: true
  },
  {
    id: 'adults_tshirt',
    name: 'Adults Tshirt',
    price: 35,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL', '3XL']
  },
  {
    id: 'sweatshirt',
    name: 'Sweatshirt',
    price: 80,
    sizes: ['XS', 'S', 'M', 'L', 'XL', '2XL'],
    note: '(White Print. True to size and smaller cut)'
  },
  {
    id: 'kids_tshirt',
    name: 'Kids Tshirt',
    price: 35,
    sizes: ['Kids 26', 'Kids 28', 'Kids 30', 'Kids 32'],
    note: '(Red Print. Size runs small)'
  },
  {
    id: 'cap',
    name: 'Cap',
    price: 35,
    sizes: ['One Size']
  }
];

export default function MerchandisePreOrder() {
  const [isOpen, setIsOpen] = useState(false);
  const [step, setStep] = useState<1 | 2>(1);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  
  const [cart, setCart] = useState<CartItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [orderNumber, setOrderNumber] = useState('');

  const [lookupLoading, setLookupLoading] = useState(false);

  // Auto-fill logic
  const handleNameBlur = async () => {
    if (!name.trim()) return;
    setLookupLoading(true);
    try {
      const res = await fetch(`/api/lookup-attendee?name=${encodeURIComponent(name.trim())}`);
      const data = await res.json();
      if (data.success && data.email && data.phone) {
        setEmail(data.email);
        setPhone(data.phone);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLookupLoading(false);
    }
  };

  const addToCart = (itemId: string, size: string, color?: string) => {
    const itemDef = ITEMS.find(i => i.id === itemId);
    if (!itemDef) return;

    const finalItemName = color ? `${itemDef.name} (${color})` : itemDef.name;

    setCart(prev => {
      const existing = prev.find(c => c.itemType === finalItemName && c.size === size);
      if (existing) {
        return prev.map(c => c === existing ? { ...c, quantity: c.quantity + 1 } : c);
      }
      return [...prev, { itemType: finalItemName, size: size === 'One Size' ? null : size, quantity: 1, price: itemDef.price }];
    });
  };

  const updateQuantity = (index: number, delta: number) => {
    setCart(prev => {
      const newCart = [...prev];
      const item = newCart[index];
      if (item.quantity + delta > 0) {
        item.quantity += delta;
      } else {
        newCart.splice(index, 1);
      }
      return newCart;
    });
  };

  const removeFromCart = (index: number) => {
    setCart(prev => {
      const newCart = [...prev];
      newCart.splice(index, 1);
      if (newCart.length === 0 && step === 2) {
        setStep(1); // Go back to step 1 if cart is emptied while on step 2
      }
      return newCart;
    });
  };

  const totalAmount = cart.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cart.length === 0) {
      alert("Please add at least one item to your pre-order.");
      return;
    }
    
    setIsSubmitting(true);
    const res = await submitMerchOrder({ name, email, phone, items: cart });
    if (res.success) {
      setIsSuccess(true);
      setOrderNumber(res.orderNumber || '');
      setCart([]);
    } else {
      alert(res.message || "Failed to submit order");
    }
    setIsSubmitting(false);
  };

  return (
    <>
      <div className="w-full px-4 mt-8 max-w-2xl mx-auto">
        <button 
          onClick={() => setIsOpen(true)}
          className="w-full relative overflow-hidden group bg-gradient-to-r from-poster-accent/20 to-emerald-500/20 border border-poster-accent/40 rounded-2xl p-6 hover:from-poster-accent/30 hover:to-emerald-500/30 transition-all duration-300"
        >
          <div className="absolute inset-0 bg-white/5 opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute -right-10 -top-10 w-32 h-32 bg-poster-accent/20 blur-3xl rounded-full" />
          
          <div className="flex items-center justify-between relative z-10">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-poster-accent/20 rounded-full flex items-center justify-center text-poster-accent shrink-0">
                <ShoppingBag className="w-6 h-6" />
              </div>
              <div className="text-left">
                <h3 className="text-xl font-bold text-white mb-1">Pre-Order REVIVAL Merch</h3>
                <p className="text-sm text-emerald-400 font-medium flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" /> Closing Soon — Reserve Now
                </p>
              </div>
            </div>
            <div className="hidden sm:block text-poster-accent">
              <svg className="w-6 h-6 transform group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </div>
          </div>
        </button>
      </div>

      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-50 flex justify-center items-end sm:items-center p-0 sm:p-4 bg-black/60 backdrop-blur-sm">
            <motion.div 
              initial={{ y: "100%" }}
              animate={{ y: 0 }}
              exit={{ y: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="w-full max-w-2xl max-h-[90vh] bg-[#1e293b] sm:rounded-2xl rounded-t-2xl shadow-2xl overflow-hidden flex flex-col border border-white/10"
            >
              <div className="p-4 border-b border-white/10 flex justify-between items-center bg-black/20 shrink-0">
                <h2 className="text-xl font-bold flex items-center gap-2">
                  <ShoppingBag className="w-5 h-5 text-poster-accent" /> Merchandise Pre-Order
                </h2>
                <button onClick={() => setIsOpen(false)} className="p-2 hover:bg-white/10 rounded-full transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="overflow-y-auto p-4 sm:p-6 flex-1 space-y-8 custom-scrollbar">
                {isSuccess ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center">
                    <div className="w-20 h-20 bg-emerald-500/20 rounded-full flex items-center justify-center mb-6">
                      <CheckCircle2 className="w-10 h-10 text-emerald-400" />
                    </div>
                    <h3 className="text-2xl font-bold mb-2">Pre-Order Confirmed!</h3>
                    <p className="text-slate-400 mb-6 max-w-sm">
                      Your order <strong className="text-white">{orderNumber}</strong> has been received and a QR code has been emailed to you. We will notify you once the stock has arrived for payment and pick-up.
                    </p>
                    <button onClick={() => setIsOpen(false)} className="px-6 py-3 bg-white/10 hover:bg-white/20 rounded-xl transition-colors font-medium">
                      Back to Itinerary
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleSubmit} className="space-y-8">
                    {step === 1 ? (
                      <>
                    {/* Cart Summary */}
                    {cart.length > 0 && (
                      <div className="bg-black/30 border border-white/10 rounded-xl p-4">
                        <h3 className="text-lg font-semibold mb-4 text-emerald-400 border-b border-white/10 pb-2">Your Cart</h3>
                        <div className="space-y-3">
                          {cart.map((c, idx) => (
                            <div key={idx} className="flex items-center justify-between">
                              <div>
                                <p className="font-medium">{c.itemType}</p>
                                {c.size && <p className="text-xs text-slate-400">Size: {c.size}</p>}
                              </div>
                              <div className="flex items-center gap-4">
                                <div className="flex items-center gap-3 bg-white/5 rounded-lg px-2 py-1">
                                  <button type="button" onClick={() => updateQuantity(idx, -1)} className="p-1 hover:bg-white/10 rounded">
                                    <Minus className="w-3 h-3" />
                                  </button>
                                  <span className="text-sm w-4 text-center">{c.quantity}</span>
                                  <button type="button" onClick={() => updateQuantity(idx, 1)} className="p-1 hover:bg-white/10 rounded">
                                    <Plus className="w-3 h-3" />
                                  </button>
                                </div>
                                <p className="font-bold w-16 text-right">RM {c.price * c.quantity}</p>
                                <button type="button" onClick={() => removeFromCart(idx)} className="p-2 hover:bg-red-500/20 text-slate-400 hover:text-red-400 rounded-lg transition-colors ml-1" title="Remove item">
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                        <div className="mt-4 pt-4 border-t border-white/10 flex justify-between items-center mb-6">
                          <p className="text-slate-400">Total Due on Collection</p>
                          <p className="text-2xl font-bold text-poster-accent">RM {totalAmount}</p>
                        </div>
                        <button 
                          type="button" 
                          onClick={() => setStep(2)}
                          className="w-full py-4 bg-poster-accent hover:bg-poster-accent/90 text-black font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(16,185,129,0.2)] hover:shadow-[0_0_30px_rgba(16,185,129,0.4)] transform hover:-translate-y-0.5 flex items-center justify-center gap-2 text-lg"
                        >
                          Proceed Pre-Order
                        </button>
                      </div>
                    )}

                    {/* Items Selection */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-emerald-400 border-b border-white/10 pb-2">1. Choose Items</h3>
                      <div className="space-y-4">
                        {ITEMS.map(item => (
                          <div key={item.id} className="bg-white/5 border border-white/10 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                            <div>
                              <div className="flex items-center gap-2">
                                <h4 className="font-bold text-white text-lg">{item.name}</h4>
                                {item.popular && (
                                  <span className="text-[10px] uppercase tracking-wider bg-poster-accent/20 text-poster-accent px-2 py-0.5 rounded-full font-bold">
                                    🔥 Hot
                                  </span>
                                )}
                              </div>
                              <p className="text-emerald-400 font-bold mb-1">RM {item.price}</p>
                              {item.note && <p className="text-xs text-slate-400 max-w-xs">{item.note}</p>}
                            </div>
                            <div className="flex flex-col sm:flex-row items-center gap-2 sm:w-auto w-full">
                              {item.colors && item.colors.length > 0 && (
                                <select 
                                  className="flex-1 sm:w-32 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-poster-accent appearance-none text-white w-full"
                                  id={`color-${item.id}`}
                                  defaultValue=""
                                >
                                  <option value="" disabled>Select Color</option>
                                  {item.colors.map(c => <option key={c} value={c}>{c}</option>)}
                                </select>
                              )}
                              <select 
                                className="flex-1 sm:w-32 bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-poster-accent appearance-none text-white w-full"
                                id={`size-${item.id}`}
                                defaultValue=""
                              >
                                <option value="" disabled>Select Size</option>
                                {item.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                              </select>
                              <button
                                type="button"
                                onClick={() => {
                                  const selectSize = document.getElementById(`size-${item.id}`) as HTMLSelectElement;
                                  const selectColor = document.getElementById(`color-${item.id}`) as HTMLSelectElement;
                                  
                                  if (!selectSize.value) {
                                    alert("Please select a size first");
                                    return;
                                  }

                                  if (item.colors && !selectColor.value) {
                                    alert("Please select a print color first");
                                    return;
                                  }

                                  addToCart(item.id, selectSize.value, selectColor ? selectColor.value : undefined);
                                  selectSize.value = "";
                                  if (selectColor) selectColor.value = "";
                                }}
                                className="w-full sm:w-auto px-4 py-2 bg-poster-accent text-black font-bold rounded-lg hover:bg-poster-accent/90 transition-colors shrink-0"
                              >
                                Add
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>


                  </>
                ) : (
                  <>
                    {/* Details Form */}
                    <div>
                      <h3 className="text-lg font-semibold mb-4 text-emerald-400 border-b border-white/10 pb-2 flex justify-between items-center">
                        2. Your Details
                        {lookupLoading && <span className="text-xs text-slate-400 animate-pulse font-normal">Verifying registration...</span>}
                      </h3>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-xs font-medium text-slate-400 mb-1">Full Name (As registered)</label>
                          <input 
                            required
                            type="text" 
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            onBlur={handleNameBlur}
                            placeholder="Enter exact registered name to auto-fill"
                            className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-poster-accent transition-colors"
                          />
                        </div>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Email</label>
                            <input 
                              required
                              type="email" 
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-poster-accent transition-colors"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-slate-400 mb-1">Phone Number</label>
                            <input 
                              required
                              type="tel" 
                              value={phone}
                              onChange={(e) => setPhone(e.target.value)}
                              className="w-full bg-black/50 border border-white/10 rounded-lg px-4 py-3 text-white focus:outline-none focus:border-poster-accent transition-colors"
                            />
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <button 
                        type="button" 
                        onClick={() => setStep(1)}
                        className="w-1/3 py-4 bg-white/10 hover:bg-white/20 text-white font-bold rounded-xl transition-all"
                      >
                        Back
                      </button>
                      <button 
                        type="submit" 
                        disabled={isSubmitting || cart.length === 0}
                        className="w-2/3 py-4 bg-poster-accent hover:bg-poster-accent/90 text-black font-bold rounded-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {isSubmitting ? (
                          <div className="w-5 h-5 border-2 border-black/30 border-t-black rounded-full animate-spin" />
                        ) : (
                          <>Complete Pre-Order</>
                        )}
                      </button>
                    </div>

                  </>
                    )}
                  </form>
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
