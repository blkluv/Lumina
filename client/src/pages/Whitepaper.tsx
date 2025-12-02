import { useState } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Copy, 
  Check, 
  FileText, 
  ArrowLeft, 
  Sparkles,
  Shield,
  Coins,
  Users,
  Vote,
  Lock,
  Zap,
  Globe,
  Heart,
  BookOpen,
  TrendingUp,
  Award,
  Target,
  Layers,
  Database,
  Bot,
  Scale,
  Rocket,
  ExternalLink
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { CONTRACT_ADDRESSES, NETWORK_CONFIG } from "@/lib/contracts";

const sections = [
  { id: "overview", label: "Overview", icon: Sparkles },
  { id: "vision", label: "Vision", icon: Target },
  { id: "features", label: "Features", icon: Layers },
  { id: "tokenomics", label: "Tokenomics", icon: Coins },
  { id: "contracts", label: "Contracts", icon: Database },
  { id: "moderation", label: "Moderation", icon: Shield },
  { id: "governance", label: "Governance", icon: Vote },
  { id: "roadmap", label: "Roadmap", icon: Rocket },
];

const FULL_WHITEPAPER = `================================================================================
                              LUMINA WHITEPAPER
                              Version 1.0 | December 2025
          A Web3 Social Media Platform Dedicated to Uplifting Humanity
================================================================================

TABLE OF CONTENTS
--------------------------------------------------------------------------------
1.  Executive Summary
2.  Vision & Mission
3.  The Problem
4.  The Solution: Lumina
5.  Platform Architecture
6.  Core Features
7.  Token Economics (AXM)
8.  Smart Contract Infrastructure
9.  Content Moderation System
10. Governance (DAO)
11. Security & Privacy
12. Roadmap
13. Conclusion

================================================================================
1. EXECUTIVE SUMMARY
================================================================================

Lumina is a revolutionary Web3 social media platform built on Arbitrum One,
designed to fundamentally transform how humanity interacts online. In a digital
landscape often dominated by negativity, misinformation, and harmful content,
Lumina stands as a beacon of light—a platform where righteousness, education,
inspiration, and moral values are not just welcomed but actively rewarded.

KEY HIGHLIGHTS:
  Network:           Arbitrum One (Layer 2 Ethereum)
  Native Token:      AXM (AXIOM Token)
  Smart Contracts:   6 integrated contracts for complete decentralization
  Content Policy:    Zero tolerance for harmful content with 3-strike system
  Governance:        Community-driven DAO with on-chain voting
  Moderation:        AI-powered 24/7 content screening with human oversight

================================================================================
2. VISION & MISSION
================================================================================

VISION: To create a digital space where social media serves its highest purpose:
connecting humanity through content that educates, inspires, and uplifts.

MISSION:
  1. UPLIFT HUMANITY - Platform where moral, ethical, educational content thrives
  2. REWARD RIGHTEOUSNESS - Economic incentives for positive contributions
  3. ELIMINATE TOXICITY - Clean, safe environment through AI moderation
  4. DECENTRALIZE SOCIAL MEDIA - True ownership and community governance
  5. BRIDGE WEB2 AND WEB3 - Make blockchain accessible to everyday users

CORE VALUES:
  Righteousness   - Content that promotes moral and ethical behavior
  Education       - Knowledge sharing in finance, technology, science
  Inspiration     - Stories and content that motivate positive change
  Community       - Building meaningful connections based on shared values
  Transparency    - Open governance and clear community standards

================================================================================
3. THE PROBLEM
================================================================================

Today's social media platforms face critical issues:

  1. ALGORITHMIC TOXICITY - Platforms optimize for outrage over positivity
  2. CREATOR EXPLOITATION - Creators receive minimal compensation
  3. CENTRALIZED CONTROL - No user say in platform governance
  4. DATA HARVESTING - Personal data sold without consent
  5. MENTAL HEALTH CRISIS - Heavy use linked to anxiety and depression
  6. MISINFORMATION SPREAD - False information spreads faster than truth

================================================================================
4. THE SOLUTION: LUMINA
================================================================================

  4.1 POSITIVE-CONTENT ALGORITHMS - Prioritize education and inspiration
  4.2 CREATOR REWARDS ECONOMY - Earn AXM for quality content
  4.3 DECENTRALIZED GOVERNANCE - DAO with on-chain voting
  4.4 USER DATA OWNERSHIP - Blockchain-based identity control
  4.5 AI-POWERED WELLNESS - Advanced moderation with 3-strike system
  4.6 TRUTH OVER VIRALITY - Active misinformation flagging

================================================================================
5. PLATFORM ARCHITECTURE
================================================================================

TECHNOLOGY STACK:
  Frontend:   React + TypeScript + Vite + TailwindCSS
  Backend:    Express.js + WebSocket
  Database:   PostgreSQL with Drizzle ORM
  Blockchain: Arbitrum One (Chain ID: 42161)
  Storage:    Cloud Object Storage for media

NETWORK: Arbitrum One
  Chain ID: 42161
  Fast transactions (~0.25 seconds)
  Low gas fees (~$0.01-0.10 per transaction)
  Full EVM compatibility
  Ethereum security inheritance

================================================================================
6. CORE FEATURES
================================================================================

SOCIAL FEATURES:
  - Text, Image, Video Posts
  - Stories & Live Streaming
  - Direct Messages (WebSocket)
  - Groups & Communities
  - Tips & Engagement

WEB3 FEATURES:
  - MetaMask Wallet Integration
  - Token Staking with APY
  - NFT Marketplace
  - Creator Tipping (On-chain)
  - DAO Governance

GAMIFICATION:
  - XP & Leveling System
  - Daily/Weekly Quests
  - Streak Bonuses
  - Points to AXM Conversion

CIVIC ENGAGEMENT:
  - Advocacy Hub
  - Volunteer Coordination
  - Phone Banking Tools

================================================================================
7. TOKEN ECONOMICS (AXM)
================================================================================

TOKEN OVERVIEW:
  Name:       AXIOM Token
  Symbol:     AXM
  Decimals:   18
  Network:    Arbitrum One
  Contract:   0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D
  Standard:   ERC-20 with Governance Extensions

TOKEN UTILITY:
  1. Creator Rewards - Earn for quality content
  2. Governance - Vote on platform proposals
  3. Staking - Earn passive income
  4. Transactions - Tips, NFTs, marketplace
  5. Gamification - Convert points to AXM

EARNING MECHANISMS:
  Creating a post     - 5-20 points
  Receiving a like    - 1-2 points
  Receiving a comment - 3-5 points
  Gaining a follower  - 10 points
  Daily check-in      - 10-50 points
  Completing quests   - 10-500 points

================================================================================
8. SMART CONTRACT INFRASTRUCTURE
================================================================================

6 CONTRACTS ON ARBITRUM ONE:

  1. AxiomV2 (AXM Token)
     Address: 0x864F9c6f50dC5Bd244F5002F1B0873Cd80e2539D
     Purpose: Token transfers, voting delegation, balance queries

  2. StakingAndEmissionsHub
     Address: 0x8b99cDeefB3116cA87AF24A9E10D5580dA07B885
     Purpose: Staking, lock periods, reward claiming

  3. CommunitySocialHub
     Address: 0xC2f82eD5C2585B525E01F19eA5C28811AB43aF49
     Purpose: Creator tipping, content rewards

  4. GamificationHub
     Address: 0x7F455b4614E05820AAD52067Ef223f30b1936f93
     Purpose: XP, levels, daily check-ins, quests

  5. MarketsAndListingsHub
     Address: 0x98a59D4fb5Fa974879E9F043C3174Ae82Fb9D830
     Purpose: NFT marketplace listings and trading

  6. CitizenReputationOracle
     Address: 0x649a0F1bd204b6f23A92f1CDbb2F1838D691B643
     Purpose: Reputation scores, badges, tiers

STAKING LOCK PERIODS:
  30 days  - 1.0x APY, 1.0x voting
  90 days  - 1.5x APY, 1.25x voting
  180 days - 2.0x APY, 1.5x voting
  365 days - 3.0x APY, 2.0x voting

================================================================================
9. CONTENT MODERATION SYSTEM
================================================================================

AI-POWERED SCREENING:
  - Natural language processing
  - Computer vision analysis
  - Frame-by-frame video scanning
  - Audio transcription

PROHIBITED CONTENT:
  - Nudity (Critical)
  - Violence (Critical)
  - Explicit Content (Critical)
  - Hate Speech (Critical)
  - Harassment (High)
  - Misinformation (Medium-High)
  - Spam (Medium)

ENCOURAGED CONTENT:
  - Educational content
  - Spiritual growth
  - Financial literacy
  - Technology insights
  - Inspirational stories

THREE-STRIKE SYSTEM:
  Strike 1: Warning - Notification, content may be removed
  Strike 2: Monitoring - Pre-review, reduced visibility
  Strike 3: Suspension - Account suspended, appeal process

================================================================================
10. GOVERNANCE (DAO)
================================================================================

PROPOSAL CATEGORIES:
  Treasury   - 10% quorum, 66% approval
  Policy     - 15% quorum, 60% approval
  Feature    - 10% quorum, 55% approval
  Governance - 20% quorum, 75% approval
  Emergency  - 5% quorum, 80% approval

VOTING POWER:
  - Based on staked AXM tokens
  - Lock duration multipliers
  - Delegation supported
  - Reputation bonuses

PROPOSAL LIFECYCLE:
  1. Draft
  2. Discussion (3 days minimum)
  3. Active Voting (5-7 days)
  4. Tallying
  5. Execution
  6. Archive

================================================================================
11. SECURITY & PRIVACY
================================================================================

AUTHENTICATION:
  - bcrypt password hashing
  - Session-based auth
  - Optional 2FA (TOTP)
  - Wallet signature verification

DATA PROTECTION:
  - Encryption at rest
  - Role-based access control
  - Audit logging
  - User data export/deletion

SMART CONTRACT SECURITY:
  - Verified source code
  - Reentrancy guards
  - Rate limiting
  - Admin multisig

================================================================================
12. ROADMAP
================================================================================

PHASE 1: FOUNDATION (COMPLETED)
  [✓] Core social features
  [✓] User profiles and authentication
  [✓] Groups and communities
  [✓] Direct messaging
  [✓] AI content moderation
  [✓] Database infrastructure

PHASE 2: WEB3 INTEGRATION (COMPLETED)
  [✓] Arbitrum One integration
  [✓] Wallet connection (MetaMask)
  [✓] Smart contract integration
  [✓] Staking interface
  [✓] Governance voting
  [✓] NFT marketplace

PHASE 3: ENHANCEMENT (CURRENT)
  [ ] Mobile application
  [ ] Advanced analytics
  [ ] Cross-chain bridges
  [ ] Fiat on/off ramps

PHASE 4: EXPANSION (Q2-Q3 2026)
  [ ] Multi-language support
  [ ] Creator education
  [ ] Brand partnerships
  [ ] Charitable giving

PHASE 5: ECOSYSTEM (Q4 2026+)
  [ ] Developer API
  [ ] Plugin marketplace
  [ ] IPFS migration
  [ ] DAO grants program

================================================================================
13. CONCLUSION
================================================================================

Lumina represents a fundamental reimagining of what social media can be.

THE LUMINA DIFFERENCE:
  1. Purpose over profit
  2. Creator ownership
  3. Community governance
  4. Safety first
  5. Web3 native

Join us in building a digital future worthy of humanity's highest aspirations.

================================================================================
CONTACT & RESOURCES
================================================================================

  GitHub:         github.com/AxiomProtocol/AXIOM
  Block Explorer: arbitrum.blockscout.com

================================================================================
LEGAL DISCLAIMER
================================================================================

This whitepaper is for informational purposes only and does not constitute
financial advice. Cryptocurrency investments carry significant risks.

================================================================================
                    Copyright 2025 Lumina. All rights reserved.
================================================================================`;

export default function Whitepaper() {
  const [copied, setCopied] = useState(false);
  const [activeSection, setActiveSection] = useState("overview");
  const { toast } = useToast();

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FULL_WHITEPAPER);
      setCopied(true);
      toast({
        title: "Copied to clipboard",
        description: "The full whitepaper has been copied.",
      });
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast({
        title: "Failed to copy",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden border-b border-border">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-30" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-30" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-16 sm:py-24">
            <div className="text-center max-w-4xl mx-auto">
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary gap-2">
                <FileText className="h-3 w-3" />
                Official Document
              </Badge>
              
              <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary">
                  Lumina Whitepaper
                </span>
              </h1>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto mb-8">
                A comprehensive guide to the Web3 social media platform dedicated to uplifting humanity 
                through positive content and blockchain rewards.
              </p>
              
              <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Globe className="h-3 w-3 mr-1" />
                  Arbitrum One
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Coins className="h-3 w-3 mr-1" />
                  AXM Token
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Database className="h-3 w-3 mr-1" />
                  6 Smart Contracts
                </Badge>
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Bot className="h-3 w-3 mr-1" />
                  AI Moderation
                </Badge>
              </div>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                <Button 
                  size="lg" 
                  onClick={handleCopy}
                  className="gap-2 shadow-lg shadow-primary/25"
                  data-testid="button-copy-whitepaper"
                >
                  {copied ? (
                    <>
                      <Check className="h-5 w-5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy className="h-5 w-5" />
                      Copy Full Whitepaper
                    </>
                  )}
                </Button>
                <a 
                  href={`${NETWORK_CONFIG.blockExplorer}/address/${CONTRACT_ADDRESSES.AXM_TOKEN}`}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Button variant="outline" size="lg" className="gap-2 border-primary/30">
                    <ExternalLink className="h-5 w-5" />
                    View on Explorer
                  </Button>
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Quick Stats */}
        <section className="py-12 border-b border-border bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">6</div>
                <div className="text-sm text-muted-foreground">Smart Contracts</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">L2</div>
                <div className="text-sm text-muted-foreground">Arbitrum One</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">24/7</div>
                <div className="text-sm text-muted-foreground">AI Moderation</div>
              </div>
              <div className="text-center">
                <div className="text-3xl sm:text-4xl font-bold text-primary">DAO</div>
                <div className="text-sm text-muted-foreground">Governance</div>
              </div>
            </div>
          </div>
        </section>

        {/* Content Sections */}
        <section className="py-16">
          <div className="max-w-7xl mx-auto px-4">
            <Tabs value={activeSection} onValueChange={setActiveSection} className="space-y-8">
              <TabsList className="flex flex-wrap h-auto gap-2 bg-transparent justify-center">
                {sections.map((section) => (
                  <TabsTrigger 
                    key={section.id} 
                    value={section.id}
                    className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground gap-2"
                    data-testid={`tab-${section.id}`}
                  >
                    <section.icon className="h-4 w-4" />
                    {section.label}
                  </TabsTrigger>
                ))}
              </TabsList>

              {/* Overview */}
              <TabsContent value="overview" className="space-y-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Sparkles className="h-6 w-6 text-primary" />
                      Executive Summary
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <p className="text-muted-foreground leading-relaxed">
                      Lumina is a revolutionary Web3 social media platform built on Arbitrum One, 
                      designed to fundamentally transform how humanity interacts online. In a digital 
                      landscape often dominated by negativity, misinformation, and harmful content, 
                      Lumina stands as a beacon of light—a platform where righteousness, education, 
                      inspiration, and moral values are not just welcomed but actively rewarded.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 mt-6">
                      {[
                        { icon: Globe, label: "Network", value: "Arbitrum One (L2)" },
                        { icon: Coins, label: "Token", value: "AXM (AXIOM)" },
                        { icon: Database, label: "Contracts", value: "6 Integrated" },
                        { icon: Shield, label: "Policy", value: "Zero Tolerance" },
                        { icon: Vote, label: "Governance", value: "Community DAO" },
                        { icon: Bot, label: "Moderation", value: "AI-Powered 24/7" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                          <item.icon className="h-5 w-5 text-primary" />
                          <div>
                            <div className="text-xs text-muted-foreground">{item.label}</div>
                            <div className="font-medium">{item.value}</div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Vision */}
              <TabsContent value="vision" className="space-y-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Target className="h-6 w-6 text-primary" />
                      Vision & Mission
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                      <h3 className="font-semibold text-lg mb-2">Vision</h3>
                      <p className="text-muted-foreground">
                        To create a digital space where social media serves its highest purpose: 
                        connecting humanity through content that educates, inspires, and uplifts.
                      </p>
                    </div>
                    
                    <div className="grid gap-4">
                      {[
                        { icon: Heart, title: "Uplift Humanity", desc: "Platform where moral, ethical, educational content thrives" },
                        { icon: Award, title: "Reward Righteousness", desc: "Economic incentives for positive contributions" },
                        { icon: Shield, title: "Eliminate Toxicity", desc: "Clean, safe environment through AI moderation" },
                        { icon: Users, title: "Decentralize Social Media", desc: "True ownership and community governance" },
                        { icon: Zap, title: "Bridge Web2 and Web3", desc: "Make blockchain accessible to everyday users" },
                      ].map((item, index) => (
                        <div key={index} className="flex items-start gap-4 p-4 rounded-lg bg-muted/50">
                          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                            <item.icon className="h-5 w-5 text-primary" />
                          </div>
                          <div>
                            <h4 className="font-semibold">{item.title}</h4>
                            <p className="text-sm text-muted-foreground">{item.desc}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Features */}
              <TabsContent value="features" className="space-y-6">
                <div className="grid md:grid-cols-2 gap-6">
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Users className="h-5 w-5 text-primary" />
                        Social Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Text, Image, Video Posts</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Stories & Live Streaming</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Real-time Direct Messages</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Groups & Communities</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Tips & Engagement</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <Coins className="h-5 w-5 text-primary" />
                        Web3 Features
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> MetaMask Wallet Integration</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Token Staking with APY</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> NFT Marketplace</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Creator Tipping (On-chain)</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> DAO Governance Voting</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <TrendingUp className="h-5 w-5 text-primary" />
                        Gamification
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> XP & Leveling System</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Daily/Weekly Quests</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Streak Bonuses</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Points to AXM Conversion</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Achievements & Badges</li>
                      </ul>
                    </CardContent>
                  </Card>
                  
                  <Card className="bg-card/50 border-border/50">
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        <BookOpen className="h-5 w-5 text-primary" />
                        Civic Engagement
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <ul className="space-y-2 text-muted-foreground">
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Advocacy Hub</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Volunteer Coordination</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Phone Banking Tools</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Petition Creation</li>
                        <li className="flex items-center gap-2"><Check className="h-4 w-4 text-primary" /> Event Organization</li>
                      </ul>
                    </CardContent>
                  </Card>
                </div>
              </TabsContent>

              {/* Tokenomics */}
              <TabsContent value="tokenomics" className="space-y-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Coins className="h-6 w-6 text-primary" />
                      AXM Token Economics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Name</div>
                        <div className="font-semibold">AXIOM Token</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Symbol</div>
                        <div className="font-semibold">AXM</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Decimals</div>
                        <div className="font-semibold">18</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50">
                        <div className="text-sm text-muted-foreground">Network</div>
                        <div className="font-semibold">Arbitrum One</div>
                      </div>
                      <div className="p-4 rounded-lg bg-muted/50 sm:col-span-2">
                        <div className="text-sm text-muted-foreground">Contract</div>
                        <div className="font-mono text-sm break-all">{CONTRACT_ADDRESSES.AXM_TOKEN}</div>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-lg mb-4">Earning Mechanisms</h3>
                      <div className="grid sm:grid-cols-2 gap-3">
                        {[
                          { activity: "Creating a post", reward: "5-20 points" },
                          { activity: "Receiving a like", reward: "1-2 points" },
                          { activity: "Receiving a comment", reward: "3-5 points" },
                          { activity: "Gaining a follower", reward: "10 points" },
                          { activity: "Daily check-in", reward: "10-50 points" },
                          { activity: "Completing quests", reward: "10-500 points" },
                        ].map((item, index) => (
                          <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                            <span className="text-muted-foreground">{item.activity}</span>
                            <Badge variant="outline" className="border-primary/30 text-primary">{item.reward}</Badge>
                          </div>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Contracts */}
              <TabsContent value="contracts" className="space-y-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Database className="h-6 w-6 text-primary" />
                      Smart Contract Infrastructure
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {[
                      { name: "AxiomV2 (AXM Token)", address: CONTRACT_ADDRESSES.AXM_TOKEN, purpose: "Token transfers, voting delegation, balance queries" },
                      { name: "StakingAndEmissionsHub", address: CONTRACT_ADDRESSES.STAKING_EMISSIONS, purpose: "Staking, lock periods, reward claiming" },
                      { name: "CommunitySocialHub", address: CONTRACT_ADDRESSES.COMMUNITY_SOCIAL, purpose: "Creator tipping, content rewards" },
                      { name: "GamificationHub", address: CONTRACT_ADDRESSES.GAMIFICATION, purpose: "XP, levels, daily check-ins, quests" },
                      { name: "MarketsAndListingsHub", address: CONTRACT_ADDRESSES.MARKETS_RWA, purpose: "NFT marketplace listings and trading" },
                      { name: "CitizenReputationOracle", address: CONTRACT_ADDRESSES.REPUTATION_ORACLE, purpose: "Reputation scores, badges, tiers" },
                    ].map((contract, index) => (
                      <div key={index} className="p-4 rounded-lg bg-muted/50 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-semibold">{contract.name}</h4>
                          <a 
                            href={`${NETWORK_CONFIG.blockExplorer}/address/${contract.address}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline text-sm flex items-center gap-1"
                          >
                            View <ExternalLink className="h-3 w-3" />
                          </a>
                        </div>
                        <div className="font-mono text-xs text-muted-foreground break-all">{contract.address}</div>
                        <div className="text-sm text-muted-foreground">{contract.purpose}</div>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Moderation */}
              <TabsContent value="moderation" className="space-y-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Shield className="h-6 w-6 text-primary" />
                      Content Moderation System
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div className="grid md:grid-cols-2 gap-6">
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2">
                          <Bot className="h-5 w-5 text-primary" />
                          AI-Powered Screening
                        </h3>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>Natural language processing</li>
                          <li>Computer vision analysis</li>
                          <li>Frame-by-frame video scanning</li>
                          <li>Audio transcription</li>
                        </ul>
                      </div>
                      
                      <div className="space-y-4">
                        <h3 className="font-semibold flex items-center gap-2 text-destructive">
                          Prohibited Content
                        </h3>
                        <ul className="space-y-2 text-muted-foreground text-sm">
                          <li>Nudity, Violence, Explicit Content</li>
                          <li>Hate Speech, Harassment</li>
                          <li>Misinformation, Spam</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="border-t border-border pt-6">
                      <h3 className="font-semibold text-lg mb-4">Three-Strike System</h3>
                      <div className="grid sm:grid-cols-3 gap-4">
                        <div className="p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                          <div className="font-semibold text-yellow-600 dark:text-yellow-400 mb-2">Strike 1: Warning</div>
                          <p className="text-sm text-muted-foreground">Notification sent, content may be removed</p>
                        </div>
                        <div className="p-4 rounded-lg bg-orange-500/10 border border-orange-500/20">
                          <div className="font-semibold text-orange-600 dark:text-orange-400 mb-2">Strike 2: Monitoring</div>
                          <p className="text-sm text-muted-foreground">Pre-review required, reduced visibility</p>
                        </div>
                        <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                          <div className="font-semibold text-red-600 dark:text-red-400 mb-2">Strike 3: Suspension</div>
                          <p className="text-sm text-muted-foreground">Account suspended, appeal process available</p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Governance */}
              <TabsContent value="governance" className="space-y-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Vote className="h-6 w-6 text-primary" />
                      DAO Governance
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <p className="text-muted-foreground">
                      Lumina is governed by its community through the Lumina DAO. Token holders can 
                      propose and vote on changes to the platform.
                    </p>
                    
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-semibold mb-3">Proposal Categories</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>Treasury - 10% quorum, 66% approval</li>
                          <li>Policy - 15% quorum, 60% approval</li>
                          <li>Feature - 10% quorum, 55% approval</li>
                          <li>Governance - 20% quorum, 75% approval</li>
                          <li>Emergency - 5% quorum, 80% approval</li>
                        </ul>
                      </div>
                      
                      <div className="p-4 rounded-lg bg-muted/50">
                        <h4 className="font-semibold mb-3">Voting Power</h4>
                        <ul className="space-y-2 text-sm text-muted-foreground">
                          <li>Based on staked AXM tokens</li>
                          <li>Lock duration multipliers</li>
                          <li>Delegation supported</li>
                          <li>Reputation bonuses</li>
                        </ul>
                      </div>
                    </div>
                    
                    <div className="flex items-center justify-center gap-2 pt-4">
                      <Link href="/governance">
                        <Button className="gap-2">
                          <Vote className="h-4 w-4" />
                          View Active Proposals
                        </Button>
                      </Link>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Roadmap */}
              <TabsContent value="roadmap" className="space-y-6">
                <Card className="bg-card/50 border-border/50">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-2xl">
                      <Rocket className="h-6 w-6 text-primary" />
                      Development Roadmap
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {[
                      { phase: "Phase 1: Foundation", status: "completed", items: ["Core social features", "User authentication", "Groups & communities", "Direct messaging", "AI moderation"] },
                      { phase: "Phase 2: Web3 Integration", status: "completed", items: ["Arbitrum One integration", "Wallet connection", "Smart contracts", "Staking interface", "Governance voting"] },
                      { phase: "Phase 3: Enhancement", status: "current", items: ["Mobile application", "Advanced analytics", "Cross-chain bridges", "Fiat on/off ramps"] },
                      { phase: "Phase 4: Expansion", status: "upcoming", items: ["Multi-language support", "Creator education", "Brand partnerships", "Charitable giving"] },
                      { phase: "Phase 5: Ecosystem", status: "upcoming", items: ["Developer API", "Plugin marketplace", "IPFS migration", "DAO grants program"] },
                    ].map((phase, index) => (
                      <div key={index} className="relative pl-6 pb-6 border-l-2 border-border last:pb-0">
                        <div className={`absolute -left-[9px] top-0 w-4 h-4 rounded-full ${
                          phase.status === "completed" ? "bg-primary" : 
                          phase.status === "current" ? "bg-yellow-500 animate-pulse" : "bg-muted"
                        }`} />
                        <div className="flex items-center gap-2 mb-2">
                          <h4 className="font-semibold">{phase.phase}</h4>
                          {phase.status === "completed" && <Badge className="bg-primary/10 text-primary">Completed</Badge>}
                          {phase.status === "current" && <Badge className="bg-yellow-500/10 text-yellow-600">In Progress</Badge>}
                          {phase.status === "upcoming" && <Badge variant="outline">Upcoming</Badge>}
                        </div>
                        <ul className="space-y-1 text-sm text-muted-foreground">
                          {phase.items.map((item, i) => (
                            <li key={i} className="flex items-center gap-2">
                              {phase.status === "completed" ? (
                                <Check className="h-3 w-3 text-primary" />
                              ) : (
                                <div className="w-3 h-3 rounded-full border border-muted-foreground/50" />
                              )}
                              {item}
                            </li>
                          ))}
                        </ul>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </section>

        {/* Full Text Section */}
        <section className="py-16 bg-muted/30 border-t border-border">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-8">
              <h2 className="text-2xl font-bold mb-2">Full Whitepaper Text</h2>
              <p className="text-muted-foreground">Copy the complete whitepaper in plain text format</p>
            </div>
            
            <Card className="bg-card/50 border-border/50">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" />
                  Plain Text Version
                </CardTitle>
                <Button 
                  onClick={handleCopy}
                  className="gap-2"
                  data-testid="button-copy-full"
                >
                  {copied ? (
                    <>
                      <Check className="h-4 w-4" />
                      Copied
                    </>
                  ) : (
                    <>
                      <Copy className="h-4 w-4" />
                      Copy All
                    </>
                  )}
                </Button>
              </CardHeader>
              <CardContent>
                <pre 
                  className="whitespace-pre-wrap font-mono text-xs leading-relaxed p-4 bg-muted/50 rounded-lg border border-border/50 overflow-x-auto max-h-96 overflow-y-auto"
                  data-testid="text-whitepaper-content"
                >
                  {FULL_WHITEPAPER}
                </pre>
              </CardContent>
            </Card>
          </div>
        </section>

        {/* Footer CTA */}
        <section className="py-16 border-t border-border">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-2xl font-bold mb-4">Ready to Join the Movement?</h2>
            <p className="text-muted-foreground mb-8">
              Be part of a community that believes social media should inspire, not divide.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link href="/signup">
                <Button size="lg" className="gap-2">
                  Create Account
                  <Sparkles className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/">
                <Button variant="outline" size="lg" className="gap-2">
                  <ArrowLeft className="h-4 w-4" />
                  Back to Home
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
