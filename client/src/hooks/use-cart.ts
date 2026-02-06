import { useState, useEffect, useCallback } from 'react';
import { Product, Customer, BillItem, PaymentMode } from '@shared/schema';

export interface CartItem extends BillItem {
  tempId: string;
  product: Product;
  originalPrice: number;
  discountAmount: number;
  taxAmount: number;
  taxableAmount: number;
  totalAmount: number;
}

export interface CartState {
  items: CartItem[];
  customer: Customer | null;
  customerName: string;
  customerPhone: string;
  billDiscountAmount: number;
  billDiscountPercent: number;
  loyaltyPointsRedeemed: number;
  notes: string;
  payments: { mode: PaymentMode; amount: number; reference?: string }[];
}

const CART_STORAGE_KEY = 'readybasket_cart_v1';
const CART_EXPIRY_HOURS = 24;

export function useCart() {
  const [cart, setCart] = useState<CartState>({
    items: [],
    customer: null,
    customerName: '',
    customerPhone: '',
    billDiscountAmount: 0,
    billDiscountPercent: 0,
    loyaltyPointsRedeemed: 0,
    notes: '',
    payments: [],
  });

  // Load cart from localStorage on mount
  useEffect(() => {
    const savedCart = localStorage.getItem(CART_STORAGE_KEY);
    if (savedCart) {
      try {
        const parsed = JSON.parse(savedCart);
        const savedTime = new Date(parsed.savedAt);
        const hoursSinceSave = (Date.now() - savedTime.getTime()) / (1000 * 60 * 60);
        
        if (hoursSinceSave < CART_EXPIRY_HOURS) {
          setCart(parsed.cart);
        } else {
          localStorage.removeItem(CART_STORAGE_KEY);
        }
      } catch (e) {
        console.error('Failed to load cart:', e);
      }
    }
  }, []);

  // Save cart to localStorage whenever it changes
  useEffect(() => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify({
      cart,
      savedAt: new Date().toISOString(),
    }));
  }, [cart]);

  const generateTempId = () => `item_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

  const calculateItemTotals = (item: CartItem): CartItem => {
    const quantity = Number(item.quantity);
    const sellingPrice = Number(item.sellingPrice);
    const discountPercent = Number(item.discountPercent || 0);
    const gstRate = Number(item.gstRate || 0);
    
    const originalPrice = sellingPrice * quantity;
    const discountAmount = (originalPrice * discountPercent) / 100;
    const taxableAmount = originalPrice - discountAmount;
    const taxAmount = (taxableAmount * gstRate) / 100;
    const totalAmount = taxableAmount + taxAmount;

    return {
      ...item,
      originalPrice,
      discountAmount,
      taxAmount,
      taxableAmount,
      totalAmount,
    };
  };

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    setCart(prev => {
      const existingItemIndex = prev.items.findIndex(item => item.productId === product.id);
      
      if (existingItemIndex >= 0) {
        // Update existing item
        const newItems = [...prev.items];
        const existingItem = newItems[existingItemIndex];
        const newQuantity = Number(existingItem.quantity) + quantity;
        
        newItems[existingItemIndex] = calculateItemTotals({
          ...existingItem,
          quantity: newQuantity,
        });
        
        return { ...prev, items: newItems };
      } else {
        // Add new item
        const newItem: CartItem = calculateItemTotals({
          tempId: generateTempId(),
          id: 0,
          billId: 0,
          productId: product.id,
          productName: product.name,
          productSku: product.sku,
          hsnCode: product.hsnCode || undefined,
          quantity,
          unit: 'PCS', // Get from product unit
          mrp: Number(product.mrp),
          sellingPrice: Number(product.sellingPrice),
          discountPercent: 0,
          discountAmount: 0,
          gstRate: Number(product.gstRate || 0),
          taxableAmount: 0,
          cgstAmount: 0,
          sgstAmount: 0,
          igstAmount: 0,
          taxAmount: 0,
          totalAmount: 0,
          isReturned: false,
          returnedQuantity: 0,
          createdAt: new Date(),
          product,
          originalPrice: 0,
        });
        
        return { ...prev, items: [...prev.items, newItem] };
      }
    });
  }, []);

  const updateQuantity = useCallback((tempId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(tempId);
      return;
    }
    
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.tempId === tempId 
          ? calculateItemTotals({ ...item, quantity })
          : item
      ),
    }));
  }, []);

  const updateItemDiscount = useCallback((tempId: string, discountPercent: number) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.map(item => 
        item.tempId === tempId 
          ? calculateItemTotals({ ...item, discountPercent })
          : item
      ),
    }));
  }, []);

  const removeItem = useCallback((tempId: string) => {
    setCart(prev => ({
      ...prev,
      items: prev.items.filter(item => item.tempId !== tempId),
    }));
  }, []);

  const setCustomer = useCallback((customer: Customer | null) => {
    setCart(prev => ({
      ...prev,
      customer,
      customerName: customer?.name || '',
      customerPhone: customer?.phone || '',
    }));
  }, []);

  const setBillDiscount = useCallback((amount: number, percent: number) => {
    setCart(prev => ({
      ...prev,
      billDiscountAmount: amount,
      billDiscountPercent: percent,
    }));
  }, []);

  const setLoyaltyPoints = useCallback((points: number) => {
    setCart(prev => ({
      ...prev,
      loyaltyPointsRedeemed: points,
    }));
  }, []);

  const setNotes = useCallback((notes: string) => {
    setCart(prev => ({ ...prev, notes }));
  }, []);

  const setPayments = useCallback((payments: { mode: PaymentMode; amount: number; reference?: string }[]) => {
    setCart(prev => ({ ...prev, payments }));
  }, []);

  const clearCart = useCallback(() => {
    setCart({
      items: [],
      customer: null,
      customerName: '',
      customerPhone: '',
      billDiscountAmount: 0,
      billDiscountPercent: 0,
      loyaltyPointsRedeemed: 0,
      notes: '',
      payments: [],
    });
    localStorage.removeItem(CART_STORAGE_KEY);
  }, []);

  // Calculate totals
  const subtotal = cart.items.reduce((sum, item) => sum + item.originalPrice, 0);
  const itemDiscountTotal = cart.items.reduce((sum, item) => sum + item.discountAmount, 0);
  const taxableAmount = cart.items.reduce((sum, item) => sum + item.taxableAmount, 0);
  const taxTotal = cart.items.reduce((sum, item) => sum + item.taxAmount, 0);
  const loyaltyDiscount = cart.loyaltyPointsRedeemed; // Assuming 1 point = ₹1
  const grandTotal = taxableAmount + taxTotal - cart.billDiscountAmount - loyaltyDiscount;
  const roundOff = Math.round(grandTotal) - grandTotal;
  const finalTotal = Math.round(grandTotal);

  const itemCount = cart.items.reduce((sum, item) => sum + Number(item.quantity), 0);

  return {
    cart,
    addItem,
    updateQuantity,
    updateItemDiscount,
    removeItem,
    setCustomer,
    setBillDiscount,
    setLoyaltyPoints,
    setNotes,
    setPayments,
    clearCart,
    totals: {
      subtotal,
      itemDiscountTotal,
      taxableAmount,
      taxTotal,
      billDiscountAmount: cart.billDiscountAmount,
      loyaltyDiscount,
      grandTotal: finalTotal,
      roundOff,
      itemCount,
    },
  };
}
