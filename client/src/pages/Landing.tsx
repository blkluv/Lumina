import { Link } from "wouter";
import { 
  Wallet, 
  Play, 
  Coins, 
  Users, 
  Zap, 
  Shield, 
  ArrowRight, 
  ChevronRight,
  Heart,
  BookOpen,
  Sparkles,
  Globe,
  TrendingUp,
  Award,
  Ban,
  CheckCircle,
  Star
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Header } from "@/components/layout/Header";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";

const platformValues = [
  {
    icon: Heart,
    title: "Righteous Content",
    description: "A platform dedicated to moral, ethical, and uplifting content that inspires positive change.",
  },
  {
    icon: BookOpen,
    title: "Education First",
    description: "Learn and grow with educational content spanning finance, technology, science, and spirituality.",
  },
  {
    icon: Shield,
    title: "Safe Community",
    description: "AI-powered moderation ensures a clean, respectful environment free from harmful content.",
  },
  {
    icon: Coins,
    title: "Earn Rewards",
    description: "Get rewarded in AXM tokens for creating quality content and meaningful engagement.",
  },
  {
    icon: Users,
    title: "Build Community",
    description: "Connect with like-minded individuals committed to making the world a better place.",
  },
  {
    icon: Globe,
    title: "Web3 Powered",
    description: "Built on Arbitrum One for true ownership, instant transactions, and decentralized rewards.",
  },
];

const contentTypes = [
  { label: "Educational", icon: BookOpen },
  { label: "Inspirational", icon: Sparkles },
  { label: "Financial Literacy", icon: TrendingUp },
  { label: "Technology", icon: Zap },
  { label: "Science", icon: Globe },
  { label: "Spiritual Growth", icon: Heart },
];

const prohibitedContent = [
  "Nudity & explicit content",
  "Violence & harmful content", 
  "Hate speech & harassment",
  "Misinformation & spam",
];

export default function Landing() {
  const { user } = useAuth();
  const { connect, isConnected, isConnecting } = useWallet();

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        {/* Hero Section */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-emerald-500/10 to-transparent" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/30 rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-emerald-500/20 rounded-full blur-3xl opacity-50" />
          
          <div className="relative max-w-7xl mx-auto px-4 py-24 sm:py-32 lg:py-40">
            <div className="text-center max-w-4xl mx-auto">
              <div className="flex flex-col items-center mb-6">
                <div className="relative inline-block">
                  <h1 
                    className="lumina-3d-title text-6xl sm:text-7xl lg:text-9xl font-black tracking-tight relative z-10"
                    data-testid="text-lumina-title"
                    style={{
                      background: 'linear-gradient(135deg, #10b981 0%, #34d399 50%, #10b981 100%)',
                      WebkitBackgroundClip: 'text',
                      backgroundClip: 'text',
                      color: 'transparent',
                      textShadow: `
                        0 1px 0 hsl(160 84% 35%),
                        0 2px 0 hsl(160 84% 30%),
                        0 3px 0 hsl(160 84% 25%),
                        0 4px 0 hsl(160 84% 20%),
                        0 5px 0 hsl(160 84% 15%),
                        0 6px 1px rgba(0,0,0,.1),
                        0 1px 3px rgba(0,0,0,.3),
                        0 3px 5px rgba(0,0,0,.2),
                        0 5px 10px rgba(0,0,0,.25),
                        0 10px 10px rgba(0,0,0,.2),
                        0 20px 20px rgba(0,0,0,.15)
                      `,
                    }}
                  >
                    Lumina
                  </h1>
                  <div 
                    className="lumina-light-orb absolute w-3 h-3 rounded-full z-20 pointer-events-none"
                    style={{
                      background: 'radial-gradient(circle, rgba(255,255,255,1) 0%, rgba(255,255,255,0.8) 40%, transparent 70%)',
                      boxShadow: '0 0 10px 4px rgba(255,255,255,0.8), 0 0 20px 8px rgba(255,255,255,0.4)',
                      animation: 'traceLetters 4s ease-in-out infinite',
                    }}
                  />
                </div>
                
                <div className="flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm mt-4">
                  <Sparkles className="h-4 w-4 text-primary" />
                  <span className="text-primary font-medium">A Social Network With Purpose</span>
                  <ChevronRight className="h-4 w-4 text-primary" />
                </div>
              </div>
              
              <style>{`
                @keyframes traceLetters {
                  0% { 
                    left: 0%; 
                    top: 20%;
                    opacity: 1;
                  }
                  5% { 
                    left: 2%; 
                    top: 80%;
                  }
                  10% { 
                    left: 8%; 
                    top: 80%;
                  }
                  15% { 
                    left: 12%; 
                    top: 20%;
                  }
                  20% { 
                    left: 16%; 
                    top: 50%;
                  }
                  25% { 
                    left: 20%; 
                    top: 80%;
                  }
                  30% { 
                    left: 28%; 
                    top: 20%;
                  }
                  35% { 
                    left: 32%; 
                    top: 50%;
                  }
                  40% { 
                    left: 36%; 
                    top: 80%;
                  }
                  45% { 
                    left: 40%; 
                    top: 20%;
                  }
                  50% { 
                    left: 48%; 
                    top: 80%;
                  }
                  55% { 
                    left: 56%; 
                    top: 20%;
                  }
                  60% { 
                    left: 60%; 
                    top: 80%;
                  }
                  65% { 
                    left: 68%; 
                    top: 20%;
                  }
                  70% { 
                    left: 72%; 
                    top: 50%;
                  }
                  75% { 
                    left: 68%; 
                    top: 80%;
                  }
                  80% { 
                    left: 76%; 
                    top: 20%;
                  }
                  85% { 
                    left: 84%; 
                    top: 80%;
                  }
                  90% { 
                    left: 92%; 
                    top: 20%;
                  }
                  95% { 
                    left: 100%; 
                    top: 50%;
                    opacity: 1;
                  }
                  100% { 
                    left: 0%; 
                    top: 20%;
                    opacity: 1;
                  }
                }
                
                .lumina-3d-title {
                  transform: perspective(500px) rotateX(5deg);
                  transform-style: preserve-3d;
                }
                
                .lumina-3d-title::before {
                  content: 'Lumina';
                  position: absolute;
                  left: 0;
                  top: 0;
                  background: linear-gradient(180deg, rgba(255,255,255,0.3) 0%, transparent 50%);
                  -webkit-background-clip: text;
                  background-clip: text;
                  color: transparent;
                  z-index: 1;
                  pointer-events: none;
                }
              `}</style>
              
              <h2 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary via-emerald-400 to-primary">
                  Uplift Humanity
                </span>
                <br />
                <span className="text-foreground text-3xl sm:text-4xl lg:text-5xl">
                  One Post at a Time
                </span>
              </h2>
              
              <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto mb-6">
                Lumina is more than a social network—it's a movement. Join a community 
                dedicated to sharing content that educates, inspires, and empowers. Get rewarded 
                for making a positive impact.
              </p>

              <p className="text-base text-muted-foreground max-w-2xl mx-auto mb-10">
                No negativity. No harmful content. Just meaningful connections and real rewards 
                on the blockchain.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {user ? (
                  <Link href="/feed">
                    <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 min-w-48 h-12 text-base" data-testid="button-go-to-feed">
                      Go to Your Feed
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                ) : (
                  <Link href="/signup">
                    <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 min-w-48 h-12 text-base" data-testid="button-join-now">
                      Join the Movement
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                )}
                
                {!isConnected && (
                  <Button
                    variant="outline"
                    size="lg"
                    className="gap-2 min-w-48 h-12 text-base border-primary/30"
                    onClick={connect}
                    disabled={isConnecting}
                    data-testid="button-hero-connect-wallet"
                  >
                    <Wallet className="h-5 w-5" />
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                )}
              </div>
              
              {/* Stats */}
              <div className="mt-16 grid grid-cols-2 md:grid-cols-4 gap-6 max-w-3xl mx-auto">
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">100%</div>
                  <div className="text-sm text-muted-foreground">Positive Content</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">Web3</div>
                  <div className="text-sm text-muted-foreground">Powered Platform</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">AXM</div>
                  <div className="text-sm text-muted-foreground">Token Rewards</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl sm:text-4xl font-bold text-primary">24/7</div>
                  <div className="text-sm text-muted-foreground">AI Moderation</div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Mission Statement */}
        <section className="py-20 bg-gradient-to-b from-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4">
            <div className="max-w-4xl mx-auto text-center">
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
                Our Mission
              </Badge>
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                A Digital Space for 
                <span className="text-primary"> What Matters</span>
              </h2>
              <p className="text-lg text-muted-foreground leading-relaxed mb-8">
                In a world where social media often amplifies the worst of humanity, Lumina stands different. 
                We've built a platform where righteousness, education, and inspiration aren't just welcomed—they're 
                rewarded. Where creators who contribute positively to society earn real value for their impact.
              </p>
              
              {/* Content Types */}
              <div className="flex flex-wrap justify-center gap-3 mt-8">
                {contentTypes.map((type, index) => (
                  <div 
                    key={index}
                    className="flex items-center gap-2 px-4 py-2 rounded-full bg-card border border-border"
                  >
                    <type.icon className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium">{type.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Features Grid */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
                Platform Features
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Built for Creators Who
                <span className="text-primary"> Make a Difference</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Everything you need to share your message, grow your audience, and earn rewards 
                for your positive contributions.
              </p>
            </div>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {platformValues.map((feature, index) => (
                <Card key={index} className="group hover-elevate bg-card/50 border-border/50">
                  <CardContent className="p-6">
                    <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-primary/20 to-emerald-500/10 flex items-center justify-center mb-5 group-hover:scale-110 transition-transform">
                      <feature.icon className="h-7 w-7 text-primary" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                    <p className="text-muted-foreground">{feature.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        </section>

        {/* Community Standards */}
        <section className="py-24 bg-muted/30">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid lg:grid-cols-2 gap-12 items-center">
              <div>
                <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
                  Community Standards
                </Badge>
                <h2 className="text-3xl sm:text-4xl font-bold mb-6">
                  A Clean, Safe Space for
                  <span className="text-primary"> Everyone</span>
                </h2>
                <p className="text-muted-foreground text-lg mb-8">
                  Lumina is committed to maintaining a platform where every user can feel safe, 
                  respected, and inspired. Our AI-powered moderation system works around the clock 
                  to ensure our community standards are upheld.
                </p>
                
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">AI-Powered Protection</h4>
                      <p className="text-sm text-muted-foreground">
                        Advanced AI scans all content to detect and remove policy violations before they spread.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Human Oversight</h4>
                      <p className="text-sm text-muted-foreground">
                        Every AI decision is reviewed by human moderators to ensure fairness and accuracy.
                      </p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <CheckCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-semibold mb-1">Fair Appeals Process</h4>
                      <p className="text-sm text-muted-foreground">
                        Mistakes happen. Our transparent appeals process ensures everyone gets a fair hearing.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="space-y-4">
                <Card className="border-destructive/20 bg-destructive/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Ban className="h-6 w-6 text-destructive" />
                      <h3 className="text-lg font-semibold">Not Allowed on Lumina</h3>
                    </div>
                    <ul className="space-y-3">
                      {prohibitedContent.map((item, index) => (
                        <li key={index} className="flex items-center gap-2 text-muted-foreground">
                          <div className="w-1.5 h-1.5 rounded-full bg-destructive" />
                          {item}
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                </Card>
                
                <Card className="border-primary/20 bg-primary/5">
                  <CardContent className="p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <Star className="h-6 w-6 text-primary" />
                      <h3 className="text-lg font-semibold">Celebrated on Lumina</h3>
                    </div>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Educational & enlightening content
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Inspirational stories & motivation
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Financial & technological insights
                      </li>
                      <li className="flex items-center gap-2 text-muted-foreground">
                        <div className="w-1.5 h-1.5 rounded-full bg-primary" />
                        Spiritual & personal growth
                      </li>
                    </ul>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* How It Works */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
                How It Works
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Start Your Journey in
                <span className="text-primary"> Three Steps</span>
              </h2>
            </div>
            
            <div className="grid md:grid-cols-3 gap-8">
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">1</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Create Your Account</h3>
                <p className="text-muted-foreground">
                  Sign up in seconds. Connect your wallet to unlock full Web3 features and start earning.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">2</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Share Quality Content</h3>
                <p className="text-muted-foreground">
                  Post videos, images, and text that educate, inspire, or entertain in a positive way.
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 border border-primary/20 flex items-center justify-center mx-auto mb-6">
                  <span className="text-2xl font-bold text-primary">3</span>
                </div>
                <h3 className="text-xl font-semibold mb-3">Earn AXM Rewards</h3>
                <p className="text-muted-foreground">
                  Get rewarded with AXM tokens for engagement, tips from fans, and community contributions.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Treasury & Rewards Section */}
        <section className="py-24 bg-gradient-to-b from-transparent via-primary/5 to-transparent">
          <div className="max-w-7xl mx-auto px-4">
            <div className="text-center mb-16">
              <Badge variant="outline" className="mb-6 border-primary/30 text-primary">
                Treasury & Rewards
              </Badge>
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Real Value, Real
                <span className="text-primary"> Rewards</span>
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto">
                Our treasury holds over 1 million AXM tokens dedicated to rewarding creators 
                who contribute positively to the community.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6 mb-12">
              <Card className="hover-elevate bg-gradient-to-br from-primary/10 to-transparent border-primary/20">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto mb-4">
                    <Wallet className="h-7 w-7 text-primary" />
                  </div>
                  <div className="text-3xl font-bold text-primary mb-2" data-testid="text-treasury-preview">
                    1,000,000+
                  </div>
                  <div className="text-sm text-muted-foreground">AXM in Rewards Pool</div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate bg-gradient-to-br from-emerald-500/10 to-transparent border-emerald-500/20">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-4">
                    <TrendingUp className="h-7 w-7 text-emerald-500" />
                  </div>
                  <div className="text-3xl font-bold text-emerald-500 mb-2">
                    Live
                  </div>
                  <div className="text-sm text-muted-foreground">On Arbitrum One</div>
                </CardContent>
              </Card>
              
              <Card className="hover-elevate bg-gradient-to-br from-amber-500/10 to-transparent border-amber-500/20">
                <CardContent className="p-6 text-center">
                  <div className="w-14 h-14 rounded-2xl bg-amber-500/20 flex items-center justify-center mx-auto mb-4">
                    <Award className="h-7 w-7 text-amber-500" />
                  </div>
                  <div className="text-3xl font-bold text-amber-500 mb-2">
                    100%
                  </div>
                  <div className="text-sm text-muted-foreground">Tips Go to Creators</div>
                </CardContent>
              </Card>
            </div>
            
            <div className="text-center">
              <Link href="/treasury">
                <Button variant="outline" size="lg" className="gap-2 border-primary/30" data-testid="button-view-treasury">
                  View Full Treasury Dashboard
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-24">
          <div className="max-w-7xl mx-auto px-4">
            <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary/20 via-emerald-500/10 to-primary/5 border border-primary/20 p-8 sm:p-12 lg:p-16">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-500/20 rounded-full blur-3xl" />
              
              <div className="relative text-center max-w-3xl mx-auto">
                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-6">
                  Ready to Make a
                  <span className="text-primary"> Difference?</span>
                </h2>
                <p className="text-lg text-muted-foreground mb-8">
                  Join thousands of creators who believe social media should inspire, not divide. 
                  Be part of a community that rewards positivity and celebrates meaningful content.
                </p>
                
                <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link href="/signup">
                    <Button size="lg" className="gap-2 shadow-lg shadow-primary/25 min-w-48 h-12 text-base" data-testid="button-cta-signup">
                      Create Free Account
                      <ArrowRight className="h-5 w-5" />
                    </Button>
                  </Link>
                  <Link href="/guidelines">
                    <Button variant="outline" size="lg" className="gap-2 border-primary/30 min-w-48 h-12 text-base" data-testid="button-view-guidelines">
                      <Shield className="h-5 w-5" />
                      View Guidelines
                    </Button>
                  </Link>
                </div>
                
                <p className="text-sm text-muted-foreground mt-8">
                  By joining, you agree to uphold our community standards and help build a more positive internet.
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-border py-12">
          <div className="max-w-7xl mx-auto px-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-12">
              <div className="col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-emerald-400 flex items-center justify-center">
                    <span className="font-bold text-lg text-primary-foreground">L</span>
                  </div>
                  <span className="font-bold text-xl">Lumina</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  Uplifting humanity through positive social media and Web3 rewards.
                </p>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Platform</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/feed" className="hover:text-primary transition-colors">Feed</Link></li>
                  <li><Link href="/foryou" className="hover:text-primary transition-colors">For You</Link></li>
                  <li><Link href="/groups" className="hover:text-primary transition-colors">Groups</Link></li>
                  <li><Link href="/nfts" className="hover:text-primary transition-colors">NFT Gallery</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Web3</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/treasury" className="hover:text-primary transition-colors">Treasury</Link></li>
                  <li><Link href="/staking" className="hover:text-primary transition-colors">Staking</Link></li>
                  <li><Link href="/governance" className="hover:text-primary transition-colors">Governance</Link></li>
                  <li><Link href="/rewards" className="hover:text-primary transition-colors">Rewards</Link></li>
                  <li><Link href="/whitepaper" className="hover:text-primary transition-colors">Whitepaper</Link></li>
                </ul>
              </div>
              
              <div>
                <h4 className="font-semibold mb-4">Community</h4>
                <ul className="space-y-2 text-sm text-muted-foreground">
                  <li><Link href="/guidelines" className="hover:text-primary transition-colors">Guidelines</Link></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                  <li><a href="#" className="hover:text-primary transition-colors">Support</a></li>
                </ul>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-8 border-t border-border">
              <p className="text-sm text-muted-foreground">
                © 2024 Lumina. All rights reserved.
              </p>
              
              <div className="flex items-center gap-4 text-sm text-muted-foreground">
                <span>Built on Arbitrum One</span>
                <span>•</span>
                <span>Powered by Lumina Protocol</span>
              </div>
            </div>
          </div>
        </footer>
      </main>
    </div>
  );
}
