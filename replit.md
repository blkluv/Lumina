# Lumina

## Overview
Lumina is a Web3 social media platform on the Arbitrum One blockchain, combining features of Facebook and TikTok. It allows users to create and share short-form video, text, and image content, earning AXM token rewards for engagement, sending/receiving tips, joining groups, and following creators. The platform aims to decentralize social interactions, monetize user-generated content, and promote positive content across various domains like education, finance, and technology within a Web3 ecosystem.

## User Preferences
I want the agent to use Typescript for all new code. I like functional programming paradigms where they make sense. I want the agent to prioritize security and best practices in smart contract development. I prefer iterative development with clear, small pull requests. Before making significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all user-facing changes are responsive and mobile-friendly.

## System Architecture

### UI/UX Decisions
The platform utilizes a dark emerald theme with glowing accents (HSL 160 84% 45%) as the primary color, with dark mode as default. `shadcn/ui` is used for components, augmented by custom `PostCard` and `VideoCard` components. All designs are responsive and include a mobile navigation.

### Technical Implementations
- **Frontend**: Built with React, TypeScript, Vite, TailwindCSS, and `shadcn/ui`. Key pages include Feed, ForYou, Profile, Groups, and various Web3 functionalities. Authentication, wallet connection, and theme state are managed via React contexts.
- **Backend**: Implemented with Express.js and TypeScript for API routing, database interactions, and object storage.
- **Database**: PostgreSQL with Drizzle ORM, supporting schemas for users, posts, comments, likes, groups, notifications, rewards, messages, NFTs, governance, staking, and moderation.
- **Storage**: Replit Object Storage (Google Cloud Storage) for media files.
- **Web3 Integration**: Operates on Arbitrum One (Chain ID 42161) using the AXM token for rewards and tipping. MetaMask is integrated for wallet connection, including automatic network switching and signature verification for wallet binding.
- **Authentication**: Features email/password authentication with sessions and Two-Factor Authentication.
- **Content Moderation**: An AI-powered system (via OpenAI through Replit AI Integration) analyzes text and images for violations, enforcing a 3-strike policy, automated flagging, and an admin review panel.

### Feature Specifications
- **Core Social Features**: User profiles, content feeds (friends and algorithmic), various content posting types (text, image, video), commenting, liking, following, and real-time direct messaging.
- **Community Features**: Interest-based groups with creation, joining, and leaving functionalities, member management, role-based permissions, and group-specific feeds.
- **Web3 Features**: AXM token integration (rewards, tipping, staking), NFT gallery and marketplace, DAO governance with proposals and wallet signature-verified voting, and rewards claiming with point conversion to AXM.
- **Creator Tools**: Analytics dashboard for creators and a referral program.
- **Moderation & Admin**: An admin dashboard for user management, AI-powered content moderation, platform settings, and audit logging. Includes a content moderation queue, violation tracking, appeals workflow, and community guidelines management.
- **Messaging**: Real-time direct messaging with WebSocket support, including typing indicators and read receipts, with content moderation before sending.
- **Groups**: Comprehensive group management, including creation, category filtering, member lists with role badges, admin settings, and moderator/member management.

## External Dependencies

- **Google Analytics**: For tracking user engagement.
- **SendGrid**: For bulk email campaigns and admin notifications.
- **Resend**: For transactional emails (e.g., welcome, password reset).
- **Twilio**: For SMS notifications and alerts.
- **Stripe**: For payment processing, donations, tips, and premium subscriptions.
- **OpenAI (via Replit AI Integration)**: Used for AI-powered content moderation.
- **Mux**: For live video streaming with RTMP ingest and HLS delivery, offering features like automatic stream key generation, low-latency mode, and VOD recording.
- **Cloudflare Stream**: For browser-based WebRTC streaming (WHIP for ingest, WHEP for playback), enabling sub-second latency and screen sharing.

## Smart Contract Integration

### Integrated Contracts (9 Total)
All contracts are deployed on Arbitrum One (Chain ID: 42161). Source: https://github.com/AxiomProtocol/AXIOM

| Contract | Address | Purpose |
|----------|---------|---------|
| AxiomV2 (AXM Token) | `0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D` | Token transfers, voting delegation, balance queries |
| AxiomStakingAndEmissionsHub | `0x8b99cDeefB3116cA87AF24A9E10D5580dA07B885` | Staking, lock periods, reward claiming |
| CommunitySocialHub | `0xC2f82eD5C2585B525E01F19eA5C28811AB43aF49` | Creator tipping, content rewards |
| GamificationHub | `0x7F455b4614E05820AAD52067Ef223f30b1936f93` | XP, levels, daily check-ins, quests |
| MarketsAndListingsHub | `0x98a59D4fb5Fa974879E9F043C3174Ae82Fb9D830` | NFT marketplace listings and trading |
| CitizenReputationOracle | `0x649a0F1bd204b6f23A92f1CDbb2F1838D691B643` | Reputation scores, badges, tiers |
| AxiomAcademyHub | `0x30667931BEe54a58B76D387D086A975aB37206F4` | Educational courses, certifications, instructor management |
| AxiomExchangeHub | `0xF660d260a0bBC690a8ab0f1e6A41049FC919A34D` | DEX with liquidity pools, token swaps, 0.3% fee |
| DePINNodeSales | `0x876951CaE4Ad48bdBfba547Ef4316Db576A9Edbd` | DePIN node purchases with ETH/AXM, 15% AXM discount |

### Contract Files
- `client/src/lib/contracts.ts` - Contract addresses, ABIs in ethers.js human-readable format, helper functions
- `client/src/lib/useContracts.ts` - React hooks for contract interactions using ethers.js
- `client/src/lib/web3Config.ts` - Network configuration importing from contracts.ts

### React Hooks Available
- `useTokenContract()` - Balance, transfer, approve, delegate, getVotes
- `useStakingContract()` - Stake, unstake, claimRewards, getTotalStaked, getStakingPositions
- `useSocialContract()` - tipCreator, claimRewards, getPendingRewards, getTotalTipsReceived
- `useGamificationContract()` - getLevel, getXP, getCurrentStreak, checkInDaily, convertPointsToTokens
- `useMarketplaceContract()` - createListing, buyListing, cancelListing, getListing, getActiveListings
- `useReputationContract()` - getReputationScore, getBadges, hasBadge, getTier
- `useAcademyContract()` - getTotalCourses, getCourse, enrollInCourse, completeLesson, getCertification
- `useExchangeContract()` - getTotalPools, getPool, swap, addLiquidity, removeLiquidity, getAmountOut
- `useDePINContract()` - getAllTiers, purchaseNodeWithETH, purchaseNodeWithAXM, getUserPurchases

## Arbitrum Bridge Integration

### Overview
The platform includes a full-featured Arbitrum bridge (`/bridge`) using the official `@arbitrum/sdk` v4.0.4 for bridging ETH and AXM tokens between Ethereum L1 and Arbitrum L2.

### Architecture Notes
The bridge uses a hybrid approach due to ethers.js v5/v6 compatibility:
- **Bridging Operations**: Direct contract calls (Inbox, ArbSys, Gateway Router) using ethers v6
- **Status Tracking**: SDK classes (ParentTransactionReceipt, ChildTransactionReceipt, message classes) for deterministic status
- **Claim/Redeem**: SDK message classes for L1 claims and L2 retryable redemption

This approach was chosen because @arbitrum/sdk v4 is designed for ethers v5, while this project uses ethers v6. Full EthBridger/Erc20Bridger adoption will be revisited when SDK v5 with native ethers v6 support is released.

### Bridge Features
- **ETH Deposits**: L1 → L2 transfers (~10-15 min)
- **ETH Withdrawals**: L2 → L1 transfers (~7 days challenge period)
- **AXM Token Deposits**: ERC-20 L1 → L2 via Gateway Router
- **AXM Token Withdrawals**: ERC-20 L2 → L1 via Gateway Router
- **Gas Estimation**: Real-time gas cost breakdown (L1/L2 execution, data costs)
- **Transaction Tracking**: Persistent localStorage-based transaction history
- **Cross-Chain Message Status**: Real-time status tracking via ParentToChildMessage/ChildToParentMessage
- **Withdrawal Claiming**: Claim funds on L1 after 7-day challenge period
- **Retryable Ticket Redemption**: Redeem failed L1→L2 deposits on L2

### Bridge Hook: `useArbitrumBridge()`
Key functions:
- `depositETH(amount)`, `withdrawETH(amount)` - Native ETH bridging
- `depositToken(address, amount)`, `withdrawToken(address, amount)` - ERC-20 bridging
- `claimPendingWithdrawal(l2TxHash)` - Claim ready withdrawals on L1
- `redeemFailedDeposit(l1TxHash)` - Redeem failed retryable tickets on L2
- `checkMessageStatus(txHash, type)` - Check cross-chain message status
- `updateTransactionStatuses()` - Refresh all pending transaction statuses

### Bridge Files
- `client/src/lib/arbitrumBridge.ts` - SDK integration, message tracking, claim/redeem functions
- `client/src/lib/useArbitrumBridge.ts` - React hook for bridge operations
- `client/src/pages/Bridge.tsx` - Bridge UI with transaction tracker

### Bridge Contracts
| Contract | Address |
|----------|---------|
| L1 Gateway Router | `0x72Ce9c846789fdB6fC1f34aC4AD25Dd9ef7031ef` |
| L2 Gateway Router | `0x5288c571Fd7aD117beA99bF60FE0846C4E84F933` |
| Inbox | `0x4Dbd4fc535Ac27206064B68FfCf827b0A60BAB3f` |
| Outbox | `0x0B9857ae2D4A3DBe74ffE1d7DF045bb7F96E4840` |
| ArbSys (L2) | `0x0000000000000000000000000000000000000064` |

## Recent Changes
- **Arbitrum SDK Integration Upgrade** (December 2025): Enhanced bridge with official @arbitrum/sdk v4.0.4:
  - Upgraded from direct contract calls to SDK classes (EthBridger, Erc20Bridger)
  - Added cross-chain message status tracking (ParentToChildMessage, ChildToParentMessage)
  - Added withdrawal claiming after 7-day challenge period
  - Added retryable ticket redemption for failed deposits
  - Fixed token naming from LUM to AXM throughout bridge code
  - Enhanced transaction tracker UI with claim/redeem buttons
  - Key files: `client/src/lib/arbitrumBridge.ts`, `client/src/lib/useArbitrumBridge.ts`, `client/src/pages/Bridge.tsx`

- **AXIOM Protocol Contract Expansion** (December 2025): Expanded smart contract integration from 6 to 9 contracts, adding:
  - **AxiomAcademyHub** (`/academy`): Educational platform with on-chain courses, enrollment tracking, lesson completion, and NFT certifications
  - **AxiomExchangeHub** (`/exchange`): Decentralized exchange with token swap interface, liquidity pool management, 0.3% swap fee, and slippage settings
  - **DePINNodeSales** (`/nodes`): DePIN node marketplace with tiered node selection, ETH/AXM payment options, 15% AXM discount, and purchase history
  - New React hooks: `useAcademyContract()`, `useExchangeContract()`, `useDePINContract()`
  - Added navigation links in sidebar for Academy, Exchange, and DePIN Nodes
  - Key files: `client/src/pages/Academy.tsx`, `client/src/pages/Exchange.tsx`, `client/src/pages/Nodes.tsx`
