# Organizer Cap Setup Guide

## Problem
You're seeing the error: "Organizer Cap Object ID is not configured. Please contact the administrator."

## Solution

The system now **automatically fetches** the OrganizerCap for each organizer from their wallet. However, you need to ensure:

### 1. Register Organizers On-Chain

When an organizer applies and you approve them in the Admin Panel:

1. Go to **Admin Panel** → **Applications** tab
2. Click **"Approve & Register"** for the organizer
3. This will:
   - Approve them in the database
   - Register them on-chain (creates their OrganizerCap)
   - Show you the created OrganizerCap Object ID

**Important:** The organizer must have a valid wallet address in their profile for on-chain registration to work.

### 2. Developer Treasury Setup (One-Time)

The Developer Treasury is created when the smart contract is deployed. You need to:

1. **Find the Treasury Object ID:**
   - After deploying the contract, check the transaction output
   - Look for the `DeveloperTreasury` object that was created
   - Or query your deployer wallet's objects using Sui Explorer

2. **Set Environment Variable:**
   - Add to your `.env` file:
     ```
     VITE_DEVELOPER_TREASURY_OBJECT_ID=0x...your_treasury_object_id...
     ```
   - Restart your development server

### 3. How It Works Now

- **OrganizerCap**: Automatically fetched from the organizer's wallet when they view their event
- **DeveloperTreasury**: Fetched from environment variable or deployer's wallet

### 4. Troubleshooting

**If OrganizerCap is not found:**
- Make sure the organizer has been registered on-chain via Admin Panel
- Verify the organizer's wallet address is correct in their profile
- Check that the organizer's wallet actually owns an OrganizerCap object (use Sui Explorer)

**If DeveloperTreasury is not found:**
- Set `VITE_DEVELOPER_TREASURY_OBJECT_ID` in your `.env` file
- Or ensure the deployer address has the treasury object

### 5. Manual Registration (If Needed)

If automatic registration fails, you can manually register an organizer:

1. Connect your admin wallet (contract deployer)
2. Call the `register_organizer` function with the organizer's wallet address
3. Note the created OrganizerCap Object ID
4. The organizer can now use the system (their cap will be auto-detected)

## Quick Checklist

- [ ] Contract deployed
- [ ] DeveloperTreasury Object ID added to `.env`
- [ ] Organizers approved via Admin Panel
- [ ] Organizers have valid wallet addresses
- [ ] Organizers refreshed the event page after registration

