import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@/hooks/use-toast';

// Types
export interface User {
  id: number;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'cashier';
  status: 'active' | 'inactive' | 'suspended';
  avatarUrl?: string;
  defaultStoreId?: number;
  organizationId: number;
}

export interface Store {
  id: number;
  name: string;
  code: string;
  address?: string;
  city?: string;
  state?: string;
  gstin?: string;
  isPrimary: boolean;
  organizationId: number;
}

export interface Organization {
  id: number;
  name: string;
  slug: string;
  email: string;
  gstin?: string;
  logoUrl?: string;
}

interface AuthContextType {
  user: User | null;
  currentStore: Store | null;
  organization: Organization | null;
  stores: Store[];
  isLoading: boolean;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  switchStore: (storeId: number) => void;
  hasPermission: (permission: Permission) => boolean;
}

type Permission = 
  | 'view_dashboard'
  | 'view_pos'
  | 'view_products'
  | 'manage_products'
  | 'view_customers'
  | 'manage_customers'
  | 'view_purchases'
  | 'manage_purchases'
  | 'view_reports'
  | 'view_settings'
  | 'manage_settings'
  | 'manage_users'
  | 'manage_stores'
  | 'cancel_bills'
  | 'adjust_stock';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const PERMISSIONS: Record<string, Permission[]> = {
  admin: [
    'view_dashboard', 'view_pos', 'view_products', 'manage_products',
    'view_customers', 'manage_customers', 'view_purchases', 'manage_purchases',
    'view_reports', 'view_settings', 'manage_settings', 'manage_users',
    'manage_stores', 'cancel_bills', 'adjust_stock'
  ],
  manager: [
    'view_dashboard', 'view_pos', 'view_products', 'manage_products',
    'view_customers', 'manage_customers', 'view_purchases', 'manage_purchases',
    'view_reports', 'view_settings', 'cancel_bills', 'adjust_stock'
  ],
  cashier: [
    'view_pos', 'view_products', 'view_customers'
  ]
};

export function AuthProvider({ children }: { children: ReactNode }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [currentStoreId, setCurrentStoreId] = useState<number | null>(null);

  // Fetch current user
  const { data: user, isLoading: isUserLoading } = useQuery({
    queryKey: ['auth', 'user'],
    queryFn: async () => {
      const response = await fetch('/api/auth/me');
      if (!response.ok) {
        if (response.status === 401) return null;
        throw new Error('Failed to fetch user');
      }
      return response.json() as Promise<User>;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch user's stores
  const { data: stores = [], isLoading: isStoresLoading } = useQuery({
    queryKey: ['auth', 'stores'],
    queryFn: async () => {
      const response = await fetch('/api/auth/stores');
      if (!response.ok) throw new Error('Failed to fetch stores');
      return response.json() as Promise<Store[]>;
    },
    enabled: !!user,
  });

  // Fetch organization
  const { data: organization, isLoading: isOrgLoading } = useQuery({
    queryKey: ['auth', 'organization'],
    queryFn: async () => {
      const response = await fetch('/api/auth/organization');
      if (!response.ok) throw new Error('Failed to fetch organization');
      return response.json() as Promise<Organization>;
    },
    enabled: !!user,
  });

  // Login mutation
  const loginMutation = useMutation({
    mutationFn: async ({ email, password }: { email: string; password: string }) => {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      
      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Invalid credentials');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['auth'] });
      toast({
        title: 'Welcome back!',
        description: 'You have successfully logged in.',
      });
    },
    onError: (error: Error) => {
      toast({
        title: 'Login failed',
        description: error.message,
        variant: 'destructive',
      });
    },
  });

  // Logout mutation
  const logoutMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/auth/logout', { method: 'POST' });
      if (!response.ok) throw new Error('Logout failed');
    },
    onSuccess: () => {
      queryClient.clear();
      setCurrentStoreId(null);
      toast({
        title: 'Logged out',
        description: 'You have been successfully logged out.',
      });
    },
  });

  // Set initial store when stores are loaded
  useEffect(() => {
    if (stores.length > 0 && !currentStoreId) {
      const defaultStore = stores.find(s => s.id === user?.defaultStoreId) || 
                          stores.find(s => s.isPrimary) || 
                          stores[0];
      setCurrentStoreId(defaultStore.id);
    }
  }, [stores, user, currentStoreId]);

  const currentStore = stores.find(s => s.id === currentStoreId) || null;

  const login = async (email: string, password: string) => {
    await loginMutation.mutateAsync({ email, password });
  };

  const logout = async () => {
    await logoutMutation.mutateAsync();
  };

  const switchStore = (storeId: number) => {
    setCurrentStoreId(storeId);
    // Update default store preference
    fetch('/api/auth/switch-store', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ storeId }),
    });
    toast({
      title: 'Store switched',
      description: `You are now working at ${stores.find(s => s.id === storeId)?.name}`,
    });
  };

  const hasPermission = (permission: Permission): boolean => {
    if (!user) return false;
    return PERMISSIONS[user.role]?.includes(permission) || false;
  };

  const value: AuthContextType = {
    user,
    currentStore,
    organization,
    stores,
    isLoading: isUserLoading || isStoresLoading || isOrgLoading,
    isAuthenticated: !!user,
    login,
    logout,
    switchStore,
    hasPermission,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export function useRequireAuth(permission?: Permission) {
  const auth = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    if (!auth.isLoading && !auth.isAuthenticated) {
      window.location.href = '/login';
    }
    
    if (permission && !auth.hasPermission(permission)) {
      toast({
        title: 'Access denied',
        description: 'You do not have permission to access this feature.',
        variant: 'destructive',
      });
      window.location.href = '/';
    }
  }, [auth.isLoading, auth.isAuthenticated, permission]);

  return auth;
}
