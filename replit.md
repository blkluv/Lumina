# Lumina

## Overview
Lumina is a Web3 social media platform designed to integrate features from Facebook and TikTok on the Arbitrum One blockchain. It enables users to create and share short-form video, text, and image content, earn LUM token rewards for engagement, send/receive tips, join groups, and follow creators. The platform aims to decentralize social interactions and monetize user-generated content within a Web3 ecosystem, while uplifting humanity through righteous, moral, noble, religious, ethical, educational, financial, technological, scientific, and crypto content.

## User Preferences
I want the agent to use Typescript for all new code. I like functional programming paradigms where they make sense. I want the agent to prioritize security and best practices in smart contract development. I prefer iterative development with clear, small pull requests. Before making significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all user-facing changes are responsive and mobile-friendly.

## System Architecture

### UI/UX Decisions
The platform features a dark emerald theme with glowing accents, using HSL 160 84% 45% as the primary color. Dark mode is default. `shadcn/ui` is used for components, alongside custom `PostCard` and `VideoCard` components. All designs are responsive, including a mobile navigation.

### Technical Implementations
- **Frontend**: React with TypeScript, Vite, TailwindCSS, shadcn/ui. Key pages include Feed, ForYou, Profile, Groups, and various Web3 features. Authentication, wallet connection, and theme state are managed via React contexts.
- **Backend**: Express.js with TypeScript, handling API routing, database operations, and object storage.
- **Database**: PostgreSQL with Drizzle ORM, featuring a comprehensive schema for users, posts, comments, likes, groups, notifications, rewards, messages, NFTs, governance, staking, and moderation.
- **Storage**: Replit Object Storage (Google Cloud Storage) for media files.
- **Web3 Integration**: Arbitrum One (Chain ID 42161) is the primary blockchain. Integrates LUM token for rewards and tipping. MetaMask is supported for wallet connection with automatic network switching and signature verification for wallet binding.
- **Authentication**: Email/password with session-based authentication, complemented by Two-Factor Authentication capabilities.
- **Content Moderation**: An AI-powered system (using OpenAI via Replit AI Integration) is implemented to analyze text and images for violations (nudity, violence, hate speech, etc.). It supports a 3-strike warning policy, automated flagging, and an admin review panel.

### Feature Specifications
- **Core Social Features**: User profiles, content feeds (friends and algorithmic), posting (text, image, video), comments, likes, follows, direct messaging with real-time updates (WebSocket-based).
- **Community Features**: Interest-based groups with create/join/leave functionality, member management, role-based permissions (admin, moderator, member), group settings, and group feeds.
- **Web3 Features**: LUM token integration (rewards, tipping, staking), NFT gallery and marketplace, DAO governance with proposals and wallet signature-verified voting, rewards claiming and point conversion to LUM.
- **Creator Tools**: Analytics dashboard for creators, referral program.
- **Moderation & Admin**: Comprehensive admin dashboard for user management (ban/unban), content moderation with AI-powered screening, platform settings, and audit logging. Includes a content moderation queue, violation tracking with 3-strike policy, appeals workflow, and community guidelines management.
- **Messaging**: Real-time direct messaging with WebSocket support for instant message delivery, typing indicators, and read receipts. Messages are moderated for inappropriate content before sending.
- **Groups**: Full group management including creation dialog, category filtering, member list with role badges, group settings for admins, moderator promotion/demotion, and member removal capabilities.

## External Dependencies

- **Google Analytics**: For tracking page views and custom events (`VITE_GA_MEASUREMENT_ID`).
- **SendGrid**: For bulk email campaigns and admin notifications (`SENDGRID_API_KEY`).
- **Resend**: For transactional emails (welcome, password reset, notifications) (`RESEND_API_KEY`).
- **Twilio**: For SMS notifications and alerts (`TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`).
- **Stripe**: For payment processing, donations, tips, and premium feature subscriptions (`STRIPE_SECRET_KEY`, `STRIPE_PUBLISHABLE_KEY`).
- **OpenAI (via Replit AI Integration)**: Used by the content moderation service for analyzing text and images.
- **Mux**: For live video streaming with RTMP ingest and HLS delivery (`MUX_TOKEN_ID`, `MUX_TOKEN_SECRET`). Features include:
  - RTMP ingest for broadcasting via OBS, Streamlabs, or any RTMP-compatible software
  - HLS adaptive bitrate streaming for viewers via custom HLSVideoPlayer component
  - Automatic stream key and playback ID generation
  - Low-latency mode with 4-7 second delay
  - Automatic VOD recording of streams
  - Quality selection and fullscreen controls
  - Integration with stream chat and tipping
- **Cloudflare Stream** (Optional): For browser-based WebRTC streaming (`CLOUDFLARE_ACCOUNT_ID`, `CLOUDFLARE_STREAM_API_TOKEN`). Features include:
  - WHIP protocol for browser-to-server streaming (no software required)
  - WHEP protocol for WebRTC-based playback
  - Sub-second latency for interactive streams
  - Automatic camera/microphone selection in browser
  - Screen sharing support
  - Fallback option when users can't use OBS/Streamlabs

## Smart Contract Integration

### Integrated Contracts (6 Total)
All contracts are deployed on Arbitrum One (Chain ID: 42161). Source: https://github.com/AxiomProtocol/AXIOM

| Contract | Address | Purpose |
|----------|---------|---------|
| AxiomV2 (AXM Token) | `0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D` | Token transfers, voting delegation, balance queries |
| AxiomStakingAndEmissionsHub | `0x8b99cDeefB3116cA87AF24A9E10D5580dA07B885` | Staking, lock periods, reward claiming |
| CommunitySocialHub | `0xC2f82eD5C2585B525E01F19eA5C28811AB43aF49` | Creator tipping, content rewards |
| GamificationHub | `0x7F455b4614E05820AAD52067Ef223f30b1936f93` | XP, levels, daily check-ins, quests |
| MarketsAndListingsHub | `0x98a59D4fb5Fa974879E9F043C3174Ae82Fb9D830` | NFT marketplace listings and trading |
| CitizenReputationOracle | `0x649a0F1bd204b6f23A92f1CDbb2F1838D691B643` | Reputation scores, badges, tiers |

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

## Documentation

- **WHITEPAPER.md** - Comprehensive professional whitepaper covering platform vision, architecture, tokenomics, smart contracts, governance, and roadmap

## Recent Changes
- **Dual-Provider Streaming Architecture** (December 2025): Added support for both professional RTMP streaming (via Mux) and browser-based WebRTC streaming (via Cloudflare Stream). Users can choose between:
  - **OBS/Streamlabs (Professional)**: Best quality, RTMP ingest via Mux with HLS delivery, one-click software auto-configuration
  - **Browser (Quick Start)**: Go live instantly using webcam/microphone, WHIP protocol via Cloudflare Stream with WHEP playback
  - Key new files: `server/services/cloudflare-stream.ts`, `client/src/components/WHIPStreamPublisher.tsx`, `client/src/components/WHEPVideoPlayer.tsx`
  - Database extended with `cloudflare_input_id`, `cloudflare_whip_url`, `cloudflare_whep_url` columns
  - API endpoint `/api/streams/providers` to check available streaming methods
- **Mux Live Streaming Integration** (December 2025): Replaced Daily.co with Mux for TikTok-style custom streaming. Features include RTMP ingest for broadcasting via OBS/Streamlabs, HLS adaptive bitrate streaming for viewers, custom HLSVideoPlayer component with quality selection and fullscreen controls, low-latency mode, automatic VOD recording, host-only broadcast settings display (RTMP URL + stream key), and seamless integration with chat and tipping. Key files: `server/services/mux.ts`, `client/src/components/HLSVideoPlayer.tsx`, `client/src/pages/LiveStreamViewer.tsx`.
- **Treasury Dashboard Implementation** (December 2025): Added comprehensive /treasury page with live blockchain balance tracking, USD price conversion via CoinGecko API (with 60-second server-side caching), token distribution visualization, contract addresses with copy functionality, and network information display. Treasury preview section added to landing page.
- **Price Oracle Integration**: Added /api/price/axm and /api/price/eth endpoints with caching to prevent CoinGecko rate limiting. usePriceOracle hook provides getAXMPrice, getAXMPriceData, and getETHPrice functions with proper fallback handling.
- **Whitepaper Created**: Professional whitepaper document covering all aspects of the Lumina platform (December 2025)
- **Landing Page UI Fix**: Fixed positioning of "A Social Network With Purpose" banner to display centered below the Lumina title on all screen sizes
- **Smart Contract Integration**: Integrated 6 AXIOM Protocol contracts from GitHub repository with proper ethers.js implementation for on-chain interactions
- **Rebranding from AXIOM to Lumina**: Complete platform rebrand including:
  - Updated all UI references (Header, Landing, Auth pages, Governance, Messaging, Groups, Rewards, NFTs, Staking, Admin panel)
  - Changed token ticker references from AXM to LUM where appropriate in user-facing text
  - Updated localStorage theme key from "axiom-theme" to "lumina-theme"
  - Updated email templates, SMS templates, and content moderation prompts
  - Updated branding defaults in server routes
  - Changed logo letter from "A" to "L" across components
