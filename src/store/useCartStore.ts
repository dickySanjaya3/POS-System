import { create } from 'zustand';

// 1. Definisikan tipe data untuk barang di keranjang
export interface CartItem {
  id: string;
  sku: string;
  name: string;
  price: number;
  quantity: number;
  subtotal: number;
}

// 2. Definisikan tipe data untuk State & Action di Zustand
interface CartState {
  cart: CartItem[];
  totalPrice: number;
  tax: number;
  grandTotal: number;
  addToCart: (product: { id: string; sku: string; name: string; price: number }) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
}

// 3. Buat Store Zustand
export const useCartStore = create<CartState>((set) => ({
  cart: [],
  totalPrice: 0,
  tax: 0,
  grandTotal: 0,

  // ACTION: Tambah barang ke keranjang (Bisa dipicu lewat scan barcode)
  addToCart: (product) => set((state) => {
    const existingItem = state.cart.find((item) => item.product_id === product.id || item.sku === product.sku);
    let updatedCart;

    if (existingItem) {
      // Jika barang sudah ada, naikkan kuantitas + 1
      updatedCart = state.cart.map((item) =>
        item.id === existingItem.id
          ? { ...item, quantity: item.quantity + 1, subtotal: (item.quantity + 1) * item.price }
          : item
      );
    } else {
      // Jika barang belum ada, masukkan sebagai baris baru
      const newItem: CartItem = {
        id: product.id,
        sku: product.sku,
        name: product.name,
        price: product.price,
        quantity: 1,
        subtotal: product.price,
      };
      updatedCart = [...state.cart, newItem];
    }

    // Kalkulasi total belanjaan
    const totalPrice = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = totalPrice * 0.11; // Contoh PPN 11%
    const grandTotal = totalPrice + tax;

    return { cart: updatedCart, totalPrice, tax, grandTotal };
  }),

  // ACTION: Hapus barang dari keranjang
  removeFromCart: (productId) => set((state) => {
    const updatedCart = state.cart.filter((item) => item.id !== productId);
    const totalPrice = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = totalPrice * 0.11;
    const grandTotal = totalPrice + tax;
    return { cart: updatedCart, totalPrice, tax, grandTotal };
  }),

  // ACTION: Ubah kuantitas manual (jika kasir mengetik jumlah baru)
  updateQuantity: (productId, quantity) => set((state) => {
    if (quantity <= 0) return state; // Mencegah angka minus
    const updatedCart = state.cart.map((item) =>
      item.id === productId
        ? { ...item, quantity, subtotal: quantity * item.price }
        : item
    );
    const totalPrice = updatedCart.reduce((sum, item) => sum + item.subtotal, 0);
    const tax = totalPrice * 0.11;
    const grandTotal = totalPrice + tax;
    return { cart: updatedCart, totalPrice, tax, grandTotal };
  }),

  // ACTION: Reset keranjang (setelah transaksi sukses/dibayar)
  clearCart: () => set({ cart: [], totalPrice: 0, tax: 0, grandTotal: 0 }),
}));