import React, { createContext, useContext, useState, useEffect } from 'react';
import { getUserByWallet, createUserProfile } from '@/lib/api';
import { connectSlushWallet } from '@/lib/sui';
import type { UserProfile } from '@/types';

interface AuthContextType {
  user: UserProfile | null;
  walletAddress: string | null;
  loading: boolean;
  connectWallet: () => Promise<void>;
  disconnect: () => void;
  updateUser: (updates: Partial<UserProfile>) => Promise<void>;
  adoptWalletAddress: (address: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check for stored wallet address
    const stored = localStorage.getItem('wallet_address');
    if (stored) {
      loadUser(stored);
    } else {
      setLoading(false);
    }
  }, []);

  async function loadUser(address: string) {
    try {
      let profile = await getUserByWallet(address);
      if (!profile) {
        // Create new profile
        profile = await createUserProfile({
          wallet_address: address,
          display_name: address.slice(0, 8) + '...',
        });
      }
      setUser(profile);
      setWalletAddress(address);
      localStorage.setItem('wallet_address', address);
    } catch (error) {
      console.error('Error loading user:', error);
    } finally {
      setLoading(false);
    }
  }

  async function connectWallet() {
    try {
      const accounts = await connectSlushWallet();
      if (accounts && accounts.length > 0) {
        const address = accounts[0];
        await loadUser(address);
      }
    } catch (error) {
      console.error('Error connecting wallet:', error);
      throw error;
    }
  }

  function disconnect() {
    setUser(null);
    setWalletAddress(null);
    localStorage.removeItem('wallet_address');
  }

  async function updateUser(updates: Partial<UserProfile>) {
    if (!user) return;
    const updated = { ...user, ...updates };
    setUser(updated as UserProfile);
  }

  async function adoptWalletAddress(address: string) {
    if (!address) return;
    await loadUser(address);
  }

  return (
    <AuthContext.Provider value={{ user, walletAddress, loading, connectWallet, disconnect, updateUser, adoptWalletAddress }}>
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

