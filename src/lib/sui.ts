// Lightweight placeholder to avoid bundling Sui SDK at build time.
// Replace with real Sui client wiring once SDK/version is set up.
const network = import.meta.env.VITE_SUI_NETWORK || 'testnet';
export const suiClient = {
  network,
};

export const PACKAGE_ID = import.meta.env.VITE_SUI_PACKAGE_ID || '0x0';

// Helper to connect with Slush / Sui wallets using multiple fallbacks
export async function connectSlushWallet(): Promise<string[]> {
  const w = typeof window !== 'undefined' ? (window as any) : undefined;
  if (!w) throw new Error('Window is not available');

  // Collect likely wallet providers on window
  const candidates = [
    w.slush,
    w.slushWallet,
    w.suiWallet,
    w.sui,
    w.wallet,
  ].filter(Boolean);

  // If none of the known keys exist, heuristically scan window for objects with request/connect
  if (candidates.length === 0) {
    const possibleKeys = Object.keys(w).filter((k) => {
      try {
        const v = w[k];
        return v && typeof v === 'object' && (
          typeof v.request === 'function' || typeof v.connect === 'function' || typeof v.getAccounts === 'function'
        );
      } catch {
        return false;
      }
    });
    // Prioritize keys that hint at Sui/Slush
    const prioritized = possibleKeys.sort((a, b) => {
      const score = (s: string) => /slush|sui|wallet/i.test(s) ? 1 : 0;
      return score(b) - score(a);
    });
    for (const k of prioritized) {
      try {
        const v = w[k];
        candidates.push(v);
      } catch {}
    }
  }

  console.debug('[wallet] candidates:', candidates.map((c: any) => ({
    hasRequest: !!c?.request,
    hasConnect: !!c?.connect,
    hasGetAccounts: !!c?.getAccounts,
    name: c?.name || c?.provider || c?.wallet?.name,
  })));

  const tryMethods = async (wallet: any): Promise<string[] | null> => {
    // 1) Slush-style connect()
    if (wallet && typeof wallet.connect === 'function') {
      const res = await wallet.connect();
      if (Array.isArray(res) && res.length > 0) return normalizeAccounts(res);
    }
    // 2) Wallet Standard request() methods
    if (wallet && typeof wallet.request === 'function') {
      // Try requestPermissions then request accounts
      try {
        await wallet.request({ method: 'sui_requestPermissions', params: [ { permissions: ['viewAccount'] } ] });
      } catch {}
      try {
        const res = await wallet.request({ method: 'sui_requestAccounts' });
        if (res) return normalizeAccounts(res);
      } catch {}
      try {
        const res = await wallet.request({ method: 'sui_accounts' });
        if (res) return normalizeAccounts(res);
      } catch {}
      // Some wallets might use generic method names
      try {
        const res = await wallet.request({ method: 'requestAccounts' });
        if (res) return normalizeAccounts(res);
      } catch {}
      try {
        const res = await wallet.request({ method: 'accounts' });
        if (res) return normalizeAccounts(res);
      } catch {}
    }
    // 3) getAccounts()
    if (wallet && typeof wallet.getAccounts === 'function') {
      const res = await wallet.getAccounts();
      if (res) return normalizeAccounts(res);
    }
    // 4) connect() (already tried above for Slush-like)
    if (wallet && typeof wallet.connect === 'function') {
      try {
        const res = await wallet.connect({ onlyIfTrusted: false });
        if (res) return normalizeAccounts(res);
      } catch {}
    }
    return null;
  };

  for (const wallet of candidates) {
    try {
      const accounts = await tryMethods(wallet);
      if (accounts && accounts.length > 0) return accounts;
    } catch (e) {
      // try next wallet
    }
  }
  // Dev fallback: allow a mock wallet when enabled via env
  if (import.meta.env.VITE_ENABLE_WALLET_MOCK === 'true') {
    console.warn('[wallet] Using mock wallet address because VITE_ENABLE_WALLET_MOCK=true');
    return ['0xMOCK_TESTNET_ADDRESS'];
  }

  throw new Error('Slush/Sui wallet not found or connection was denied');
}

function normalizeAccounts(res: any): string[] {
  if (Array.isArray(res)) {
    if (typeof res[0] === 'string') return res as string[];
    if (typeof res[0] === 'object' && res[0]?.address) return (res as any[]).map(a => a.address);
  }
  if (res && res.accounts && Array.isArray(res.accounts)) {
    const a = res.accounts;
    if (typeof a[0] === 'string') return a as string[];
    if (typeof a[0] === 'object' && a[0]?.address) return a.map((x: any) => x.address);
  }
  return [];
}

export async function signTransaction(txBytes: Uint8Array) {
  if (typeof window !== 'undefined' && (window as any).slush) {
    const wallet = (window as any).slush;
    const result = await wallet.signAndExecuteTransaction(txBytes);
    return result;
  }
  throw new Error('Slush Wallet not found');
}

