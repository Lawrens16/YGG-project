import { SuiClient, getFullnodeUrl } from '@mysten/sui.js/client';
import { TransactionBlock } from '@mysten/sui.js/transactions';
import { SUI_TYPE_ARG } from '@mysten/sui.js/utils';

const network = import.meta.env.VITE_SUI_NETWORK || 'testnet';
export const suiClient = new SuiClient({ url: getFullnodeUrl(network as any) });

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

/**
 * Find a Sui-compatible wallet for transaction signing
 * Uses the same detection logic as connectSlushWallet but returns the wallet object
 * Also checks dapp-kit's wallet registry
 */
function findWalletForTransaction(): any {
  const w = typeof window !== 'undefined' ? (window as any) : undefined;
  if (!w) throw new Error('Window is not available');

  // First, try to get wallet from dapp-kit's wallet registry
  // dapp-kit stores wallets in window.__suiWallet__
  try {
    if (w.__suiWallet__) {
      const walletRegistry = w.__suiWallet__;
      // Try to get the current wallet
      if (walletRegistry.getCurrentWallet) {
        const current = walletRegistry.getCurrentWallet();
        if (current && current.wallet) {
          console.debug('[wallet] Found wallet from dapp-kit registry:', current.wallet.name);
          return current.wallet;
        }
      }
      // Try to get wallets array
      if (walletRegistry.getWallets) {
        const wallets = walletRegistry.getWallets();
        if (wallets && wallets.length > 0 && wallets[0].wallet) {
          console.debug('[wallet] Found wallet from dapp-kit wallets array:', wallets[0].wallet.name);
          return wallets[0].wallet;
        }
      }
    }
  } catch (e) {
    console.debug('[wallet] Could not access dapp-kit wallet registry:', e);
  }

  // Collect likely wallet providers on window (prioritize Slush)
  const candidates = [
    w.slush,
    w.slushWallet,
    w.suiWallet,
    w.sui,
    w.wallet,
  ].filter(Boolean);

  // Also check for Wallet Standard wallets array
  if (w.wallets && Array.isArray(w.wallets)) {
    candidates.push(...w.wallets);
  }

  // If none of the known keys exist, heuristically scan window for objects with request/connect
  if (candidates.length === 0) {
    const possibleKeys = Object.keys(w).filter((k) => {
      try {
        const v = w[k];
        return v && typeof v === 'object' && (
          typeof v.request === 'function' || 
          typeof v.connect === 'function' || 
          typeof v.getAccounts === 'function' ||
          typeof v.signAndExecuteTransaction === 'function' ||
          typeof v.signAndExecuteTransactionBlock === 'function'
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

  console.debug('[wallet] Transaction signing candidates:', candidates.map((c: any) => ({
    hasRequest: !!c?.request,
    hasSignAndExecuteTransactionBlock: !!c?.signAndExecuteTransactionBlock,
    hasSignAndExecuteTransaction: !!c?.signAndExecuteTransaction,
    name: c?.name || c?.provider?.name || c?.wallet?.name,
    features: c?.features ? Object.keys(c.features) : undefined,
  })));

  // Check each candidate for transaction signing capability
  for (const wallet of candidates) {
    // Check for Wallet Standard interface (preferred)
    if (wallet && typeof wallet.request === 'function') {
      // Verify it has the sui_signAndExecuteTransactionBlock method
      try {
        // Check if it's a Wallet Standard wallet
        if (wallet.features && wallet.features['sui:signAndExecuteTransactionBlock']) {
          console.debug('[wallet] Found Wallet Standard wallet:', wallet.name || 'unknown');
          return wallet;
        }
        // Or if it responds to the method (some wallets don't expose features)
        // Try a test to see if it supports the method
        console.debug('[wallet] Found wallet with request method:', wallet.name || 'unknown');
        return wallet;
      } catch {}
    }
    // Check for direct signAndExecuteTransactionBlock method
    if (wallet && typeof wallet.signAndExecuteTransactionBlock === 'function') {
      console.debug('[wallet] Found wallet with signAndExecuteTransactionBlock:', wallet.name || 'unknown');
      return wallet;
    }
    // Check for Slush-style signAndExecuteTransaction
    if (wallet && typeof wallet.signAndExecuteTransaction === 'function') {
      console.debug('[wallet] Found wallet with signAndExecuteTransaction (Slush-style):', wallet.name || 'unknown');
      return wallet;
    }
  }

  // Provide helpful error message with debugging info (only log in development)
  if (import.meta.env.DEV) {
    const walletLikeKeys = Object.keys(w).filter(k => {
      try {
        const v = w[k];
        return v && typeof v === 'object' && (
          typeof v.request === 'function' || 
          typeof v.connect === 'function' ||
          /slush|sui|wallet/i.test(k)
        );
      } catch {
        return false;
      }
    });
    console.debug('[wallet] Wallet-like keys found:', walletLikeKeys);
    console.debug('[wallet] dapp-kit registry:', w.__suiWallet__);
  }
  
  throw new Error('Sui-compatible wallet not found. Please make sure your Slush wallet is connected via the ConnectButton and refresh the page.');
}

export async function signTransaction(txBytes: Uint8Array) {
  if (typeof window !== 'undefined' && (window as any).slush) {
    const wallet = (window as any).slush;
    const result = await wallet.signAndExecuteTransaction(txBytes);
    return result;
  }
  throw new Error('Slush Wallet not found');
}

export type MintCertificateArgs = {
  owner: string;
  category: string;
  title: string;
  description: string;
  proofHash: Uint8Array; // 32 bytes preferred
  gpsData: string; // "lat,lng" text
};

/**
 * Build a transaction to call achievement::mint_achievement and submit via Wallet Standard.
 * Returns the transaction digest and created object id if available.
 */
export async function mintCertificate(args: MintCertificateArgs): Promise<{ digest: string; created?: string }> {
  const pkg = PACKAGE_ID;
  if (!pkg || pkg === '0x0') throw new Error('VITE_SUI_PACKAGE_ID is not set');

  const txb = new TransactionBlock();
  const enc = new TextEncoder();
  txb.moveCall({
    target: `${pkg}::achievement::mint_achievement`,
    arguments: [
      txb.pure(args.owner),
      txb.pure(Array.from(enc.encode(args.category))),
      txb.pure(Array.from(enc.encode(args.title))),
      txb.pure(Array.from(enc.encode(args.description))),
      txb.pure(Array.from(args.proofHash)),
      txb.pure(Array.from(enc.encode(args.gpsData))),
    ],
  });

  const wallet: any = (typeof window !== 'undefined') ? (window as any).suiWallet || (window as any).slush || (window as any).wallet : null;
  if (!wallet || typeof wallet.request !== 'function') {
    throw new Error('Sui-compatible wallet not found');
  }

  const res = await wallet.request({
    method: 'sui_signAndExecuteTransactionBlock',
    params: [{ transactionBlock: txb.serialize(), options: { showEffects: true, showObjectChanges: true } }],
  });

  const digest: string = res?.digest || res?.effectsCert?.effects?.transactionDigest || res?.effects?.transactionDigest;
  let created: string | undefined;
  const objectChanges: any[] = res?.objectChanges || res?.effects?.created || [];
  if (Array.isArray(objectChanges)) {
    // Wallet-std returns objectChanges entries with type 'created'
    const createdChange = objectChanges.find((c: any) => (c?.type === 'created' && c?.objectType?.includes('achievement::Achievement')) || c?.reference?.objectId);
    created = createdChange?.objectId || createdChange?.reference?.objectId;
  }
  return { digest, created };
}

export type MintEventBadgeArgs = {
  owner: string;
  eventId: string;
  eventName: string;
  category: string;
  title: string;
  description: string;
  proofHash: Uint8Array;
  gpsData: string;
};

/**
 * Mint an event badge (requires VerifierCap)
 */
export async function mintEventBadge(args: MintEventBadgeArgs): Promise<{ digest: string; created?: string }> {
  const pkg = PACKAGE_ID;
  if (!pkg || pkg === '0x0') throw new Error('VITE_SUI_PACKAGE_ID is not set');

  const txb = new TransactionBlock();
  const enc = new TextEncoder();
  
  // Get VerifierCap (shared object)
  const verifierCap = txb.object('0xVERIFIER_CAP'); // This should be the actual VerifierCap object ID
  
  txb.moveCall({
    target: `${pkg}::achievement::mint_certificate_with_event`,
    arguments: [
      verifierCap,
      txb.pure(args.owner),
      txb.pure(Array.from(enc.encode(args.eventId))),
      txb.pure(Array.from(enc.encode(args.eventName))),
      txb.pure(Array.from(enc.encode(args.category))),
      txb.pure(Array.from(enc.encode(args.title))),
      txb.pure(Array.from(enc.encode(args.description))),
      txb.pure(Array.from(args.proofHash)),
      txb.pure(Array.from(enc.encode(args.gpsData))),
    ],
  });

  const wallet: any = (typeof window !== 'undefined') ? (window as any).suiWallet || (window as any).slush || (window as any).wallet : null;
  if (!wallet || typeof wallet.request !== 'function') {
    throw new Error('Sui-compatible wallet not found');
  }

  const res = await wallet.request({
    method: 'sui_signAndExecuteTransactionBlock',
    params: [{ transactionBlock: txb.serialize(), options: { showEffects: true, showObjectChanges: true } }],
  });

  const digest: string = res?.digest || res?.effectsCert?.effects?.transactionDigest || res?.effects?.transactionDigest;
  let created: string | undefined;
  const objectChanges: any[] = res?.objectChanges || res?.effects?.created || [];
  if (Array.isArray(objectChanges)) {
    const createdChange = objectChanges.find((c: any) => (c?.type === 'created' && c?.objectType?.includes('achievement::Achievement')) || c?.reference?.objectId);
    created = createdChange?.objectId || createdChange?.reference?.objectId;
  }
  return { digest, created };
}

export type BatchMintEventBadgesArgs = {
  owners: string[];
  eventId: string;
  eventName: string;
  category: string;
  title: string;
  description: string;
};

/**
 * Batch mint event badges for multiple owners (requires VerifierCap)
 */
export async function batchMintEventBadges(args: BatchMintEventBadgesArgs): Promise<{ digest: string; createdObjects: string[] }> {
  const pkg = PACKAGE_ID;
  if (!pkg || pkg === '0x0') throw new Error('VITE_SUI_PACKAGE_ID is not set');

  const txb = new TransactionBlock();
  const enc = new TextEncoder();
  
  // Get VerifierCap (shared object)
  const verifierCap = txb.object('0xVERIFIER_CAP'); // This should be the actual VerifierCap object ID
  
  txb.moveCall({
    target: `${pkg}::achievement::batch_mint_event_badges`,
    arguments: [
      verifierCap,
      txb.pure(args.owners),
      txb.pure(Array.from(enc.encode(args.eventId))),
      txb.pure(Array.from(enc.encode(args.eventName))),
      txb.pure(Array.from(enc.encode(args.category))),
      txb.pure(Array.from(enc.encode(args.title))),
      txb.pure(Array.from(enc.encode(args.description))),
    ],
  });

  const wallet: any = (typeof window !== 'undefined') ? (window as any).suiWallet || (window as any).slush || (window as any).wallet : null;
  if (!wallet || typeof wallet.request !== 'function') {
    throw new Error('Sui-compatible wallet not found');
  }

  const res = await wallet.request({
    method: 'sui_signAndExecuteTransactionBlock',
    params: [{ transactionBlock: txb.serialize(), options: { showEffects: true, showObjectChanges: true } }],
  });

  const digest: string = res?.digest || res?.effectsCert?.effects?.transactionDigest || res?.effects?.transactionDigest;
  const createdObjects: string[] = [];
  const objectChanges: any[] = res?.objectChanges || res?.effects?.created || [];
  if (Array.isArray(objectChanges)) {
    const createdChanges = objectChanges.filter((c: any) => 
      (c?.type === 'created' && c?.objectType?.includes('achievement::Achievement')) || c?.reference?.objectId
    );
    createdObjects.push(...createdChanges.map((c: any) => c?.objectId || c?.reference?.objectId).filter(Boolean));
  }
  return { digest, createdObjects };
}

export const ORGANIZER_CAP_OBJECT_ID = import.meta.env.VITE_ORGANIZER_CAP_OBJECT_ID || '0x0';
export const DEVELOPER_TREASURY_OBJECT_ID = import.meta.env.VITE_DEVELOPER_TREASURY_OBJECT_ID || '0x0';

/**
 * Get the OrganizerCap object ID for a given organizer address
 */
export async function getOrganizerCap(organizerAddress: string): Promise<string | null> {
  try {
    const pkg = PACKAGE_ID;
    if (!pkg || pkg === '0x0') return null;

    // Query for OrganizerCap objects owned by this address
    const objects = await suiClient.getOwnedObjects({
      owner: organizerAddress,
      filter: {
        StructType: `${pkg}::achievement::OrganizerCap`,
      },
      options: {
        showType: true,
        showOwner: true,
      },
    });

    if (objects.data && objects.data.length > 0) {
      return objects.data[0].data?.objectId || null;
    }

    return null;
  } catch (error) {
    console.error('Error fetching OrganizerCap:', error);
    return null;
  }
}

/**
 * Get the DeveloperTreasury object ID
 * This is owned by the contract deployer/admin
 */
export async function getDeveloperTreasury(deployerAddress?: string): Promise<string | null> {
  try {
    const pkg = PACKAGE_ID;
    if (!pkg || pkg === '0x0') return null;

    // If we have a deployer address, query their objects
    if (deployerAddress) {
      const objects = await suiClient.getOwnedObjects({
        owner: deployerAddress,
        filter: {
          StructType: `${pkg}::achievement::DeveloperTreasury`,
        },
        options: {
          showType: true,
          showOwner: true,
        },
      });

      if (objects.data && objects.data.length > 0) {
        return objects.data[0].data?.objectId || null;
      }
    }

    // Fallback to environment variable
    if (DEVELOPER_TREASURY_OBJECT_ID && DEVELOPER_TREASURY_OBJECT_ID !== '0x0') {
      return DEVELOPER_TREASURY_OBJECT_ID;
    }

    return null;
  } catch (error) {
    console.error('Error fetching DeveloperTreasury:', error);
    return null;
  }
}

export type BatchMintClearancesArgs = {
  organizerCapObjectId: string;
  treasuryObjectId: string;
  attendees: string[];
  eventId: string;
  eventName: string;
  clearanceType: string;
  title: string;
  description: string;
  metadata?: string; // Optional JSON string for custom metadata
  baseFeePerClearance: number; // Base fee in MIST (1 SUI = 1,000,000,000 MIST)
};

/**
 * Calculate the total fee (including 2% developer fee) for batch minting clearances
 * @param baseFeePerClearance Base fee per clearance in MIST
 * @param attendeeCount Number of attendees
 * @returns Total fee in MIST (baseFee * count * 1.02)
 */
export function calculateTotalFee(baseFeePerClearance: number, attendeeCount: number): number {
  // Total fee = base_fee * count * 1.02 (2% developer fee)
  // Using integer math: fee = (base_fee * count * 102) / 100
  return Math.floor((baseFeePerClearance * attendeeCount * 102) / 100);
}

/**
 * Calculate the developer fee (2% of base fee * count)
 * @param baseFeePerClearance Base fee per clearance in MIST
 * @param attendeeCount Number of attendees
 * @returns Developer fee in MIST
 */
export function calculateDeveloperFee(baseFeePerClearance: number, attendeeCount: number): number {
  // Developer fee = 2% of base fee * count
  return Math.floor((baseFeePerClearance * attendeeCount * 2) / 100);
}

/**
 * Batch mint clearances for event attendees
 * Organizer pays gas + 2% developer fee
 * 
 * @param args Batch mint arguments including organizer cap, treasury, attendees, and clearance details
 * @returns Transaction digest and created clearance object IDs
 */
export async function batchMintClearances(
  args: BatchMintClearancesArgs
): Promise<{ digest: string; createdObjects: string[] }> {
  const pkg = PACKAGE_ID;
  if (!pkg || pkg === '0x0') throw new Error('VITE_SUI_PACKAGE_ID is not set');

  const txb = new TransactionBlock();
  const enc = new TextEncoder();

  // Calculate total fee
  const totalFee = calculateTotalFee(args.baseFeePerClearance, args.attendees.length);
  
  // Get payment coin from sender
  const [payment] = txb.splitCoins(txb.gas, [totalFee]);

  // Get OrganizerCap and DeveloperTreasury objects
  const organizerCap = txb.object(args.organizerCapObjectId);
  const treasury = txb.object(args.treasuryObjectId);

  // Call batch_mint_clearances
  txb.moveCall({
    target: `${pkg}::achievement::batch_mint_clearances`,
    arguments: [
      organizerCap,
      treasury,
      payment,
      txb.pure(args.attendees),
      txb.pure(Array.from(enc.encode(args.eventId))),
      txb.pure(Array.from(enc.encode(args.eventName))),
      txb.pure(Array.from(enc.encode(args.clearanceType))),
      txb.pure(Array.from(enc.encode(args.title))),
      txb.pure(Array.from(enc.encode(args.description))),
      txb.pure(Array.from(enc.encode(args.metadata || '{}'))),
      txb.pure(args.baseFeePerClearance),
    ],
  });

  const wallet: any = (typeof window !== 'undefined') 
    ? (window as any).suiWallet || (window as any).slush || (window as any).wallet 
    : null;
  
  if (!wallet || typeof wallet.request !== 'function') {
    throw new Error('Sui-compatible wallet not found');
  }

  const res = await wallet.request({
    method: 'sui_signAndExecuteTransactionBlock',
    params: [{ 
      transactionBlock: txb.serialize(), 
      options: { 
        showEffects: true, 
        showObjectChanges: true,
        showEvents: true,
      } 
    }],
  });

  const digest: string = res?.digest || res?.effectsCert?.effects?.transactionDigest || res?.effects?.transactionDigest;
  const createdObjects: string[] = [];
  
  const objectChanges: any[] = res?.objectChanges || res?.effects?.created || [];
  if (Array.isArray(objectChanges)) {
    const createdChanges = objectChanges.filter((c: any) => 
      (c?.type === 'created' && c?.objectType?.includes('achievement::Clearance')) || 
      c?.reference?.objectId
    );
    createdObjects.push(...createdChanges.map((c: any) => c?.objectId || c?.reference?.objectId).filter(Boolean));
  }

  return { digest, createdObjects };
}

/**
 * Register an organizer (admin function)
 * This should be called by the contract deployer/admin
 * @param organizerAddress - The wallet address of the organizer to register
 * @param wallet - Optional wallet object. If not provided, will try to detect wallet automatically
 */
export async function registerOrganizer(
  organizerAddress: string,
  wallet?: any
): Promise<{ digest: string; created?: string }> {
  const pkg = PACKAGE_ID;
  if (!pkg || pkg === '0x0') throw new Error('VITE_SUI_PACKAGE_ID is not set');

  const txb = new TransactionBlock();
  
  txb.moveCall({
    target: `${pkg}::achievement::register_organizer`,
    arguments: [
      txb.pure(organizerAddress),
    ],
  });

  // Use provided wallet or try to detect wallet
  let walletToUse = wallet;
  if (!walletToUse) {
    try {
      walletToUse = findWalletForTransaction();
    } catch (error: any) {
      // If wallet detection fails and no wallet was provided, throw a helpful error
      throw new Error(
        'Wallet not found. Please make sure your wallet is connected via the ConnectButton at the top of the page. ' +
        'If the wallet is connected but you still see this error, try refreshing the page.'
      );
    }
  }
  
  if (!walletToUse) {
    throw new Error('No wallet available. Please connect your wallet first.');
  }

  // Try Wallet Standard interface first
  let res: any;
  if (typeof walletToUse.request === 'function') {
    try {
      res = await walletToUse.request({
        method: 'sui_signAndExecuteTransactionBlock',
        params: [{ 
          transactionBlock: txb.serialize(), 
          options: { 
            showEffects: true, 
            showObjectChanges: true 
          } 
        }],
      });
    } catch (error: any) {
      // If Wallet Standard fails, try alternative methods
      console.warn('Wallet Standard method failed, trying alternatives:', error);
      throw error;
    }
  } else if (typeof walletToUse.signAndExecuteTransactionBlock === 'function') {
    // Direct method call
    res = await walletToUse.signAndExecuteTransactionBlock({
      transactionBlock: txb.serialize(),
      options: { 
        showEffects: true, 
        showObjectChanges: true 
      }
    });
  } else if (typeof walletToUse.signAndExecuteTransaction === 'function') {
    // Slush-style method
    res = await walletToUse.signAndExecuteTransaction(txb.serialize());
  } else {
    throw new Error('Wallet does not support transaction signing');
  }

  const digest: string = res?.digest || res?.effectsCert?.effects?.transactionDigest || res?.effects?.transactionDigest;
  let created: string | undefined;
  
  const objectChanges: any[] = res?.objectChanges || res?.effects?.created || [];
  if (Array.isArray(objectChanges)) {
    const createdChange = objectChanges.find((c: any) => 
      (c?.type === 'created' && c?.objectType?.includes('achievement::OrganizerCap')) || 
      c?.reference?.objectId
    );
    created = createdChange?.objectId || createdChange?.reference?.objectId;
  }

  return { digest, created };
}

