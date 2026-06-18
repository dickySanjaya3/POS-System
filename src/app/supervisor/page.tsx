'use client';

import React, { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { 
  LayoutDashboard, RotateCw, AlertTriangle, 
  CheckCircle2, History, Loader2, BarChart3, TrendingUp 
} from 'lucide-react';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area 
} from 'recharts';

interface DailyReport {
  date: string;
  omset: number;
  transactionCount: number;
  lifetimeRevenue: number;
  averageBasketSize: number;
  totalTax: number;
}

interface TopProduct {
  name: string;
  sku: string;
  totalQty: number;
  totalRevenue: number;
}

interface RecentTransaction {
  id: string;
  invoice_number: string;
  grand_total: number;
  created_at: string;
}

interface LowStockProduct {
  id: string;
  sku: string;
  name: string;
  stock: number;
}

export default function SupervisorDashboard() {
  const [loading, setLoading] = useState(true);
  const [report, setReport] = useState<DailyReport>({
    date: '', omset: 0, transactionCount: 0, lifetimeRevenue: 0, averageBasketSize: 0, totalTax: 0
  });
  const [weeklyData, setWeeklyData] = useState<any[]>([]);
  const [monthlyData, setMonthlyData] = useState<any[]>([]);
  const [topProducts, setTopProducts] = useState<TopProduct[]>([]);
  const [recentTx, setRecentTx] = useState<RecentTransaction[]>([]);
  const [lowStockItems, setLowStockItems] = useState<LowStockProduct[]>([]);

  const fetchSupervisorData = async () => {
    setLoading(true);
    try {
      const today = new Date().toISOString().split('T')[0];

      // 1. QUERY ALL TRANSACTIONS
      const { data: transactions, error: txError } = await supabase
        .from('transactions')
        .select('id, invoice_number, grand_total, tax, created_at')
        .order('created_at', { ascending: true });

      if (txError) throw txError;

      const allTx = transactions || [];

      // == LOGIKA AGREGASI DATA CHART MINGGUAN ==
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0];
      }).reverse();

      const weeklyChart = last7Days.map(date => {
        const dayTotal = allTx
          .filter(tx => tx.created_at.startsWith(date))
          .reduce((sum, tx) => sum + Number(tx.grand_total), 0);
        return { 
          name: new Date(date).toLocaleDateString('id-ID', { weekday: 'short' }), 
          omset: dayTotal 
        };
      });
      setWeeklyData(weeklyChart);

      // == LOGIKA AGREGASI DATA CHART BULANAN ==
      const monthlyChart = [...Array(12)].map((_, i) => {
        const monthNames = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];
        const monthTotal = allTx
          .filter(tx => {
            const txDate = new Date(tx.created_at);
            return txDate.getMonth() === i && txDate.getFullYear() === new Date().getFullYear();
          })
          .reduce((sum, tx) => sum + Number(tx.grand_total), 0);
        return { name: monthNames[i], omset: monthTotal };
      });
      setMonthlyData(monthlyChart);

      // == KALKULASI 5 KARTU METRIK FINANSIAL ==
      const todayTx = allTx.filter(tx => tx.created_at.startsWith(today));
      const totalLifetime = allTx.reduce((sum, tx) => sum + Number(tx.grand_total), 0);
      const totalTaxCollected = allTx.reduce((sum, tx) => sum + Number(tx.tax), 0);
      const avgBasket = allTx.length > 0 ? totalLifetime / allTx.length : 0;

      setReport({
        date: new Date().toLocaleDateString('id-ID', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }),
        omset: todayTx.reduce((sum, tx) => sum + Number(tx.grand_total), 0),
        transactionCount: todayTx.length,
        lifetimeRevenue: totalLifetime,
        averageBasketSize: avgBasket,
        totalTax: totalTaxCollected
      });

      // AMBIL 5 TRANSAKSI TERAKHIR UNTUK LIVE FEED LOG
      setRecentTx([...allTx].reverse().slice(0, 5));

      // 2. QUERY ITEM TRANSAKSI (PRODUK TERLARIS)
      const { data: txItems, error: itemsError } = await supabase
        .from('transaction_items')
        .select('quantity, subtotal, products(name, sku)');

      if (itemsError) throw itemsError;

      const productMap: { [key: string]: TopProduct } = {};
      txItems?.forEach((item: any) => {
        if (!item.products) return;
        const sku = item.products.sku;
        if (productMap[sku]) {
          productMap[sku].totalQty += Number(item.quantity);
          productMap[sku].totalRevenue += Number(item.subtotal);
        } else {
          productMap[sku] = {
            name: item.products.name,
            sku: sku,
            totalQty: Number(item.quantity),
            totalRevenue: Number(item.subtotal)
          };
        }
      });

      setTopProducts(Object.values(productMap).sort((a, b) => b.totalQty - a.totalQty).slice(0, 5));

      // 3. QUERY PRODUK KRITIS (STOK <= 5)
      const { data: lowStock, error: stockError } = await supabase
        .from('products')
        .select('id, sku, name, stock')
        .lte('stock', 5)
        .order('stock', { ascending: true });

      if (stockError) throw stockError;
      setLowStockItems(lowStock || []);

    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSupervisorData();
  }, []);

  const targetOmsetBulanan = 5000000;
  const progressPercentage = Math.min(Math.round((report.lifetimeRevenue / targetOmsetBulanan) * 100), 100);

  return (
    <div className="flex min-h-screen bg-[#f8f9ff] text-[#0b1c30] font-sans antialiased w-full">
      <main className="flex-1 min-w-0 px-6 py-6 w-full">
        <div className="w-full max-w-7xl mx-auto">
          
          {/* TOP APP BAR */}
          <header className="flex justify-between items-center py-4 px-6 bg-white rounded-2xl shadow-sm border border-gray-100 mb-6 w-full">
            <div className="flex flex-col">
              <h2 className="text-2xl font-bold text-[#0b1c30]">Executive Panel Supervisor</h2>
              <p className="text-sm text-[#464555] opacity-80">Pusat kendali analisis data finansial & logistik toko</p>
            </div>
            <button 
              onClick={fetchSupervisorData}
              disabled={loading}
              className="flex items-center gap-2 bg-[#3525cd] hover:bg-opacity-95 text-white px-5 py-2.5 rounded-full font-bold active:scale-95 transition-all shadow-md text-xs uppercase tracking-wider disabled:bg-gray-300 shrink-0"
            >
              <RotateCw size={16} className={loading ? 'animate-spin' : ''} />
              Sinkronisasi Data
            </button>
          </header>

          {loading ? (
            <div className="p-24 flex flex-col justify-center items-center text-gray-400 font-medium gap-3 bg-white rounded-2xl border border-gray-100 shadow-sm">
              <Loader2 className="animate-spin text-[#3525cd]" size={32} />
              <span className="text-sm font-bold tracking-wide uppercase">Menyinkronkan data toko...</span>
            </div>
          ) : (
            <>
              {/* 5 KEY STATS GRID */}
              <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-6 mb-6">
                <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-1 border-l-4 border-[#3525cd]">
                  <span className="text-[11px] font-bold text-[#464555] uppercase tracking-wider opacity-70">Omset Hari Ini</span>
                  <span className="text-[#3525cd] font-bold text-xl font-mono mt-1">Rp {report.omset.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-[#464555] mt-1 truncate">{report.date}</span>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-1 border-l-4 border-gray-400">
                  <span className="text-[11px] font-bold text-[#464555] uppercase tracking-wider opacity-70">Struk Hari Ini</span>
                  <span className="text-[#0b1c30] font-bold text-xl font-mono mt-1">{report.transactionCount} Nota</span>
                  <span className="text-xs text-[#464555] mt-1">Transaksi kasir aktif</span>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-1 border-l-4 border-[#006c49]">
                  <span className="text-[11px] font-bold text-[#464555] uppercase tracking-wider opacity-70">Lifetime Revenue</span>
                  <span className="text-[#006c49] font-bold text-xl font-mono mt-1">Rp {report.lifetimeRevenue.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-[#464555] mt-1">Akumulasi pendapatan</span>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-1 border-l-4 border-[#a44100]">
                  <span className="text-[11px] font-bold text-[#464555] uppercase tracking-wider opacity-70">Avg Basket Size</span>
                  <span className="text-[#a44100] font-bold text-xl font-mono mt-1">Rp {Math.round(report.averageBasketSize).toLocaleString('id-ID')}</span>
                  <span className="text-xs text-[#464555] mt-1">Rata-rata belanja per nota</span>
                </div>
                <div className="bg-white p-5 rounded-2xl shadow-sm flex flex-col gap-1 border-l-4 border-[#ba1a1a]">
                  <span className="text-[11px] font-bold text-[#464555] uppercase tracking-wider opacity-70">Pajak Terkumpul</span>
                  <span className="text-[#ba1a1a] font-bold text-xl font-mono mt-1">Rp {report.totalTax.toLocaleString('id-ID')}</span>
                  <span className="text-xs text-[#464555] mt-1">Total PPN 11%</span>
                </div>
              </section>

              {/* NEW FEATURES: VISUAL CHARTS INTERAKTIF GRID */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {/* RECHARTS: BAR CHART RIWAYAT 7 HARI */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-6">
                    <BarChart3 size={18} className="text-[#3525cd]" />
                    <h3 className="font-bold text-[#0b1c30] text-sm uppercase tracking-wider opacity-80">Riwayat Omset 7 Hari Terakhir</h3>
                  </div>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={weeklyData}>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#464555'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#464555'}} />
                        <Tooltip cursor={{fill: '#eff4ff'}} contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                        <Bar dataKey="omset" fill="#4f46e5" radius={[6, 6, 0, 0]} barSize={36} name="Pendapatan" />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* RECHARTS: AREA CHART TREN BULANAN */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                  <div className="flex items-center gap-2 mb-6">
                    <TrendingUp size={18} className="text-[#006c49]" />
                    <h3 className="font-bold text-[#0b1c30] text-sm uppercase tracking-wider opacity-80">Tren Omset Bulanan (Tahun Ini)</h3>
                  </div>
                  <div className="h-[260px] w-full">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={monthlyData}>
                        <defs>
                          <linearGradient id="colorOmset" x1="0" y1="0" x2="0" y2="100%">
                            <stop offset="5%" stopColor="#006c49" stopOpacity={0.2}/>
                            <stop offset="95%" stopColor="#006c49" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                        <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fontSize: 11, fill: '#464555'}} />
                        <YAxis axisLine={false} tickLine={false} tick={{fontSize: 10, fill: '#464555'}} />
                        <Tooltip contentStyle={{borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}} />
                        <Area type="monotone" dataKey="omset" stroke="#006c49" fillOpacity={1} fill="url(#colorOmset)" strokeWidth={3} name="Total Omset" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>

              {/* CORE BUSINESS DATA GRID: 12 COLS */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
                
                {/* LEFT BLOCK (4/12 COLS) */}
                <div className="lg:col-span-4 flex flex-col gap-6">
                  
                  {/* CRITICAL STOCK WARNING CARD */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
                    <div className="flex items-center gap-2 mb-4 text-[#ba1a1a]">
                      <AlertTriangle size={20} />
                      <h3 className="text-base font-bold text-[#0b1c30]">Peringatan Stok Kritis</h3>
                    </div>
                    {lowStockItems.length === 0 ? (
                      <div className="bg-[#6cf8bb] bg-opacity-10 border border-[#006c49]/30 p-4 rounded-xl flex items-center gap-2 text-[#005236]">
                        <CheckCircle2 size={18} />
                        <span className="text-xs font-semibold">Semua stok gudang aman.</span>
                      </div>
                    ) : (
                      <div className="flex flex-col gap-2 max-h-[200px] overflow-y-auto pr-1">
                        {lowStockItems.map(item => (
                          <div key={item.id} className="flex justify-between items-center p-3 bg-red-50 rounded-xl border border-red-100 text-xs">
                            <div className="flex flex-col">
                              <span className="font-bold text-gray-900">{item.name}</span>
                              <span className="text-gray-400 font-mono">SKU: {item.sku}</span>
                            </div>
                            <span className="font-bold bg-[#ba1a1a] text-white px-2 py-1 rounded-md font-mono">{item.stock} Pcs</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* 5 RECENT TRANSACTIONS LOG FEED */}
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex-grow">
                    <div className="flex items-center gap-2 mb-4 text-[#3525cd]">
                      <History size={20} />
                      <h3 className="text-base font-bold text-[#0b1c30]">5 Transaksi Terakhir</h3>
                    </div>
                    <div className="flex flex-col gap-3">
                      {recentTx.length === 0 ? (
                        <p className="text-xs text-gray-400 text-center py-4">Belum ada aktivitas penjualan.</p>
                      ) : (
                        recentTx.map(tx => (
                          <div key={tx.id} className="flex justify-between items-center p-3 bg-[#f8f9ff] rounded-xl border border-gray-100 text-xs hover:bg-[#e5eeff] transition-colors">
                            <div className="flex flex-col">
                              <span className="font-bold text-[#0b1c30] font-mono tracking-wide">{tx.invoice_number}</span>
                              <span className="text-[#464555] text-[10px] mt-0.5">
                                {new Date(tx.created_at).toLocaleTimeString('id-ID')}
                              </span>
                            </div>
                            <span className="font-bold text-[#0b1c30] font-mono">Rp {Number(tx.grand_total).toLocaleString('id-ID')}</span>
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                </div>

                {/* RIGHT BLOCK: 5 TOP SELLING TABLE (8/12 COLS) */}
                <div className="lg:col-span-8">
                  <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 h-full flex flex-col justify-between">
                    <div>
                      <div className="flex flex-col mb-4">
                        <h3 className="text-base font-bold text-[#0b1c30]">5 Produk Paling Terlaris (Top Selling)</h3>
                        <p className="text-xs text-[#464555] opacity-70">Dihitung otomatis berdasarkan volume total penjualan item</p>
                      </div>
                      
                      <div className="overflow-x-auto">
                        <table className="w-full text-left border-collapse">
                          <thead>
                            <tr className="border-b border-[#c7c4d8] bg-[#eff4ff]">
                              <th className="px-4 py-2.5 text-[11px] font-bold text-[#464555] uppercase tracking-wider">Detail Produk</th>
                              <th className="px-4 py-2.5 text-[11px] font-bold text-[#464555] uppercase tracking-wider text-right">Volume</th>
                              <th className="px-4 py-2.5 text-[11px] font-bold text-[#464555] uppercase tracking-wider text-right">Kontribusi Omset</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-gray-100 text-xs">
                            {topProducts.length === 0 ? (
                              <tr>
                                <td className="px-4 py-12 text-center text-[#464555] italic" colSpan={3}>
                                  Data produk terlaris lainnya akan muncul di sini seiring transaksi berjalan.
                                </td>
                              </tr>
                            ) : (
                              topProducts.map((product, idx) => (
                                <tr key={product.sku} className="group hover:bg-[#eff4ff] transition-colors">
                                  <td className="px-4 py-3 flex items-center gap-4">
                                    <span className="font-bold text-[#c7c4d8] font-mono text-sm">#{idx + 1}</span>
                                    <div className="flex flex-col">
                                      <span className="font-bold text-[#0b1c30] text-sm">{product.name}</span>
                                      <span className="text-[10px] text-[#464555] font-mono mt-0.5">SKU: {product.sku}</span>
                                    </div>
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-[#0b1c30] font-mono">
                                    {product.totalQty} Pcs
                                  </td>
                                  <td className="px-4 py-3 text-right font-bold text-[#006c49] font-mono">
                                    Rp {product.totalRevenue.toLocaleString('id-ID')}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* TARGET PROGRESS INSIGHT BAR */}
                    <div className="mt-8 pt-4 border-t border-[#c7c4d8]">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[11px] font-bold uppercase tracking-wider text-[#464555]">Target Omset Bulanan</span>
                        <span className="font-mono text-[#3525cd] font-bold text-xs">{progressPercentage}% Tercapai</span>
                      </div>
                      <div className="w-full bg-[#dce9ff] rounded-full h-2">
                        <div 
                          className="bg-[#3525cd] h-2 rounded-full transition-all duration-500" 
                          style={{ width: `${progressPercentage}%` }}
                        ></div>
                      </div>
                    </div>

                  </div>
                </div>

              </div> {/* Penutup Core Business Data Grid */}
            </>
          )}

        </div> {/* Penutup max-w-7xl */}
      </main>
    </div>
  );
}