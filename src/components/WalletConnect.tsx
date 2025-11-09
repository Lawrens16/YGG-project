import { useEffect, useState, useRef } from 'react';
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export function WalletConnect() {
  const account = useCurrentAccount();
  const { mutate: disconnectWallet } = useDisconnectWallet();
  const { adoptWalletAddress, user, disconnect: disconnectAuth } = useAuth();
  const [switching, setSwitching] = useState(false);
  const lastDisconnectTime = useRef<number>(0);

  // Track when user logs out to prevent auto-reconnection
  useEffect(() => {
    if (!user) {
      lastDisconnectTime.current = Date.now();
    }
  }, [user]);

  // Sync wallet address when dapp-kit account changes
  // This handles both initial connection and wallet switching
  // Only sync if the address is different to avoid unnecessary calls
  // Skip auto-connect if user was just disconnected (within last 2 seconds)
  useEffect(() => {
    if (account?.address) {
      const timeSinceDisconnect = Date.now() - lastDisconnectTime.current;
      // Don't auto-connect if user was just disconnected (prevent race condition)
      if (timeSinceDisconnect < 2000) {
        return;
      }
      
      // If user is logged in and address changed, adopt the new address
      // If user is not logged in but wallet is connected, adopt the address to log them in
      if (!user || account.address !== user?.wallet_address) {
        adoptWalletAddress(account.address);
      }
    }
  }, [account?.address, user?.wallet_address, adoptWalletAddress, user]);

  const handleSwitchWallet = async () => {
    setSwitching(true);
    try {
      // Record disconnect time to prevent auto-reconnection
      lastDisconnectTime.current = Date.now();
      // Disconnect both dapp-kit wallet and auth context
      disconnectWallet();
      disconnectAuth();
      // User will then be prompted to connect a new wallet via ConnectButton
    } catch (error) {
      console.error('Error switching wallet:', error);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      <ConnectButton />
      {account && (
        <Button
          variant="outline"
          size="sm"
          onClick={handleSwitchWallet}
          disabled={switching}
          title="Switch Wallet"
        >
          <RefreshCw className={`h-4 w-4 ${switching ? 'animate-spin' : ''}`} />
        </Button>
      )}
    </div>
  );
}


