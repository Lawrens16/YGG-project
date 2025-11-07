import { useEffect, useState } from 'react';
import { ConnectButton, useCurrentAccount, useDisconnectWallet } from '@mysten/dapp-kit';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from './ui/button';
import { RefreshCw } from 'lucide-react';

export function WalletConnect() {
  const account = useCurrentAccount();
  const { mutate: disconnect } = useDisconnectWallet();
  const { adoptWalletAddress, user } = useAuth();
  const [switching, setSwitching] = useState(false);

  useEffect(() => {
    if (account?.address && account.address !== user?.wallet_address) {
      adoptWalletAddress(account.address);
    }
  }, [account?.address, user?.wallet_address, adoptWalletAddress]);

  const handleSwitchWallet = async () => {
    setSwitching(true);
    try {
      // Disconnect current wallet
      disconnect();
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
          <RefreshCw className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}


