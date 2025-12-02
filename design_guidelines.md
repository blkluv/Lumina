# AXIOM Social Hub - Design Guidelines

## Design Approach

**Reference-Based Design** drawing inspiration from:
- **TikTok**: Vertical video feed, overlay interactions, immersive content consumption
- **Instagram**: Visual content cards, engagement patterns, creator-focused UI
- **Twitter/X**: Timeline feed mechanics, social interactions, repost patterns
- **Uniswap/Web3 Apps**: Wallet integration UI, token displays, transaction flows

This hybrid social platform requires a bold, modern aesthetic that balances entertainment (TikTok) with social networking (Facebook) while prominently featuring Web3 elements.

## Typography System

**Font Families**: 
- Primary: Inter (body text, UI elements)
- Display: Plus Jakarta Sans (headings, emphasis)
- Mono: JetBrains Mono (wallet addresses, token amounts)

**Hierarchy**:
- Hero/Landing: 4xl to 6xl, bold weight, tight tracking
- Page Titles: 3xl, semibold
- Section Headers: 2xl, semibold
- Card Titles/Names: lg, medium
- Body Text: base, regular (leading-relaxed for readability)
- Metadata/Timestamps: sm, medium, reduced opacity
- Wallet Addresses: xs to sm, mono font, truncated with ellipsis

## Layout System

**Spacing Units**: Use Tailwind units of **2, 4, 8, 12, 16** for consistency
- Micro spacing (icons, badges): 2
- Component padding: 4, 8
- Section spacing: 12, 16
- Page margins: 16, 20

**Grid Structure**:
- Desktop: Three-column layout (sidebar 280px / main feed flexible / sidebar 320px)
- Tablet: Two-column (collapsible sidebar + main)
- Mobile: Single column, bottom navigation

**Container Widths**:
- Feed content: max-w-2xl
- Video player: Full viewport
- Profile cards: max-w-sm
- Modals: max-w-lg to max-w-2xl

## Core Component Library

### Navigation & Layout
**Top Navigation Bar**:
- Fixed header, backdrop blur effect with subtle border
- Logo left (AXIOM wordmark + icon), search center, actions right (create post, notifications, wallet, profile)
- Height: 16 units (64px)
- Wallet button: Connected state shows truncated address + AXM balance with slight glow effect
- Network indicator: Small badge showing Arbitrum One status

**Left Sidebar** (Desktop):
- Profile card at top (avatar, name, @username, follower count)
- AXM balance prominently displayed with icon
- Navigation menu (Home, For You, Groups, Profile, Settings)
- Trending topics widget below

**Right Sidebar** (Desktop):
- Suggested creators to follow (avatar grid)
- Active groups list
- Rewards summary widget (points, estimated AXM)

**Bottom Navigation** (Mobile):
- 5 icons: Home, For You, Create (center, elevated), Notifications, Profile
- Active state: icon fill + indicator line

### Feed Components

**Post Card** (Friends Feed):
- Full-width card with subtle border and rounded corners (rounded-xl)
- Header: Avatar (left), name + @username + timestamp, more menu (right)
- Content: Text (up to 3 lines preview), images (1-4 grid), or video thumbnail
- Footer: Engagement row (like, comment, share, tip) with counts
- Hover state: Subtle elevation increase
- Spacing: p-4 to p-6

**Video Card** (For You Feed):
- Full viewport height, full width
- Video auto-plays on scroll into view
- Overlay gradient at bottom (transparent to dark)
- Right side: Vertical action stack (like, comment, share, tip, creator profile)
- Bottom: Creator info, caption (expandable), hashtags
- Progress indicator on swipe

### Web3 Components

**Wallet Connection Modal**:
- Centered modal, max-w-md
- Large wallet icons (MetaMask, WalletConnect, Coinbase)
- Connection status indicator
- Network warning banner (if not Arbitrum One) with "Switch Network" button

**Tip Creator Modal**:
- Avatar + creator name at top
- Large AXM amount input (numerical, mono font)
- USD equivalent below in smaller text
- Current balance display
- "Send Tip" primary button (full width)
- Transaction pending/success states

**Token Display**:
- AXM icon + amount in medium weight
- Format: Always show 2 decimal places
- Hover: Show full precision in tooltip

**Rewards Widget**:
- Card format with glowing border effect
- Points meter (visual progress bar)
- Estimated AXM (large, mono font)
- "Claim Rewards" button (disabled if < threshold)
- Recent activity list (compact, sm text)

### Content Creation

**Post Composer**:
- Expanded card at top of feed (p-6)
- Avatar left, multi-line textarea (auto-expand)
- Media upload buttons (image, video) with preview thumbnails
- Visibility dropdown (public, followers-only)
- Character count and "Post" button (right-aligned)

**Video Upload Flow**:
- Drag-and-drop zone (dashed border, h-64)
- Upload progress bar
- Thumbnail auto-generation
- Duration display
- "Add to For You" checkbox

### Social Interactions

**Like Button**: Heart icon, animated fill on click, count beside
**Comment Button**: Speech bubble icon, opens comment drawer/modal, count visible
**Share Button**: Arrow icon, opens share options (repost, copy link, send DM)
**Follow Button**: Rounded-full, solid when following, outlined when not, state transitions smoothly
**Tip Button**: Dollar/token icon, distinct styling (slight glow or accent treatment)

### Profile Components

**Profile Header**:
- Banner image (h-48 to h-64, cropped cover)
- Avatar (overlap banner, -mt-16, border-4)
- Name (2xl, bold), @username (lg), bio (base, max 3 lines)
- Stats row (Posts, Followers, Following - clickable)
- Wallet badge (verified connected wallet with truncated address)
- Action buttons (Follow/Following, Message, Tip)

**Profile Tabs**:
- Segmented control style (Posts, Videos, Activity)
- Active state: underline or filled background
- Grid layout for posts/videos (3 columns desktop, 2 mobile)

### Groups

**Group Card**:
- Cover image (aspect-video)
- Group name (xl, semibold), member count, topic tags
- "Join" button (prominent) or "Joined" state
- Preview of recent posts (2-3 small thumbnails)

**Group Feed**:
- Similar to Friends Feed but filtered
- Pinned posts at top
- Group-specific composer

### Notifications

**Notification Item**:
- Avatar + action icon (like/comment/follow badge)
- Text: "[User] liked your post" with timestamp
- Inline preview (thumbnail or text snippet)
- Mark as read: opacity change
- Grouped by type and recency

## Animations & Interactions

**Use Sparingly** - Only for meaningful feedback:
- Like button: Quick scale + fill animation
- Infinite scroll: Smooth fade-in for new content
- Video feed: Snap scroll with momentum
- Modal/drawer: Slide-in from bottom (mobile) or fade + scale (desktop)
- Wallet connection: Pulse effect on connecting state
- **No hover animations on overlaid buttons** - rely on component's built-in states

## Accessibility

- All interactive elements: min touch target 44x44px
- Form inputs: Consistent height (h-12), clear labels, error states
- Focus states: Visible outline on keyboard navigation
- Image alt text: Descriptive for all uploaded media
- Color contrast: Ensure all text meets WCAG AA standards against backgrounds

## Responsive Breakpoints

- Mobile: < 768px (single column, bottom nav)
- Tablet: 768px - 1024px (two column, collapsible sidebar)
- Desktop: > 1024px (three column layout)
- Large: > 1536px (constrained max-width for content readability)

## Images

**Hero Section** (Landing Page):
- Large full-width hero image showcasing diverse creators, vibrant community
- Overlay: Gradient (transparent top to dark bottom) for text readability
- Headline text: Centered, 5xl to 6xl
- CTA buttons: Prominent "Join Now" and "Connect Wallet" with blurred backgrounds

**Profile Banners**: Abstract patterns, cityscapes, or creator-chosen imagery (aspect 21:9)

**Post Media**: Support 1:1, 4:5, 16:9 aspect ratios with smart cropping

**Video Thumbnails**: Auto-generated from first frame, with play icon overlay