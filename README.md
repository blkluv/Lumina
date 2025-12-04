# Lumina

<div align="center">

![Lumina Banner](https://img.shields.io/badge/Web3-Social%20Platform-emerald?style=for-the-badge&logo=ethereum)
[![Arbitrum](https://img.shields.io/badge/Arbitrum-One-blue?style=for-the-badge&logo=arbitrum)](https://arbitrum.io)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18-61DAFB?style=for-the-badge&logo=react)](https://reactjs.org/)

**The Web3 Social Platform Where Creators Own Their Content**

[Live Demo](https://lumina.app) · [Documentation](#documentation) · [Smart Contracts](https://github.com/AxiomProtocol/AXIOM)

</div>

---

## Overview

Lumina is a decentralized social media platform built on Arbitrum One, combining the best features of Facebook and TikTok with Web3 monetization. Creators earn AXM tokens for engagement, receive tips directly to their wallets, and truly own their content and audience.

### Why Lumina?

- **Earn While You Create** - Get rewarded with AXM tokens for every post, like, and share
- **Direct Monetization** - Receive tips and donations straight to your wallet
- **True Ownership** - Your content, your audience, your data
- **Community Governance** - Vote on platform decisions through DAO proposals
- **No Middlemen** - Decentralized infrastructure means no corporate overlords

---

## Features

### Core Social
- 📱 Short-form video, image, and text posts
- 💬 Real-time messaging with WebSocket support
- 👥 Follow creators and build your network
- 🏘️ Interest-based groups and communities
- 📊 Creator analytics dashboard

### Web3 Integration
- 💰 **AXM Token Rewards** - Earn for engagement and content creation
- 💸 **Crypto Tipping** - Send and receive tips instantly
- 🎨 **NFT Gallery** - Showcase and trade your digital collectibles
- 🗳️ **DAO Governance** - Participate in platform decisions
- 📈 **Staking** - Lock tokens for enhanced rewards

### The Forge (Learning Platform)
- 🔥 15 comprehensive courses across 4 tracks
- 📚 120+ detailed lessons with practical examples
- 🏆 NFT certifications on completion
- 🎮 XP system and achievement badges

### Smart Contract Suite
Powered by the [AXIOM Protocol](https://github.com/AxiomProtocol/AXIOM):

| Contract | Purpose |
|----------|---------|
| AxiomV2 (AXM) | Platform token |
| StakingHub | Token staking & rewards |
| CommunitySocialHub | Tipping & content rewards |
| GamificationHub | XP, levels, quests |
| MarketsHub | NFT marketplace |
| ReputationOracle | On-chain reputation |
| AcademyHub | Course certifications |
| ExchangeHub | DEX & liquidity |
| DePINNodeSales | Node purchases |

---

## Tech Stack

### Frontend
- **React 18** with TypeScript
- **Vite** for blazing fast builds
- **TailwindCSS** + **shadcn/ui** for styling
- **TanStack Query** for data fetching
- **ethers.js v6** for Web3 interactions
- **Framer Motion** for animations

### Backend
- **Express.js** with TypeScript
- **PostgreSQL** with Drizzle ORM
- **WebSocket** for real-time features
- **Passport.js** for authentication

### Web3
- **Arbitrum One** (Chain ID: 42161)
- **@arbitrum/sdk** for L1/L2 bridging
- **MetaMask** integration

### Infrastructure
- **Mux** for video streaming
- **Replit Object Storage** for media
- **OpenAI** for content moderation

---

## Getting Started

### Prerequisites
- Node.js 18+
- PostgreSQL database
- MetaMask wallet

### Installation

```bash
# Clone the repository
git clone https://github.com/AxiomProtocol/Lumina.git
cd Lumina

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Push database schema
npm run db:push

# Start development server
npm run dev
```

### Environment Variables

```env
DATABASE_URL=postgresql://...
SESSION_SECRET=your-session-secret
VITE_GA_MEASUREMENT_ID=G-XXXXXXXX

# Optional integrations
MUX_TOKEN_ID=your-mux-token
MUX_TOKEN_SECRET=your-mux-secret
STRIPE_SECRET_KEY=your-stripe-key
```

---

## Project Structure

```
├── client/                 # React frontend
│   ├── src/
│   │   ├── components/    # Reusable UI components
│   │   ├── pages/         # Route pages
│   │   ├── lib/           # Utilities & Web3 hooks
│   │   ├── data/          # Static data (courses, etc.)
│   │   └── hooks/         # Custom React hooks
├── server/                 # Express backend
│   ├── routes.ts          # API endpoints
│   ├── storage.ts         # Database interface
│   └── index.ts           # Server entry
├── shared/                 # Shared types
│   └── schema.ts          # Drizzle schema
└── README.md
```

---

## Smart Contract Addresses

All contracts deployed on **Arbitrum One**:

```
AXM Token:           0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D
Staking Hub:         0x8b99cDeefB3116cA87AF24A9E10D5580dA07B885
Social Hub:          0xC2f82eD5C2585B525E01F19eA5C28811AB43aF49
Gamification Hub:    0x7F455b4614E05820AAD52067Ef223f30b1936f93
Marketplace Hub:     0x98a59D4fb5Fa974879E9F043C3174Ae82Fb9D830
Reputation Oracle:   0x649a0F1bd204b6f23A92f1CDbb2F1838D691B643
Academy Hub:         0x30667931BEe54a58B76D387D086A975aB37206F4
Exchange Hub:        0xF660d260a0bBC690a8ab0f1e6A41049FC919A34D
DePIN Node Sales:    0x876951CaE4Ad48bdBfba547Ef4316Db576A9Edbd
```

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

---

## Security

- Report vulnerabilities to security@axiomprotocol.io
- Bug bounty program coming soon
- See [SECURITY.md](SECURITY.md) for details

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Links

- 🌐 [Website](https://lumina.app)
- 📖 [Documentation](https://docs.axiomprotocol.io)
- 🐦 [Twitter](https://twitter.com/AxiomProtocol)
- 💬 [Discord](https://discord.gg/axiom)
- 📜 [Smart Contracts](https://github.com/AxiomProtocol/AXIOM)

---

<div align="center">

**Built with ❤️ by the AXIOM Protocol Team**

*Empowering creators in the decentralized future*

</div>
