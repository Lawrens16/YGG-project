# Sui Package ID Setup Guide

This guide explains how to set up the package ID for your Sui smart contract.

## Overview

The package ID is the unique identifier for your deployed Sui Move contract. It's used by the frontend to interact with your smart contract functions.

## Step-by-Step Setup

### 1. Deploy Your Smart Contract

First, you need to deploy your Move contract to the Sui network:

```bash
# Navigate to the Sui contracts directory
cd sui

# Build the contract
sui move build

# Deploy to testnet (or your target network)
sui client publish --gas-budget 10000000
```

### 2. Get the Package ID

After deployment, you'll see output like this:

```
Published Objects:
  ┌──
  │ ObjectID: 0x1234567890abcdef...
  │ Sender: 0xabcdef1234567890...
  │ Owner: Account Address ( 0xabcdef1234567890... )
  │ ObjectType: 0x2::package::UpgradeCap
  └──
```

**Look for the "Published object ID"** - this is your Package ID. It will look like:
- `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### 3. Set the Environment Variable

Create a `.env` file in the root of your project (if it doesn't exist) and add:

```env
VITE_SUI_PACKAGE_ID=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef
VITE_SUI_NETWORK=testnet
```

Replace `0x1234567890abcdef...` with your actual package ID.

### 4. Verify the Setup

The package ID is used in `src/lib/sui.ts`:

```typescript
export const PACKAGE_ID = import.meta.env.VITE_SUI_PACKAGE_ID || '0x0';
```

If the package ID is not set or is `'0x0'`, you'll get an error when trying to use contract functions:
- `"VITE_SUI_PACKAGE_ID is not set"`

### 5. Restart Your Development Server

After setting the environment variable, restart your dev server:

```bash
npm run dev
```

## Important Notes

### Network Configuration

Make sure `VITE_SUI_NETWORK` matches the network where you deployed:
- `testnet` - Sui testnet
- `devnet` - Sui devnet  
- `mainnet` - Sui mainnet
- `localnet` - Local development network

### Package ID Format

- Package IDs are 32-byte hex strings (64 hex characters)
- They always start with `0x`
- Example: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

### Finding Your Package ID Later

If you need to find your package ID again:

1. **From Sui Explorer**: 
   - Go to https://suiexplorer.com (or the explorer for your network)
   - Search for your transaction hash from deployment
   - Look for the "Published" object

2. **From Sui CLI**:
   ```bash
   sui client objects
   ```
   Look for objects with type `0x2::package::UpgradeCap`

3. **From Transaction History**:
   ```bash
   sui client transactions
   ```
   Find your publish transaction and check the object IDs

## Additional Object IDs

After deployment, you may also need these object IDs (set in `.env`):

- `VITE_ORGANIZER_CAP_OBJECT_ID` - OrganizerCap object ID (if you have one)
- `VITE_DEVELOPER_TREASURY_OBJECT_ID` - DeveloperTreasury object ID
- `VITE_VERIFIER_CAP_OBJECT_ID` - VerifierCap object ID (shared object)

These are created during contract initialization. You can find them in the deployment transaction output.

## Troubleshooting

### Error: "VITE_SUI_PACKAGE_ID is not set"

- Make sure you have a `.env` file in the project root
- Verify the variable name is exactly `VITE_SUI_PACKAGE_ID`
- Restart your dev server after adding the variable
- Check that the value doesn't have extra spaces or quotes

### Error: "Invalid package ID"

- Verify the package ID is a valid 64-character hex string starting with `0x`
- Make sure the package is deployed to the network specified in `VITE_SUI_NETWORK`
- Check that the package ID matches the network (testnet vs mainnet)

### Contract Functions Not Working

- Verify the package ID is correct
- Check that the network matches (`VITE_SUI_NETWORK`)
- Ensure your wallet is connected to the same network
- Check the browser console for detailed error messages

## Example .env File

```env
# Supabase Configuration
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key

# Sui Configuration
VITE_SUI_NETWORK=testnet
VITE_SUI_PACKAGE_ID=0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef

# Optional: Additional Object IDs
VITE_ORGANIZER_CAP_OBJECT_ID=0x...
VITE_DEVELOPER_TREASURY_OBJECT_ID=0x...
VITE_VERIFIER_CAP_OBJECT_ID=0x...
```

## Next Steps

After setting up the package ID:

1. Test contract interaction by minting an achievement
2. Verify the package ID is being used correctly in the console
3. Check that transactions are being submitted to the correct network
4. Update your production `.env` with the same package ID when deploying

