'use client';

import React from 'react';
import Link from 'next/link';
import { ScanBarcode, ShieldAlert, Store, ArrowRight, TrendingUp } from 'lucide-react';

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center items-center p-6 font-sans text-gray-800">
      <div className="max-w-4xl w-full flex flex-col gap-8 text-center items-center">
        
        {/* LOGO & BRANDING */}
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="p-4 bg-emerald-600 text-white rounded-2xl shadow-lg shadow-emerald-600/20">
            <Store size={40} />
          </div>
          <h1 className="text-4xl font-extrabold tracking-tight text-gray-950 sm:text-5xl">
            Sistem POS <span className="text-emerald-600">Minimarket</span>
          </h1>
          <p className="text-base text-gray-400 max-w-md font-medium">
            Selamat datang di Hub Manajemen Retail. Silakan pilih modul navigasi untuk memulai aktivitas Anda.
          </p>
        </div>

        {/* PILIHAN MENU / PORTAL */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl mt-4">
          
          {/* MENU KASIR */}
          <Link 
            href="/cashier"
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between items-start text-left gap-6 transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 duration-300"
          >
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl group-hover:bg-emerald-600 group-hover:text-white transition-colors duration-300">
                <ScanBarcode size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Gardu Kasir</h2>
              <p className="text-sm text-gray-400 font-medium">
                Sesi transaksi penjualan toko, pemindaian barcode barang, kalkulasi nota otomatis, dan pemotongan stok.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 group-hover:text-emerald-700">
              Buka Layar Kasir 
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* MENU ADMIN */}
          <Link 
            href="/admin"
            className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between items-start text-left gap-6 transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 duration-300"
          >
            <div className="flex flex-col gap-3">
              <div className="p-3 bg-amber-50 text-amber-600 rounded-xl group-hover:bg-amber-600 group-hover:text-white transition-colors duration-300">
                <ShieldAlert size={28} />
              </div>
              <h2 className="text-xl font-bold text-gray-900">Dashboard Admin</h2>
              <p className="text-sm text-gray-400 font-medium">
                Manajemen logistik master barang, pemantauan batas stok kritis minimarket, kontrol harga, dan manajemen CRUD data.
              </p>
            </div>
            <div className="flex items-center gap-2 text-sm font-bold text-amber-600 group-hover:text-amber-700">
              Masuk Dashboard 
              <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          <Link 
    href="/supervisor"
    className="group bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col justify-between items-start text-left gap-6 transition-all hover:shadow-xl hover:shadow-gray-200/50 hover:-translate-y-1 duration-300 sm:col-span-2 lg:col-span-1"
  >
    <div className="flex flex-col gap-3">
      <div className="p-3 bg-indigo-50 text-indigo-600 rounded-xl group-hover:bg-indigo-600 group-hover:text-white transition-colors duration-300">
        <TrendingUp size={28} />
      </div>
      <h2 className="text-xl font-bold text-gray-900">Panel Supervisor</h2>
      <p className="text-sm text-gray-400 font-medium">
        Analisis visual omset penjualan harian, statistik produk terlaris, dan pengawasan performa keuangan retail.
      </p>
    </div>
    <div className="flex items-center gap-2 text-sm font-bold text-indigo-600 group-hover:text-indigo-700">
      Buka Dashboard Keuangan
      <ArrowRight size={16} className="transform group-hover:translate-x-1 transition-transform" />
    </div>
  </Link>

</div>

        </div>

        {/* FOOTER */}
        <div className="text-xs text-gray-400 font-medium mt-8 border-t border-gray-200/60 pt-4 w-full max-w-xs font-mono">
          Informatics Project © 2026
        </div>

      </div>
  );
}