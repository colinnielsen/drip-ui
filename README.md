# Drip UI

A mobile, onchain coffee ordering platform that rewards users, farmers, and coffee shops.

> "But why crypto? Why USDC?"

- Eliminate 3.5% credit card fees ❌
- Universal loyalty program. $DRIP token is _actually_ cash in your pocket 💵
- Tip a coffee grower, or _drip_ them your saved credit card fees 👨‍🌾

## Architecture Video

[Walkthrough video 🔗](https://www.loom.com/share/12ff3ea9625f43d580f18ae0e89a110d?sid=433837d6-5371-4204-879c-c1b94077654e)

[![architecture video](https://github.com/user-attachments/assets/af4ea6ac-924f-4fce-b835-9c53af3bffc4)](https://www.loom.com/share/12ff3ea9625f43d580f18ae0e89a110d?sid=433837d6-5371-4204-879c-c1b94077654e)

## Walkthrough Video

[![walkthrough video](https://markdown-videos-api.jorgenkh.no/youtube/8GKjd1fyFA8.gif?width=480&height=320&duration=500)](https://youtu.be/8GKjd1fyFA8)

## 🚀 Features

- **Shop Discovery**: Find nearby coffee shops on an interactive map
- **Digital Menu**: Browse items, customize orders, and apply discounts
- **Crypto Payments**: User-friendly USDC payments on Base
- **Farmer Support**: Direct rewards to coffee growers
- **Order Tracking**: Track order status in real-time

## 💸 Payment Flow

The Drip platform uses USDC for payments:

1. **Lower Fees**: Eliminates the 3-3.5% credit card processing fees
2. **Direct Rewards**: Enables direct microtips to coffee growers
3. **Transparent Transactions**: All payments are verifiable onchain

### Payment Process

1. User connects wallet or uses embedded Privy wallet
2. Order total is calculated in USDC
3. User approves transaction
4. Payment is processed on Base
5. Coffee shop receives payment notification
6. Optional: Portion of savings automatically "drips" to farmer

## 🌱 Farmer Reward System

Drip connects coffee drinkers directly with the farmers who grow their beans:

1. **Direct Tipping**: Users can send tips directly to verified farmers
2. **Fee Sharing**: Portion of saved credit card fees can be directed to farmers
3. **Transparent Impact**: All contributions are trackable on-chain

## 🔧 Tech Stack

- **Framework**: Next.js 14 (Pages Router)
- **Styling**: Tailwind CSS, Shadcn UI
- **State Management**: React Query
- **Type Safety**: TypeScript, Effect Schema
- **Web3**: Viem, Privy, Slice
- **Payments**: USDC, Square integration
- **Database**: Vercel Postgres

## 📋 Project Structure

```markdown
src/
├── components/ # UI components
├── data-model/ # Domain models and business logic
├── lib/ # Utility functions
├── pages/ # Next.js page components
├── queries/ # React Query hooks
├── services/ # Backend services
└── styles/ # Global styles
```

## 🏗️ Architecture

- **Domain-Driven Design**: Business logic isolated in data-model directory
- **Functional Programming**: Using Effect.js for rust-like type-safe pipelines
- **Branded Types**: For strong typing of IDs and special strings
- **React Query**: For data fetching and state management

## 🔄 App Lifecycle

1. Merchant syncs their shop, pulling in store data
2. User lands on the page is identified by a JWT in their cookies
3. User selects a shop and browses the menu
4. User adds items to cart (stored in local storage)
5. User places an order via `/order/pay`
6. Payment is executed on-chain, and the order is sent to an external POS service provider
7. Barista marks the order as complete
8. External order is synced with Drip, and order is now complete
9. User can view order history

## 🚀 Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- Vercel account (for deployment)
- Square developer account (for payment processing)
- Slice account (for on-chain POS)

### Installation

```bash
# Clone the repository
git clone https://github.com/your-username/drip-ui.git
cd drip-ui

# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env.local
# Edit .env.local with your API keys and configuration

# Start the development server
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to see the application.

## 📚 Resources

- [Effect.js Documentation](https://effect.website/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Privy Auth Documentation](https://docs.privy.io/)
- [Slice Kit Documentation](https://docs.slice.so/)

## 📝 License

© 2024 Drip Software LLC. All rights reserved.
