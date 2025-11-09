# Wallet Detection Troubleshooting Guide

## Problem: "Sui-compatible wallet not found" Error

If you're getting this error even though your Slush wallet is connected, here are the steps to fix it:

## Quick Fixes

### 1. **Use the ConnectButton (Most Important!)**

The wallet **must** be connected via the **ConnectButton** component, not just installed:

1. Look for the **ConnectButton** at the top of the page (usually in the navigation bar)
2. Click it and select your Slush wallet
3. Approve the connection
4. **Then** try registering the organizer again

### 2. **Refresh the Page**

After connecting via ConnectButton:
1. Refresh the page (F5 or Ctrl+R)
2. Make sure the wallet is still connected (check the ConnectButton shows your address)
3. Try again

### 3. **Check Browser Console**

Open browser console (F12) and look for:
- `[wallet]` debug messages showing wallet detection
- Any errors related to wallet connection
- Check if `window.slush` or `window.__suiWallet__` exists

## Common Issues

### Issue 1: Wallet Not Connected via ConnectButton

**Symptom:** Wallet is installed but not connected through the app

**Solution:**
- The wallet must be connected via dapp-kit's ConnectButton
- Just having the wallet extension installed is not enough
- Click the ConnectButton and approve the connection

### Issue 2: Multiple Wallet Extensions

**Symptom:** Multiple wallet extensions installed causing conflicts

**Solution:**
- Disable other wallet extensions temporarily
- Keep only Slush wallet enabled
- Refresh and try again

### Issue 3: Wallet Connection Lost

**Symptom:** Wallet was connected but got disconnected

**Solution:**
- Check if ConnectButton shows "Connect" (means disconnected)
- Reconnect via ConnectButton
- Refresh page if needed

### Issue 4: Browser Cache Issues

**Symptom:** Wallet detection works in incognito but not in normal browser

**Solution:**
- Clear browser cache
- Hard refresh (Ctrl+Shift+R or Cmd+Shift+R)
- Try incognito mode to test

## Debugging Steps

### Step 1: Check Wallet Connection

Open browser console (F12) and run:

```javascript
// Check if wallet is on window
console.log('window.slush:', window.slush);
console.log('window.__suiWallet__:', window.__suiWallet__);
console.log('window.wallets:', window.wallets);

// Check dapp-kit registry
if (window.__suiWallet__) {
  console.log('dapp-kit registry:', window.__suiWallet__);
  if (window.__suiWallet__.getCurrentWallet) {
    console.log('Current wallet:', window.__suiWallet__.getCurrentWallet());
  }
}
```

### Step 2: Check Wallet Methods

```javascript
const wallet = window.slush || window.__suiWallet__?.getCurrentWallet()?.wallet;
if (wallet) {
  console.log('Wallet found:', wallet.name);
  console.log('Has request:', typeof wallet.request === 'function');
  console.log('Has signAndExecuteTransactionBlock:', typeof wallet.signAndExecuteTransactionBlock === 'function');
  console.log('Features:', wallet.features);
} else {
  console.log('No wallet found');
}
```

### Step 3: Manual Wallet Test

```javascript
// Test if wallet can sign transactions
if (window.slush && window.slush.request) {
  window.slush.request({ method: 'sui_accounts' })
    .then(accounts => console.log('Accounts:', accounts))
    .catch(err => console.error('Error:', err));
}
```

## Solutions by Scenario

### Scenario A: Wallet Extension Installed but Not Connected

1. Click the **ConnectButton** in the app
2. Select your Slush wallet
3. Approve the connection
4. Try registering again

### Scenario B: Wallet Connected but Still Getting Error

1. Open browser console (F12)
2. Look for `[wallet]` debug messages
3. Check what wallets are detected
4. If no wallets found, try:
   - Disable other extensions
   - Refresh page
   - Reconnect wallet

### Scenario C: Works in One Browser but Not Another

1. Check if both browsers have the wallet extension
2. Make sure wallet is connected in both
3. Check browser console for errors
4. Try clearing cache in the problematic browser

## Alternative: Use Browser Console Method

If the UI method doesn't work, you can register manually via console:

```javascript
// Make sure you're on the Admin Panel page and logged in
// Then run this in console:

import { registerOrganizer } from './src/lib/sui';

registerOrganizer('0xORGANIZER_WALLET_ADDRESS')
  .then(result => {
    console.log('Success!', result);
    alert('OrganizerCap ID: ' + result.created);
  })
  .catch(error => {
    console.error('Error:', error);
    alert('Error: ' + error.message);
  });
```

## Still Not Working?

1. **Check Network:** Make sure you're on the correct network (testnet/mainnet)
2. **Check Package ID:** Verify `VITE_SUI_PACKAGE_ID` is set correctly
3. **Check Wallet Version:** Update Slush wallet to latest version
4. **Check Browser:** Try a different browser
5. **Check Console:** Look for specific error messages

## Contact Support

If none of these work, provide:
- Browser console logs (especially `[wallet]` messages)
- Browser and version
- Wallet extension version
- Network (testnet/mainnet)
- Screenshot of ConnectButton state

