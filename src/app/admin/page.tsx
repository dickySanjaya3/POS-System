'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { Plus, Package, RefreshCw, Trash2, Edit3, Loader2, Search } from 'lucide-react';

interface Product {
  id: string;
  sku: string;
  name: string;
  price: number;
  stock: number;
}

export default function AdminDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  
  // State Baru untuk Fitur Search
  const [searchQuery, setSearchQuery] = useState('');
  
  // State untuk Form Input (Tambah/Edit)
  const [sku, setSku] = useState('');
  const [name, setName] = useState('');
  const [price, setPrice] = useState('');
  const [stock, setStock] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error) {
      console.error(error);
      alert('Gagal mengambil data produk.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!sku || !name || !price || !stock) return alert('Semua kolom harus diisi!');

    setFormLoading(true);
    try {
      if (editingId) {
        const { error } = await supabase
          .from('products')
          .update({ sku, name, price: Number(price), stock: Number(stock) })
          .eq('id', editingId);

        if (error) throw error;
        alert('Produk berhasil diperbarui!');
      } else {
        const { error } = await supabase
          .from('products')
          .insert([{ sku, name, price: Number(price), stock: Number(stock) }]);

        if (error) throw error;
        alert('Produk baru berhasil ditambahkan!');
      }

      setSku('');
      setName('');
      setPrice('');
      setStock('');
      setEditingId(null);
      fetchProducts();
    } catch (error: any) {
      console.error(error);
      alert(error.message || 'Terjadi kesalahan saat menyimpan produk.');
    } finally {
      setFormLoading(false);
    }
  };

  const handleEditClick = (product: Product) => {
    setEditingId(product.id);
    setSku(product.sku);
    setName(product.name);
    setPrice(product.price.toString());
    setStock(product.stock.toString());
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Apakah Anda yakin ingin menghapus produk ini?')) return;

    try {
      const { error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      alert('Produk berhasil dihapus!');
      fetchProducts();
    } catch (error) {
      console.error(error);
      alert('Gagal menghapus produk.');
    }
  };

  // LOGIKA FILTER PENCARIAN (Berdasarkan Nama atau SKU)
  const filteredProducts = products.filter((product) => {
    const query = searchQuery.toLowerCase();
    return (
      product.name.toLowerCase().includes(query) || 
      product.sku.toLowerCase().includes(query)
    );
  });

  return (
    <div className="min-h-screen bg-gray-50 p-6 font-sans text-gray-800">
      <div className="max-w-7xl mx-auto flex flex-col gap-6">
        
        {/* HEADER */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
              <Package size={24} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Manajemen Stok & Produk</h1>
              <p className="text-sm text-gray-400">Kelola master barang minimarket Anda</p>
            </div>
          </div>
          <button 
            onClick={fetchProducts}
            className="flex items-center gap-2 text-sm bg-gray-100 hover:bg-gray-200 px-4 py-2.5 rounded-xl font-medium transition-colors"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
            Refresh Data
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
          
          {/* FORM INPUT BARANG (KIRI) */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col gap-4 sticky top-6">
            <h2 className="text-lg font-bold text-gray-900 border-b pb-2">
              {editingId ? 'Edit Produk' : 'Tambah Produk Baru'}
            </h2>
            
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Barcode / SKU</label>
                <input 
                  type="text" 
                  placeholder="Scan barcode / ketik SKU..." 
                  value={sku} 
                  onChange={(e) => setSku(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-bold text-gray-500 uppercase">Nama Produk</label>
                <input 
                  type="text" 
                  placeholder="Nama barang..." 
                  value={name} 
                  onChange={(e) => setName(e.target.value)}
                  className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-medium transition-all"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Harga Jual</label>
                  <input 
                    type="number" 
                    placeholder="Rp" 
                    value={price} 
                    onChange={(e) => setPrice(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold font-mono transition-all"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-bold text-gray-500 uppercase">Stok Awal</label>
                  <input 
                    type="number" 
                    placeholder="Pcs" 
                    value={stock} 
                    onChange={(e) => setStock(e.target.value)}
                    className="px-4 py-2.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 font-bold font-mono transition-all"
                  />
                </div>
              </div>

              <div className="flex gap-2 mt-2">
                <button
                  type="submit"
                  disabled={formLoading}
                  className="flex-1 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {formLoading ? <Loader2 className="animate-spin" size={18} /> : editingId ? 'Simpan Perubahan' : 'Simpan Produk'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={() => {
                      setEditingId(null);
                      setSku(''); setName(''); setPrice(''); setStock('');
                    }}
                    className="bg-gray-100 hover:bg-gray-200 text-gray-600 font-medium px-4 rounded-xl transition-colors"
                  >
                    Batal
                  </button>
                )}
              </div>
            </form>
          </div>

          {/* TABEL DATA PRODUK + BAR BARU SEARCH (KANAN) */}
          <div className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden flex flex-col">
            
            {/* SUB-HEADER & INPUT SEARCH BAR */}
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <h2 className="text-lg font-bold text-gray-900 whitespace-nowrap">Daftar Barang Tersedia</h2>
              
              {/* INPUT SEARCH BARU */}
              <div className="relative w-full sm:max-w-xs">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none text-gray-400">
                  <Search size={18} />
                </div>
                <input
                  type="text"
                  placeholder="Cari nama atau kode SKU..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 text-sm font-medium transition-all"
                />
              </div>
            </div>

            {loading ? (
              <div className="p-12 flex justify-center items-center text-gray-400 font-medium gap-2">
                <Loader2 className="animate-spin text-emerald-600" size={24} />
                Memuat data barang...
              </div>
            ) : filteredProducts.length === 0 ? (
              <div className="p-12 text-center text-gray-400 font-medium">
                {searchQuery ? 'Produk yang Anda cari tidak ditemukan.' : 'Belum ada produk terdaftar.'}
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-gray-50 border-b border-gray-100 text-xs font-bold text-gray-400 uppercase tracking-wider">
                      <th className="p-4 pl-6">Produk / SKU</th>
                      <th className="p-4">Harga Jual</th>
                      <th className="p-4 text-center">Stok</th>
                      <th className="p-4 pr-6 text-right">Aksi</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50 text-sm">
                    {filteredProducts.map((product) => (
                      <tr key={product.id} className="hover:bg-gray-50/50 transition-colors">
                        <td className="p-4 pl-6">
                          <div className="flex flex-col">
                            <span className="font-semibold text-gray-900">{product.name}</span>
                            <span className="text-xs text-gray-400 font-mono tracking-wider mt-0.5">SKU: {product.sku}</span>
                          </div>
                        </td>
                        <td className="p-4 font-bold text-emerald-600 font-mono">
                          Rp {Number(product.price).toLocaleString('id-ID')}
                        </td>
                        <td className="p-4 text-center">
                          <span className={`px-2.5 py-1 rounded-full font-bold font-mono text-xs ${product.stock <= 5 ? 'bg-red-50 text-red-600 border border-red-100' : 'bg-gray-100 text-gray-700'}`}>
                            {product.stock}
                          </span>
                        </td>
                        <td className="p-4 pr-6 text-right">
                          <div className="flex justify-end gap-2">
                            <button
                              onClick={() => handleEditClick(product)}
                              className="text-gray-400 hover:text-emerald-600 p-2 hover:bg-emerald-50 rounded-lg transition-colors"
                              title="Edit Produk"
                            >
                              <Edit3 size={16} />
                            </button>
                            <button
                              onClick={() => handleDelete(product.id)}
                              className="text-gray-400 hover:text-red-500 p-2 hover:bg-red-50 rounded-lg transition-colors"
                              title="Hapus Produk"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}