# Achievement Wallet

A Progressive Web App (PWA) for students to capture, verify, and showcase their achievements in a trusted and decentralized way using Sui blockchain.

## Features

- 🎯 **Achievement Capture & Verification** - Upload achievements with GPS and timestamp
- 👥 **Peer Presence Verification** - Friends can verify achievements for you
- 💼 **Digital Portfolio** - Showcase verified achievements
- 🏆 **Points & Rewards System** - Earn skill points and unlock levels
- 👥 **Social Features** - Feed, friends, comments, and reactions
- 🔐 **Sui Blockchain Integration** - On-chain verification using Sui Move smart contracts
- 💼 **Slush Wallet Integration** - Connect and authenticate with Slush Wallet

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: TailwindCSS + shadcn/ui + Framer Motion
- **Backend**: Supabase (PostgreSQL + Storage)
- **Blockchain**: Sui Move smart contracts
- **Wallet**: Slush Wallet
- **PWA**: Service Worker + Manifest

## Setup Instructions

### 1. Install Dependencies

```bash
npm install
```

### 2. Set Up Supabase

1. Create a new project at [supabase.com](https://supabase.com)
2. Copy your project URL and anon key
3. Create a `.env` file:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
VITE_SUI_NETWORK=testnet
VITE_SUI_PACKAGE_ID=your_package_id_after_deployment
```

### 3. Run Database Migrations

The database schema is in `supabase/migrations/20240101000000_initial_schema.sql`.

You can run migrations in two ways:

**Option A: Via Supabase Dashboard (Recommended)**
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Copy and paste the SQL from `supabase/migrations/20240101000000_initial_schema.sql`
4. Execute the SQL

**Option B: Via Migration Script**
```bash
npm run migrate
```

### 4. Set Up Sui Move Contracts

1. Install Sui CLI:
```bash
cargo install --locked --git https://github.com/MystenLabs/sui.git --branch main sui
```

2. Navigate to the Sui contracts directory:
```bash
cd sui
```

3. Build the contracts:
```bash
sui move build
```

4. Deploy to testnet:
```bash
sui client publish --gas-budget 10000000
```

5. Copy the published package ID and update `VITE_SUI_PACKAGE_ID` in your `.env` file.

### 5. Set Up Slush Wallet Integration

The app includes placeholder functions for Slush Wallet integration. You'll need to:

1. Install the Slush Wallet SDK (when available)
2. Update `src/lib/sui.ts` with the actual Slush Wallet connection logic

### 6. Run Development Server

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Project Structure

```
ygg-app/
├── src/
│   ├── components/       # React components
│   │   ├── ui/          # shadcn/ui components
│   │   └── ...          # Custom components
│   ├── contexts/        # React contexts (Auth, etc.)
│   ├── lib/            # Utilities and API clients
│   ├── pages/          # Page components
│   ├── types/          # TypeScript types
│   └── main.tsx        # Entry point
├── supabase/
│   └── migrations/     # Database migrations
├── sui/
│   └── contracts/      # Sui Move smart contracts
└── public/             # Static assets and PWA icons
```

## Pages

- `/` - Landing page
- `/feed` - Activity feed showing friends' achievements
- `/upload` - Upload new achievement
- `/profile/:id` - User profile and portfolio
- `/verify` - Organizer dashboard to verify achievements
- `/rewards` - Skill points and levels
- `/settings` - Profile and wallet settings

## PWA Features

The app is configured as a Progressive Web App with:
- Service worker for offline support
- App manifest for installability
- Caching strategy for assets and API calls

## Development Notes

- The app uses Supabase for off-chain data storage
- Achievements are verified on-chain using Sui Move contracts
- GPS location is captured automatically when uploading achievements
- Peer verification allows friends to verify achievements for each other
- Points are awarded when achievements are verified

## License

MIT
