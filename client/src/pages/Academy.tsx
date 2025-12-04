import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Flame,
  BookOpen,
  Award,
  Users,
  Clock,
  CheckCircle,
  Play,
  RefreshCw,
  ExternalLink,
  TrendingUp,
  Star,
  Lock,
  Unlock,
  Info,
  Shield,
  Coins,
  Target,
  Sparkles,
  Video,
  Wallet,
  Vote,
  Zap,
  Trophy,
  Gift,
  Megaphone,
  Heart,
  Share2,
  MessageCircle,
  Camera
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useWallet } from "@/lib/walletContext";
import { useAcademyContract, CourseInfo, Enrollment, Certification } from "@/lib/useContracts";
import { CONTRACT_ADDRESSES, getExplorerUrl } from "@/lib/contracts";

const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const COURSE_STATUS = ['Draft', 'Published', 'Archived'];
const CERT_TYPES = ['Completion', 'Excellence', 'Mastery', 'Instructor'];

const COURSE_CATEGORIES = [
  {
    id: 'creator',
    name: 'Creator Foundations',
    icon: Video,
    color: 'from-pink-500/20 to-rose-500/10',
    iconColor: 'text-pink-500',
    description: 'Master content creation and grow your audience',
    courses: [
      { id: 101, title: 'Content That Connects', description: 'Learn to create viral short-form videos that resonate with your audience', lessons: 8, duration: '2 hours', level: 0, badge: 'Creator I' },
      { id: 102, title: 'Building Your Brand', description: 'Profile optimization, niche selection, and consistency strategies', lessons: 6, duration: '1.5 hours', level: 0, badge: 'Brand Builder' },
      { id: 103, title: 'Engagement Secrets', description: 'Timing, hashtags, community building, and algorithm mastery', lessons: 10, duration: '3 hours', level: 1, badge: 'Engagement Pro' },
      { id: 104, title: 'Going Live', description: 'Streaming tips, audience interaction, and live monetization', lessons: 7, duration: '2 hours', level: 1, badge: 'Live Expert' },
    ]
  },
  {
    id: 'web3',
    name: 'Web3 Mastery',
    icon: Wallet,
    color: 'from-blue-500/20 to-cyan-500/10',
    iconColor: 'text-blue-500',
    description: 'Understand blockchain, crypto, and decentralized tech',
    courses: [
      { id: 201, title: 'Crypto 101', description: 'Wallets, transactions, gas fees, and blockchain basics explained simply', lessons: 12, duration: '4 hours', level: 0, badge: 'Crypto Novice' },
      { id: 202, title: 'Your First NFT', description: 'Creating, minting, and selling digital art on the blockchain', lessons: 8, duration: '2.5 hours', level: 1, badge: 'NFT Creator' },
      { id: 203, title: 'Understanding DeFi', description: 'Staking, liquidity provision, yield farming, and DEX fundamentals', lessons: 10, duration: '3.5 hours', level: 2, badge: 'DeFi Expert' },
      { id: 204, title: 'DAO Participation', description: 'How to vote, create proposals, and govern decentralized organizations', lessons: 6, duration: '2 hours', level: 1, badge: 'DAO Citizen' },
    ]
  },
  {
    id: 'monetization',
    name: 'Monetization & Growth',
    icon: Coins,
    color: 'from-amber-500/20 to-yellow-500/10',
    iconColor: 'text-amber-500',
    description: 'Turn your passion into sustainable income',
    courses: [
      { id: 301, title: 'Earning AXM', description: 'All the ways to earn tokens on Lumina through content and engagement', lessons: 8, duration: '2 hours', level: 0, badge: 'Token Earner' },
      { id: 302, title: 'Tipping Economy', description: 'How to receive and give tips effectively, building supporter relationships', lessons: 5, duration: '1.5 hours', level: 0, badge: 'Tip Master' },
      { id: 303, title: 'Building Paid Communities', description: 'Premium content strategies, subscriptions, and exclusive access', lessons: 10, duration: '3 hours', level: 2, badge: 'Community Leader' },
      { id: 304, title: 'Referral Mastery', description: 'Growing your network for rewards and building viral loops', lessons: 6, duration: '2 hours', level: 1, badge: 'Growth Hacker' },
    ]
  },
  {
    id: 'community',
    name: 'Community & Advocacy',
    icon: Heart,
    color: 'from-emerald-500/20 to-green-500/10',
    iconColor: 'text-emerald-500',
    description: 'Lead and inspire positive change',
    courses: [
      { id: 401, title: 'Leading Groups', description: 'How to create, grow, and moderate thriving communities', lessons: 8, duration: '2.5 hours', level: 1, badge: 'Group Leader' },
      { id: 402, title: 'Positive Impact', description: 'Creating content for social good and meaningful change', lessons: 6, duration: '2 hours', level: 0, badge: 'Change Maker' },
      { id: 403, title: 'Volunteer Training', description: 'Become a platform ambassador and help others succeed', lessons: 5, duration: '1.5 hours', level: 0, badge: 'Ambassador' },
      { id: 404, title: 'Safety & Guidelines', description: 'Understanding content moderation and community standards', lessons: 4, duration: '1 hour', level: 0, badge: 'Safety Champion' },
    ]
  }
];

const PLATFORM_UNLOCKS = [
  { track: 'Creator Foundations', unlock: '"Certified Creator" badge on profile', icon: Award },
  { track: 'Web3 Mastery', unlock: 'Access to advanced DeFi features', icon: Unlock },
  { track: 'Monetization', unlock: 'Priority in discovery algorithm', icon: TrendingUp },
  { track: 'Community', unlock: 'Ability to create verified groups', icon: Shield },
];

export default function Academy() {
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const academy = useAcademyContract();
  
  const [totalCourses, setTotalCourses] = useState<number>(0);
  const [totalEnrollments, setTotalEnrollments] = useState<number>(0);
  const [totalCertifications, setTotalCertifications] = useState<number>(0);
  const [userIsInstructor, setUserIsInstructor] = useState<boolean>(false);
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<number[]>([]);
  const [enrollments, setEnrollments] = useState<Map<number, Enrollment>>(new Map());
  const [certificationIds, setCertificationIds] = useState<number[]>([]);
  const [certifications, setCertifications] = useState<Certification[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [enrollingCourse, setEnrollingCourse] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const [coursesCount, enrollCount, certCount] = await Promise.all([
        academy.getTotalCourses(),
        academy.getTotalEnrollments(),
        academy.getTotalCertifications(),
      ]);
      
      setTotalCourses(coursesCount);
      setTotalEnrollments(enrollCount);
      setTotalCertifications(certCount);

      if (isConnected && address) {
        const [isInst, studentCourseIds, studentCertIds] = await Promise.all([
          academy.isInstructor(address),
          academy.getStudentCourses(address),
          academy.getStudentCertifications(address),
        ]);
        setUserIsInstructor(isInst);
        setEnrolledCourseIds(studentCourseIds);
        setCertificationIds(studentCertIds);

        const enrollmentPromises = studentCourseIds.map((id: number) => 
          academy.getEnrollment(id, address)
        );
        const enrollmentResults = await Promise.all(enrollmentPromises);
        const enrollmentMap = new Map<number, Enrollment>();
        studentCourseIds.forEach((id: number, index: number) => {
          if (enrollmentResults[index]) {
            enrollmentMap.set(id, enrollmentResults[index]!);
          }
        });
        setEnrollments(enrollmentMap);

        const certPromises = studentCertIds.map((id: number) => 
          academy.getCertification(id)
        );
        const certResults = await Promise.all(certPromises);
        setCertifications(certResults.filter((c): c is Certification => c !== null));
      }

      const coursePromises = [];
      for (let i = 1; i <= Math.min(coursesCount, 20); i++) {
        coursePromises.push(academy.getCourse(i));
      }
      const courseResults = await Promise.all(coursePromises);
      setCourses(courseResults.filter((c): c is CourseInfo => c !== null && c.status === 1));

    } catch (error) {
      console.error('Failed to fetch academy data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [isConnected, address]);

  const handleEnroll = async (courseId: number) => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to enroll in courses",
        variant: "destructive",
      });
      return;
    }

    setEnrollingCourse(courseId);
    try {
      const txHash = await academy.enrollInCourse(courseId);
      toast({
        title: "Enrollment Successful",
        description: `Welcome to The Forge! Your journey begins. TX: ${txHash?.slice(0, 10)}...`,
      });
      await fetchData();
    } catch (error: any) {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setEnrollingCourse(null);
    }
  };

  const getLevelColor = (level: number) => {
    switch (level) {
      case 0: return "bg-green-500/10 text-green-500 border-green-500/20";
      case 1: return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case 2: return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case 3: return "bg-orange-500/10 text-orange-500 border-orange-500/20";
      default: return "bg-muted text-muted-foreground";
    }
  };

  const completedTracks = COURSE_CATEGORIES.map(cat => {
    const catCourses = cat.courses;
    const completedCount = catCourses.filter(c => enrolledCourseIds.includes(c.id)).length;
    return { ...cat, completed: completedCount, total: catCourses.length };
  });

  const totalXP = enrolledCourseIds.length * 100;
  const currentLevel = Math.floor(totalXP / 500) + 1;
  const xpToNextLevel = 500 - (totalXP % 500);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-6xl">

        <div className="flex items-center gap-4 mb-8">
          <Link href="/">
            <Button variant="ghost" size="icon" data-testid="button-back">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold flex items-center gap-3" data-testid="text-forge-title">
              <div className="h-10 w-10 rounded-lg bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                <Flame className="h-6 w-6 text-white" />
              </div>
              The Forge
            </h1>
            <p className="text-muted-foreground mt-1">
              Where creators are made. Learn, grow, and unlock your potential.
            </p>
          </div>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchData}
            disabled={isLoading}
            data-testid="button-refresh"
          >
            <RefreshCw className={`h-4 w-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </div>

        {/* Hero Section */}
        <Card className="mb-8 overflow-hidden border-0 bg-gradient-to-r from-orange-500/10 via-amber-500/10 to-yellow-500/10">
          <CardContent className="p-8">
            <div className="grid md:grid-cols-2 gap-8 items-center">
              <div className="space-y-4">
                <Badge className="bg-orange-500/20 text-orange-500 border-orange-500/30">
                  <Flame className="h-3 w-3 mr-1" />
                  Learn to Earn
                </Badge>
                <h2 className="text-2xl md:text-3xl font-bold">
                  Forge Your Path to Success
                </h2>
                <p className="text-muted-foreground">
                  The Forge transforms beginners into expert creators. Complete courses, earn XP, 
                  unlock platform features, and receive on-chain certifications that prove your skills.
                </p>
                <div className="flex flex-wrap gap-3">
                  <div className="flex items-center gap-2 text-sm">
                    <Zap className="h-4 w-4 text-amber-500" />
                    <span>Earn XP & Level Up</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Trophy className="h-4 w-4 text-amber-500" />
                    <span>NFT Certificates</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm">
                    <Gift className="h-4 w-4 text-amber-500" />
                    <span>AXM Rewards</span>
                  </div>
                </div>
              </div>
              <div className="flex justify-center">
                <div className="relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500/30 to-amber-500/30 rounded-full blur-3xl" />
                  <div className="relative grid grid-cols-2 gap-4">
                    {COURSE_CATEGORIES.slice(0, 4).map((cat, i) => (
                      <div key={cat.id} className={`p-4 rounded-xl bg-gradient-to-br ${cat.color} border border-white/10`}>
                        <cat.icon className={`h-6 w-6 ${cat.iconColor} mb-2`} />
                        <p className="text-sm font-medium">{cat.name}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* XP & Progress Section */}
        {isConnected && (
          <Card className="mb-8 border-primary/20">
            <CardContent className="p-6">
              <div className="flex flex-col md:flex-row md:items-center gap-6">
                <div className="flex items-center gap-4">
                  <div className="h-16 w-16 rounded-full bg-gradient-to-br from-orange-500 to-amber-600 flex items-center justify-center">
                    <span className="text-2xl font-bold text-white">{currentLevel}</span>
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Current Level</p>
                    <p className="text-xl font-bold">Forge Apprentice</p>
                  </div>
                </div>
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-2">
                    <span className="text-muted-foreground">XP Progress</span>
                    <span className="font-medium">{totalXP} XP</span>
                  </div>
                  <Progress value={(totalXP % 500) / 5} className="h-3" />
                  <p className="text-xs text-muted-foreground mt-1">{xpToNextLevel} XP to next level</p>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-primary">{enrolledCourseIds.length}</p>
                    <p className="text-xs text-muted-foreground">Enrolled</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-amber-500">{certificationIds.length}</p>
                    <p className="text-xs text-muted-foreground">Certified</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Platform Unlocks */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Unlock className="h-5 w-5 text-primary" />
              What You'll Unlock
            </CardTitle>
            <CardDescription>
              Complete tracks to unlock exclusive platform features
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {PLATFORM_UNLOCKS.map((unlock, i) => (
                <div key={i} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <unlock.icon className="h-5 w-5 text-primary mt-0.5" />
                  <div>
                    <p className="font-medium text-sm">{unlock.track}</p>
                    <p className="text-xs text-muted-foreground mt-1">{unlock.unlock}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Stats Grid */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover-elevate" data-testid="card-total-courses">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-total-courses">
                {COURSE_CATEGORIES.reduce((acc, cat) => acc + cat.courses.length, 0)}
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Across {COURSE_CATEGORIES.length} tracks
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-total-learners">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Learners</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-enrollments">
                  {totalEnrollments.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Growing community
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-certifications">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certificates Minted</CardTitle>
              <Award className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-certs">
                  {totalCertifications.toLocaleString()}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                On-chain credentials
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-completion-rate">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold" data-testid="text-completion-rate">
                87%
              </div>
              <p className="text-xs text-muted-foreground mt-1">
                Industry leading
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Course Categories */}
        <Tabs defaultValue="all" className="space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <TabsList className="grid grid-cols-5 w-full sm:w-auto">
              <TabsTrigger value="all" data-testid="tab-all">All</TabsTrigger>
              <TabsTrigger value="creator" data-testid="tab-creator">Creator</TabsTrigger>
              <TabsTrigger value="web3" data-testid="tab-web3">Web3</TabsTrigger>
              <TabsTrigger value="monetization" data-testid="tab-monetization">Earn</TabsTrigger>
              <TabsTrigger value="community" data-testid="tab-community">Community</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value="all" className="space-y-8">
            {COURSE_CATEGORIES.map((category) => (
              <div key={category.id} className="space-y-4">
                <div className="flex items-center gap-3">
                  <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                    <category.icon className={`h-5 w-5 ${category.iconColor}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{category.name}</h3>
                    <p className="text-sm text-muted-foreground">{category.description}</p>
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                  {category.courses.map((course) => (
                    <Card key={course.id} className="hover-elevate" data-testid={`card-course-${course.id}`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-base line-clamp-2">{course.title}</CardTitle>
                        </div>
                        <Badge className={getLevelColor(course.level)} variant="outline">
                          {COURSE_LEVELS[course.level]}
                        </Badge>
                      </CardHeader>
                      <CardContent className="pb-3">
                        <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                          {course.description}
                        </p>
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <BookOpen className="h-3 w-3" />
                            {course.lessons} lessons
                          </span>
                          <span className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {course.duration}
                          </span>
                        </div>
                      </CardContent>
                      <CardFooter className="pt-0">
                        {enrolledCourseIds.includes(course.id) ? (
                          <Button variant="secondary" size="sm" className="w-full" disabled>
                            <CheckCircle className="h-4 w-4 mr-2" />
                            Enrolled
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            className="w-full" 
                            onClick={() => handleEnroll(course.id)}
                            disabled={enrollingCourse === course.id || !isConnected}
                            data-testid={`button-enroll-${course.id}`}
                          >
                            {enrollingCourse === course.id ? (
                              <>
                                <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                                Enrolling...
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Course
                              </>
                            )}
                          </Button>
                        )}
                      </CardFooter>
                      <div className="px-4 pb-4">
                        <div className="flex items-center gap-2 text-xs">
                          <Trophy className="h-3 w-3 text-amber-500" />
                          <span className="text-muted-foreground">Earns: <span className="text-foreground font-medium">{course.badge}</span></span>
                        </div>
                      </div>
                    </Card>
                  ))}
                </div>
              </div>
            ))}
          </TabsContent>

          {COURSE_CATEGORIES.map((category) => (
            <TabsContent key={category.id} value={category.id} className="space-y-6">
              <div className="flex items-center gap-4 mb-6">
                <div className={`h-14 w-14 rounded-xl bg-gradient-to-br ${category.color} flex items-center justify-center`}>
                  <category.icon className={`h-7 w-7 ${category.iconColor}`} />
                </div>
                <div>
                  <h2 className="text-xl font-bold">{category.name}</h2>
                  <p className="text-muted-foreground">{category.description}</p>
                </div>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                {category.courses.map((course) => (
                  <Card key={course.id} className="hover-elevate" data-testid={`card-course-${course.id}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start gap-4">
                        <div className={`h-12 w-12 rounded-lg bg-gradient-to-br ${category.color} flex items-center justify-center shrink-0`}>
                          <category.icon className={`h-6 w-6 ${category.iconColor}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-2 mb-1">
                            <h3 className="font-semibold">{course.title}</h3>
                            <Badge className={getLevelColor(course.level)} variant="outline">
                              {COURSE_LEVELS[course.level]}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground mb-3">
                            {course.description}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground mb-4">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-4 w-4" />
                              {course.lessons} lessons
                            </span>
                            <span className="flex items-center gap-1">
                              <Clock className="h-4 w-4" />
                              {course.duration}
                            </span>
                          </div>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2 text-sm">
                              <Trophy className="h-4 w-4 text-amber-500" />
                              <span>Earns: <span className="font-medium">{course.badge}</span></span>
                            </div>
                            {enrolledCourseIds.includes(course.id) ? (
                              <Button variant="secondary" size="sm" disabled>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Enrolled
                              </Button>
                            ) : (
                              <Button 
                                size="sm"
                                onClick={() => handleEnroll(course.id)}
                                disabled={enrollingCourse === course.id || !isConnected}
                                data-testid={`button-enroll-${course.id}`}
                              >
                                {enrollingCourse === course.id ? (
                                  <RefreshCw className="h-4 w-4 animate-spin" />
                                ) : (
                                  <>
                                    <Play className="h-4 w-4 mr-2" />
                                    Start
                                  </>
                                )}
                              </Button>
                            )}
                          </div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          ))}
        </Tabs>

        {/* My Progress Section */}
        {isConnected && enrolledCourseIds.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Flame className="h-5 w-5 text-orange-500" />
              Your Forge Progress
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {completedTracks.map((track) => (
                <Card key={track.id} className="hover-elevate">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`h-10 w-10 rounded-lg bg-gradient-to-br ${track.color} flex items-center justify-center`}>
                        <track.icon className={`h-5 w-5 ${track.iconColor}`} />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{track.name}</p>
                        <p className="text-xs text-muted-foreground">{track.completed}/{track.total} courses</p>
                      </div>
                    </div>
                    <Progress value={(track.completed / track.total) * 100} className="h-2" />
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Certificates Section */}
        {isConnected && certificationIds.length > 0 && (
          <div className="mt-12">
            <h2 className="text-xl font-bold mb-6 flex items-center gap-2">
              <Award className="h-5 w-5 text-amber-500" />
              Your Certificates
            </h2>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {certifications.map((cert) => (
                <Card key={cert.certificationId} className="overflow-hidden hover-elevate">
                  <div className="h-24 bg-gradient-to-r from-amber-500/20 via-orange-500/20 to-yellow-500/20 flex items-center justify-center">
                    <Award className="h-12 w-12 text-amber-500/50" />
                  </div>
                  <CardContent className="p-4">
                    <Badge className="mb-2">{CERT_TYPES[cert.certificationType]}</Badge>
                    <h3 className="font-semibold">Certificate #{cert.certificationId}</h3>
                    <p className="text-sm text-muted-foreground mt-1">
                      Issued on-chain • Verified credential
                    </p>
                    <Button variant="outline" size="sm" className="w-full mt-3" asChild>
                      <a href={getExplorerUrl(CONTRACT_ADDRESSES.ACADEMY_HUB)} target="_blank" rel="noopener noreferrer">
                        <ExternalLink className="h-4 w-4 mr-2" />
                        View on Chain
                      </a>
                    </Button>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* CTA Section */}
        {!isConnected && (
          <Card className="mt-12 border-orange-500/30 bg-gradient-to-r from-orange-500/5 to-amber-500/5">
            <CardContent className="p-8 text-center">
              <Flame className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ready to Enter The Forge?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Connect your wallet to start learning, earning XP, and collecting on-chain certificates 
                that unlock exclusive platform features.
              </p>
              <Button size="lg" className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600">
                <Wallet className="h-5 w-5 mr-2" />
                Connect Wallet to Start
              </Button>
            </CardContent>
          </Card>
        )}

      </main>
    </div>
  );
}
