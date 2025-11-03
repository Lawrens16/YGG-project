import { useEffect } from 'react';
import { ConnectButton, useCurrentAccount } from '@mysten/dapp-kit';
import { useAuth } from '@/contexts/AuthContext';

export function WalletConnect() {
  const account = useCurrentAccount();
  const { adoptWalletAddress } = useAuth();

  useEffect(() => {
    if (account?.address) {
      adoptWalletAddress(account.address);
    }
  }, [account?.address, adoptWalletAddress]);

  return <ConnectButton />;
}


