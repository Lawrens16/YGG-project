# Manual Organizer Registration Guide

This guide explains how to manually register organizers on-chain when automatic registration fails or when you need to register organizers outside the normal flow.

## Prerequisites

- Admin access to the application
- Contract deployer wallet connected (or admin wallet with permission)
- Organizer's wallet address
- Sui CLI installed (for CLI method)

## Method 1: Using Admin Panel (Recommended)

### Step 1: Access Admin Panel

1. Log in as an admin user
2. Navigate to **Admin Panel** → **Applications** tab
3. Find the organizer application you want to register

### Step 2: Manual Registration

1. Click the **"Manual Register"** button next to the organizer
2. Enter or verify the organizer's wallet address
3. Click **"Register On-Chain"**
4. Approve the transaction in your wallet
5. Copy the OrganizerCap Object ID from the success message

### Step 3: Verify Registration

- The organizer should now be able to use the system
- Their OrganizerCap will be automatically detected when they access their events

## Method 2: Using Browser Console

If the Admin Panel method doesn't work, you can use the browser console:

### Step 1: Open Browser Console

1. Open your browser's Developer Tools (F12)
2. Go to the **Console** tab
3. Make sure you're logged in as an admin

### Step 2: Register Organizer

Run this command in the console:

```javascript
// Import the function (if using ES modules)
import { registerOrganizer } from './src/lib/sui';

// Or if the function is available globally:
// Register an organizer with their wallet address
registerOrganizer('0xORGANIZER_WALLET_ADDRESS_HERE')
  .then(result => {
    console.log('Registration successful!');
    console.log('Transaction Digest:', result.digest);
    console.log('OrganizerCap Object ID:', result.created);
    alert(`Organizer registered!\n\nOrganizerCap ID: ${result.created}`);
  })
  .catch(error => {
    console.error('Registration failed:', error);
    alert('Registration failed: ' + error.message);
  });
```

Replace `0xORGANIZER_WALLET_ADDRESS_HERE` with the actual wallet address.

## Method 3: Using Sui CLI

### Step 1: Prepare the Transaction

Create a file called `register_organizer.move`:

```move
module register_organizer::register {
    use achievement_wallet::achievement;
    
    public entry fun register(organizer: address, ctx: &mut TxContext) {
        achievement::register_organizer(organizer, ctx);
    }
}
```

### Step 2: Call the Function

```bash
# Set your package ID
PACKAGE_ID=0xYOUR_PACKAGE_ID

# Set the organizer's wallet address
ORGANIZER_ADDRESS=0xORGANIZER_WALLET_ADDRESS

# Call the function
sui client call \
  --package $PACKAGE_ID \
  --module achievement \
  --function register_organizer \
  --args $ORGANIZER_ADDRESS \
  --gas-budget 10000000
```

### Step 3: Find the OrganizerCap Object ID

After the transaction completes:

1. Copy the transaction digest
2. Go to Sui Explorer: https://suiexplorer.com
3. Search for the transaction
4. Look for the created `OrganizerCap` object
5. Copy the Object ID

## Method 4: Using Sui Explorer (Interactive)

1. Go to https://suiexplorer.com
2. Connect your wallet
3. Navigate to **Move Call**
4. Enter:
   - **Package ID**: Your deployed package ID
   - **Module**: `achievement`
   - **Function**: `register_organizer`
   - **Arguments**: The organizer's wallet address
5. Execute the transaction
6. Find the created OrganizerCap in the transaction results

## Verification

After registration, verify the organizer can use the system:

1. **Check OrganizerCap exists:**
   ```bash
   sui client objects --address ORGANIZER_ADDRESS
   ```
   Look for an object with type containing `OrganizerCap`

2. **In the application:**
   - The organizer should be able to access the Organizer Dashboard
   - They should be able to create events
   - They should be able to mint clearances

## Troubleshooting

### Error: "Sui-compatible wallet not found"

- Make sure your wallet (Slush/Sui Wallet) is connected
- Refresh the page and try again
- Check browser console for wallet detection logs

### Error: "VITE_SUI_PACKAGE_ID is not set"

- Make sure your `.env` file has `VITE_SUI_PACKAGE_ID` set
- Restart your development server

### Error: "Transaction failed"

- Check that you have enough SUI for gas
- Verify the package ID is correct
- Make sure you're on the correct network (testnet/mainnet)

### OrganizerCap not found after registration

- Wait a few seconds for the transaction to finalize
- Check Sui Explorer to confirm the transaction succeeded
- Verify the organizer's wallet address is correct
- The organizer may need to refresh their page

## Important Notes

1. **Who can register organizers?**
   - Currently, anyone can call `register_organizer` (no admin cap check)
   - In production, you should add an admin cap check to the Move contract

2. **OrganizerCap Object ID:**
   - Save the OrganizerCap Object ID for reference
   - The organizer doesn't need it - the system auto-detects it
   - But it's useful for troubleshooting

3. **Multiple Registrations:**
   - Each organizer can only have one OrganizerCap
   - If you try to register the same organizer twice, it will create another cap
   - The system will use the first one found

4. **Network Matching:**
   - Make sure the package ID matches the network you're using
   - Testnet package IDs won't work on mainnet and vice versa

## Quick Reference

```javascript
// Browser Console Quick Register
registerOrganizer('0xORGANIZER_ADDRESS')
  .then(r => console.log('Cap ID:', r.created))
  .catch(e => console.error(e));
```

```bash
# CLI Quick Register
sui client call \
  --package 0xPACKAGE_ID \
  --module achievement \
  --function register_organizer \
  --args 0xORGANIZER_ADDRESS \
  --gas-budget 10000000
```

