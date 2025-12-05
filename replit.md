# Lumina

## Overview
Lumina is a Web3 social media platform built on the Arbitrum One blockchain, designed to combine features of traditional social networks like Facebook and TikTok. It enables users to create and share various content types (video, text, images) and earn AXM token rewards for engagement, tipping, group participation, and following creators. The platform's core vision is to decentralize social interactions, monetize user-generated content, and foster positive content creation across diverse domains within a Web3 ecosystem.

## User Preferences
I want the agent to use Typescript for all new code. I like functional programming paradigms where they make sense. I want the agent to prioritize security and best practices in smart contract development. I prefer iterative development with clear, small pull requests. Before making significant architectural changes or adding new external dependencies, please ask for my approval. Ensure all user-facing changes are responsive and mobile-friendly.

## System Architecture

### UI/UX Decisions
The platform features a dark emerald theme with glowing accents (HSL 160 84% 45%) as its primary color, with dark mode set as default. `shadcn/ui` components are utilized, complemented by custom `PostCard` and `VideoCard` components. All designs are responsive and include mobile navigation.

### Technical Implementations
- **Frontend**: Developed with React, TypeScript, Vite, TailwindCSS, and `shadcn/ui`. Key pages include Feed, ForYou, Profile, Groups, and various Web3 functionalities. Authentication, wallet connection, and theme state are managed via React contexts.
- **Backend**: Implemented using Express.js and TypeScript for API routing, database interactions, and object storage.
- **Database**: PostgreSQL with Drizzle ORM, supporting schemas for users, posts, comments, likes, groups, notifications, rewards, messages, NFTs, governance, staking, and moderation.
- **Storage**: Replit Object Storage (Google Cloud Storage) is used for media file storage.
- **Web3 Integration**: Operates on Arbitrum One (Chain ID 42161) utilizing the AXM token for rewards and tipping. MetaMask is integrated for wallet connection, including automatic network switching and signature verification for wallet binding.
- **Authentication**: Supports email/password authentication with sessions and Two-Factor Authentication.
- **Content Moderation**: An AI-powered system, integrated via OpenAI (through Replit AI Integration), analyzes text and images for policy violations, implementing a 3-strike policy, automated flagging, and an admin review panel.

### Feature Specifications
- **Core Social Features**: User profiles, content feeds (friends and algorithmic), diverse content posting (text, image, video), commenting, liking, following, and real-time direct messaging. Video posts support custom thumbnails with three options: auto-generation (ffmpeg extracts frame at 2s), manual frame selection (6 preview frames), and custom image upload.
- **Community Features**: Interest-based groups with creation, joining, and leaving functionalities, member management, role-based permissions, and group-specific feeds.
- **Web3 Features**: AXM token integration (rewards, tipping, staking), an NFT gallery and marketplace, DAO governance with proposals and wallet signature-verified voting, and rewards claiming with point conversion to AXM.
- **Creator Tools**: An analytics dashboard for creators and a referral program.
- **Moderation & Admin**: An admin dashboard for user management, AI-powered content moderation, platform settings, and audit logging. This includes a content moderation queue, violation tracking, appeals workflow, and community guidelines management.
- **Messaging**: Real-time direct messaging with WebSocket support, including typing indicators and read receipts, with content moderation prior to sending.
- **Groups**: Comprehensive group management, encompassing creation, category filtering, member lists with role badges, admin settings, and moderator/member management.
- **Marketplace (JoinLumina)**: Web3-native commerce platform with NFT shop ownership, AXM token payments, buy-to-earn mechanics, and creator affiliate systems. Features include product browsing, shop pages, product details, shop management dashboard (at /marketplace/shop/:slug/manage for shop owners to manage products, orders, and settings), and a multi-shop cart checkout with a 2% platform fee and potential 5% affiliate fee. Payment flow: platform fee sent first to treasury wallet, then seller payment; on-chain transaction verification required for both; cart only clears successfully verified orders.
- **Arbitrum Bridge**: Provides functionality for bridging ETH and AXM tokens between Ethereum L1 and Arbitrum L2 using `@arbitrum/sdk`, including deposits, withdrawals, gas estimation, transaction tracking, and cross-chain message status.
- **The Forge (Academy)**: An educational platform integrated with the AxiomAcademyHub contract, offering structured courses, lesson tracking, and NFT certifications, themed with an orange/amber gradient and gamification elements like XP and levels.
- **Exchange**: A decentralized exchange featuring token swaps, liquidity pool management, and slippage settings, integrated with the AxiomExchangeHub contract.
- **DePIN Node Sales**: A marketplace for purchasing DePIN nodes with ETH or AXM, offering tiered selections and an AXM discount, integrated with the DePINNodeSales contract.

## External Dependencies

- **Google Analytics**: For tracking user engagement.
- **SendGrid**: For bulk email campaigns and admin notifications.
- **Resend**: For transactional emails (e.g., welcome, password reset).
- **Twilio**: For SMS notifications and alerts.
- **Stripe**: For payment processing, donations, tips, and premium subscriptions.
- **OpenAI (via Replit AI Integration)**: Utilized for AI-powered content moderation.
- **Mux**: For live video streaming with RTMP ingest and HLS delivery.
- **Cloudflare Stream**: For browser-based WebRTC streaming (WHIP for ingest, WHEP for playback).
- **Axiom Protocol Smart Contracts**: (AXM Token, StakingAndEmissionsHub, CommunitySocialHub, GamificationHub, MarketsAndListingsHub, CitizenReputationOracle, AxiomAcademyHub, AxiomExchangeHub, DePINNodeSales) deployed on Arbitrum One.
- **Arbitrum SDK**: For L1/L2 bridging operations.