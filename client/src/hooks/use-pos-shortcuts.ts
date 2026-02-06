import { useState, useEffect, useCallback } from 'react';

interface Shortcut {
  key: string;
  ctrl?: boolean;
  alt?: boolean;
  shift?: boolean;
  meta?: boolean;
  handler: () => void;
  description: string;
}

export function useKeyboardShortcuts(shortcuts: Shortcut[]) {
  const handleKeyDown = useCallback((event: KeyboardEvent) => {
    // Don't trigger shortcuts when typing in input fields
    if (event.target instanceof HTMLInputElement || 
        event.target instanceof HTMLTextAreaElement) {
      return;
    }

    shortcuts.forEach(shortcut => {
      const keyMatch = event.key.toLowerCase() === shortcut.key.toLowerCase();
      const ctrlMatch = shortcut.ctrl ? event.ctrlKey : !event.ctrlKey;
      const altMatch = shortcut.alt ? event.altKey : !event.altKey;
      const shiftMatch = shortcut.shift ? event.shiftKey : !event.shiftKey;
      const metaMatch = shortcut.meta ? event.metaKey : !event.metaKey;

      if (keyMatch && ctrlMatch && altMatch && shiftMatch && metaMatch) {
        event.preventDefault();
        shortcut.handler();
      }
    });
  }, [shortcuts]);

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);
}

export function useBarcodeScanner(onScan: (barcode: string) => void, timeout: number = 50) {
  const [buffer, setBuffer] = useState('');
  const [lastKeyTime, setLastKeyTime] = useState(0);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Skip if user is typing in an input
      if (event.target instanceof HTMLInputElement || 
          event.target instanceof HTMLTextAreaElement) {
        return;
      }

      const currentTime = Date.now();
      const timeDiff = currentTime - lastKeyTime;
      
      // Reset buffer if too much time passed
      if (timeDiff > timeout) {
        setBuffer('');
      }

      setLastKeyTime(currentTime);

      // Handle Enter as barcode terminator
      if (event.key === 'Enter') {
        if (buffer.length >= 6) { // Minimum barcode length
          onScan(buffer);
          setBuffer('');
        }
        return;
      }

      // Only accept printable characters
      if (event.key.length === 1) {
        setBuffer(prev => prev + event.key);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [buffer, lastKeyTime, onScan, timeout]);

  return { buffer };
}

export function useHeldBills() {
  const [heldBills, setHeldBills] = useState<any[]>([]);

  const loadHeldBills = useCallback(async () => {
    try {
      const response = await fetch('/api/bills/held');
      if (response.ok) {
        const data = await response.json();
        setHeldBills(data);
      }
    } catch (error) {
      console.error('Failed to load held bills:', error);
    }
  }, []);

  const holdBill = useCallback(async (cartData: any, customerName?: string, notes?: string) => {
    try {
      const response = await fetch('/api/bills/hold', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          cartData,
          customerName,
          notes,
        }),
      });
      
      if (response.ok) {
        const data = await response.json();
        await loadHeldBills();
        return data;
      }
    } catch (error) {
      console.error('Failed to hold bill:', error);
    }
  }, [loadHeldBills]);

  const resumeBill = useCallback(async (heldBillId: number) => {
    try {
      const response = await fetch(`/api/bills/hold/${heldBillId}/resume`, {
        method: 'POST',
      });
      
      if (response.ok) {
        const data = await response.json();
        await loadHeldBills();
        return data;
      }
    } catch (error) {
      console.error('Failed to resume bill:', error);
    }
  }, [loadHeldBills]);

  const deleteHeldBill = useCallback(async (heldBillId: number) => {
    try {
      const response = await fetch(`/api/bills/hold/${heldBillId}`, {
        method: 'DELETE',
      });
      
      if (response.ok) {
        await loadHeldBills();
      }
    } catch (error) {
      console.error('Failed to delete held bill:', error);
    }
  }, [loadHeldBills]);

  useEffect(() => {
    loadHeldBills();
  }, [loadHeldBills]);

  return {
    heldBills,
    holdBill,
    resumeBill,
    deleteHeldBill,
    refresh: loadHeldBills,
  };
}

export const POS_SHORTCUTS = {
  search: { key: 'f', description: 'Focus search' },
  checkout: { key: 'F2', description: 'Checkout / Complete bill' },
  hold: { key: 'h', ctrl: true, description: 'Hold bill' },
  clear: { key: 'F8', description: 'Clear cart' },
  quantity: { key: 'q', description: 'Change quantity' },
  discount: { key: 'd', description: 'Apply discount' },
  customer: { key: 'c', description: 'Add/Select customer' },
  print: { key: 'p', ctrl: true, description: 'Print last receipt' },
  help: { key: '?', description: 'Show keyboard shortcuts' },
};
