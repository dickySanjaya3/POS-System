'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useCartStore } from '@/store/useCartStore';
import { supabase } from '@/lib/supabase';
import { Trash2, Plus, Minus, ScanBarcode, Wallet, X, Store, ShoppingCart, Percent } from 'lucide-react';

export default function CashierPage() {
  const [barcodeInput, setBarcodeInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  // State untuk Modal Pembayaran
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [cashPaid, setCashPaid] = useState('');
  const [change, setChange] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const { cart, totalPrice, tax, grandTotal, addToCart, updateQuantity, removeFromCart, clearCart } = useCartStore();
  const inputRef = useRef<HTMLInputElement>(null);
  const cashInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Hitung kembalian otomatis
  useEffect(() => {
    const paid = Number(cashPaid) || 0;
    if (paid >= grandTotal) {
      setChange(paid - grandTotal);
    } else {
      setChange(0);
    }
  }, [cashPaid, grandTotal]);

  // Autofocus input uang saat modal muncul
  useEffect(() => {
    if (isModalOpen) {
      setTimeout(() => cashInputRef.current?.focus(), 120);
    }
  }, [isModalOpen]);

  const handleScanSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!barcodeInput.trim()) return;

    setLoading(true);
    setErrorMsg('');

    try {
      const { data: product, error } = await supabase
        .from('products')
        .select('*')
        .eq('sku', barcodeInput.trim())
        .single();

      if (error || !product) {
        setErrorMsg('Produk tidak terdaftar di sistem master.');
      } else {
        addToCart({
          id: product.id,
          sku: product.sku,
          name: product.name,
          price: Number(product.price),
        });
        setBarcodeInput('');
      }
    } catch (err) {
      setErrorMsg('Koneksi database terputus.');
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  const handleCheckoutSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const paidAmount = Number(cashPaid) || 0;

    if (paidAmount < grandTotal) {
      alert('Nominal uang tunai kurang!');
      return;
    }

    setIsSubmitting(true);

    try {
      const invoiceNum = `INV-${Date.now()}`;

      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .insert([{
          invoice_number: invoiceNum,
          total_price: totalPrice,
          tax: tax,
          grand_total: grandTotal,
          amount_paid: paidAmount,
          change_amount: change
        }])
        .select()
        .single();

      if (txError) throw txError;

      for (const item of cart) {
        await supabase.from('transaction_items').insert([{
          transaction_id: transaction.id,
          product_id: item.id,
          quantity: item.quantity,
          price: item.price,
          subtotal: item.subtotal
        }]);

        const { data: pData } = await supabase.from('products').select('stock').eq('id', item.id).single();
        if (pData) {
          const newStock = pData.stock - item.quantity;
          await supabase.from('products').update({ stock: newStock }).eq('id', item.id);
        }
      }

      alert('Transaksi Sukses! Nota disimpan & stok otomatis terpotong.');
      clearCart();
      setIsModalOpen(false);
      setCashPaid('');
      inputRef.current?.focus();

    } catch (error) {
      console.error(error);
      alert('Gagal memproses struk.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans antialiased w-full flex flex-col">
      
      {/* BRAND HEADER BAR */}
      <header className="bg-white border-b border-[#c7c4d8]/50 px-6 py-4 flex justify-between items-center w-full shadow-sm">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-[#3525cd] text-white rounded-xl shadow-md shadow-indigo-600/10">
            <Store size={22} />
          </div>
          <div>
            <h1 className="text-xl font-black tracking-tight text-[#0b1c30]">Gardu Kasir Minimarket</h1>
            <p className="text-xs text-[#464555] font-semibold uppercase tracking-wider opacity-70">POS Terminal Active</p>
          </div>
        </div>
        <div className="flex items-center gap-2 bg-[#eff4ff] border border-[#dce9ff] px-4 py-1.5 rounded-full text-xs font-bold text-[#3525cd]">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
          Terminal #01
        </div>
      </header>

      {/* CORE WORKSPACE: 2 COLUMNS FLUID */}
      <div className="flex-1 flex flex-col lg:flex-row w-full p-6 gap-6 min-h-0">
        
        {/* SISI KIRI: BARCODE SCANNER & LIVE CART LIST */}
        <div className="flex-1 bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm p-6 flex flex-col gap-6 min-w-0">
          
          {/* BARCODE INPUT FORM */}
          <form onSubmit={handleScanSubmit} className="relative">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-[#464555]">
              <ScanBarcode size={22} />
            </div>
            <input
              ref={inputRef}
              type="text"
              placeholder="Arahkan barcode scanner atau ketik SKU produk lalu Enter..."
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              disabled={loading}
              className="w-full pl-12 pr-4 py-3.5 bg-[#f8f9ff] border border-[#c7c4d8] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#4f46e5]/10 focus:border-[#4f46e5] font-bold tracking-wide transition-all placeholder:font-normal placeholder:text-gray-400"
            />
            {errorMsg && (
              <div className="bg-red-50 text-[#ba1a1a] text-xs font-bold px-3 py-2 rounded-lg mt-2 border border-red-100 animate-fade-in">
                ⚠️ {errorMsg}
              </div>
            )}
          </form>

          {/* KERANJANG BELANJA */}
          <div className="flex-1 overflow-y-auto max-h-[58vh] pr-1 flex flex-col gap-3">
            {cart.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center py-20 text-gray-400 gap-3">
                <div className="p-4 bg-gray-50 text-gray-300 rounded-full border border-dashed border-gray-200">
                  <ShoppingCart size={32} />
                </div>
                <span className="font-semibold text-sm">Belum ada barang di keranjang. Silakan lakukan scanning.</span>
              </div>
            ) : (
              cart.map((item) => (
                <div key={item.id} className="flex items-center justify-between p-4 bg-white hover:bg-[#f8f9ff] rounded-xl border border-[#c7c4d8]/40 shadow-sm transition-colors duration-200 group">
                  <div className="flex flex-col">
                    <span className="font-bold text-[#0b1c30] text-base group-hover:text-[#3525cd] transition-colors">{item.name}</span>
                    <span className="text-[11px] text-[#464555] font-mono tracking-wider mt-0.5">SKU: {item.sku}</span>
                    <span className="text-xs text-emerald-700 font-bold font-mono mt-1 bg-emerald-50 px-2 py-0.5 rounded w-fit">
                      Rp {item.price.toLocaleString('id-ID')}
                    </span>
                  </div>

                  <div className="flex items-center gap-6">
                    {/* QUANTITY CONTROL */}
                    <div className="flex items-center border border-[#c7c4d8] bg-white rounded-xl p-1 shadow-inner">
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                        type="button"
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-[#464555] active:scale-90 transition-transform"
                      >
                        <Minus size={14} />
                      </button>
                      <span className="w-10 text-center font-black text-[#0b1c30] font-mono text-sm">{item.quantity}</span>
                      <button 
                        onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                        type="button"
                        className="p-1.5 hover:bg-gray-100 rounded-lg text-[#464555] active:scale-90 transition-transform"
                      >
                        <Plus size={14} />
                      </button>
                    </div>
                    {/* TOTAL PER BARANG */}
                    <span className="w-28 text-right font-black text-[#0b1c30] font-mono text-base">
                      Rp {item.subtotal.toLocaleString('id-ID')}
                    </span>
                    {/* HAPUS */}
                    <button 
                      onClick={() => removeFromCart(item.id)} 
                      type="button"
                      className="text-[#c7c4d8] hover:text-[#ba1a1a] p-2 hover:bg-red-50 rounded-xl transition-colors"
                      title="Hapus item"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* SISI KANAN: RINGKASAN NOTA & BILLING */}
        <div className="w-full lg:w-[380px] bg-white rounded-2xl border border-[#c7c4d8]/40 shadow-sm p-6 flex flex-col justify-between max-h-[75vh] shrink-0">
          <div>
            <h2 className="text-base font-bold text-[#0b1c30] border-b pb-4 border-gray-100 uppercase tracking-wider opacity-80">Ringkasan Nota</h2>
            
            <div className="flex flex-col gap-4 py-5 border-b border-gray-100 text-sm">
              <div className="flex justify-between font-semibold text-[#464555]">
                <span>Subtotal Kena Pajak</span>
                <span className="font-mono text-[#0b1c30]">Rp {totalPrice.toLocaleString('id-ID')}</span>
              </div>
              <div className="flex justify-between font-semibold text-[#464555] items-center">
                <span className="flex items-center gap-1"><Percent size={14} /> PPN (11%)</span>
                <span className="font-mono text-[#0b1c30]">Rp {tax.toLocaleString('id-ID')}</span>
              </div>
            </div>

            <div className="flex justify-between items-center py-6">
              <span className="text-sm font-bold text-[#0b1c30] uppercase tracking-wider">Total Tagihan</span>
              <span className="text-2xl font-black text-[#3525cd] font-mono tracking-tight">
                Rp {grandTotal.toLocaleString('id-ID')}
              </span>
            </div>
          </div>

          <div className="flex flex-col gap-3 mt-6">
            <button 
              onClick={() => setIsModalOpen(true)}
              disabled={cart.length === 0}
              className="w-full bg-[#3525cd] hover:bg-opacity-95 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-4 rounded-xl transition-all shadow-md shadow-indigo-600/10 active:scale-[0.99] text-sm uppercase tracking-wider flex items-center justify-center gap-2"
            >
              <Wallet size={16} />
              Proses Pembayaran
            </button>
            <button 
              onClick={clearCart} 
              disabled={cart.length === 0} 
              className="w-full text-center text-xs font-bold text-[#464555] opacity-60 hover:opacity-100 hover:text-[#ba1a1a] py-2 transition-all uppercase tracking-widest"
            >
              Kosongkan Keranjang
            </button>
          </div>
        </div>

      </div>

      {/* MODAL INPUT PEMBAYARAN TUNAI (CASHPOPUP) */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4 animate-fade-in">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-gray-100 relative">
            <button 
              onClick={() => setIsModalOpen(false)} 
              className="absolute top-4 right-4 text-gray-400 hover:text-[#0b1c30] p-1 rounded-lg hover:bg-gray-50"
            >
              <X size={20} />
            </button>
            
            <div className="flex items-center gap-3 border-b pb-4 mb-5">
              <div className="p-2.5 bg-emerald-50 text-emerald-700 rounded-xl">
                <Wallet size={20} />
              </div>
              <h3 className="text-lg font-bold text-[#0b1c30]">Penyelesaian Kasir</h3>
            </div>

            <form onSubmit={handleCheckoutSubmit} className="flex flex-col gap-5">
              <div className="bg-[#f8f9ff] p-4 rounded-xl border border-[#c7c4d8]/40">
                <span className="text-[10px] font-bold text-[#464555] uppercase tracking-widest opacity-70">Jumlah Tagihan (Grand Total)</span>
                <div className="text-3xl font-black text-[#3525cd] font-mono mt-1">Rp {grandTotal.toLocaleString('id-ID')}</div>
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-xs font-bold text-[#0b1c30] uppercase tracking-wider opacity-80">Uang Tunai Diterima (Cash)</label>
                <input
                  ref={cashInputRef}
                  type="number"
                  placeholder="Masukkan jumlah uang cash..."
                  value={cashPaid}
                  onChange={(e) => setCashPaid(e.target.value)}
                  required
                  className="w-full px-4 py-3 bg-[#f8f9ff] border border-[#c7c4d8] rounded-xl focus:outline-none focus:ring-4 focus:ring-[#3525cd]/10 focus:border-[#3525cd] font-black font-mono text-xl text-[#0b1c30] transition-all"
                />
              </div>

              <div className="bg-emerald-50 border border-emerald-200 p-4 rounded-xl flex justify-between items-center shadow-sm">
                <span className="text-xs font-bold text-emerald-900 uppercase tracking-wider">Uang Kembalian</span>
                <span className="text-2xl font-black text-emerald-700 font-mono">Rp {change.toLocaleString('id-ID')}</span>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || Number(cashPaid) < grandTotal}
                className="w-full mt-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-100 disabled:text-gray-400 text-white font-bold py-3.5 rounded-xl transition-all shadow-md font-mono text-sm uppercase tracking-wider"
              >
                {isSubmitting ? 'Mencetak Struk Penjualan...' : 'Cetak Nota & Selesai (Enter)'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}