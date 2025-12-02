import { useQuery } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Progress } from "@/components/ui/progress";
import { 
  BarChart3, 
  Eye, 
  Heart, 
  MessageCircle, 
  Users, 
  TrendingUp, 
  Coins, 
  FileText,
  Loader2,
  HelpCircle,
  Shield,
  Zap
} from "lucide-react";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useAuth } from "@/lib/authContext";
import { Link } from "wouter";
import type { PostWithAuthor } from "@shared/schema";
import { formatDistanceToNow } from "date-fns";
import {
  Area,
  AreaChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface AnalyticsData {
  totalPosts: number;
  totalLikes: number;
  totalComments: number;
  totalViews: number;
  totalFollowers: number;
  totalRewardPoints: number;
  estimatedAxm: string;
  topPosts: PostWithAuthor[];
  recentActivity: { date: string; likes: number; comments: number; views: number }[];
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  color = "primary",
  suffix = ""
}: { 
  title: string; 
  value: number | string;
  icon: any;
  color?: string;
  suffix?: string;
}) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold mt-1">
              {typeof value === "number" ? value.toLocaleString() : value}
              {suffix}
            </p>
          </div>
          <div className={`p-3 rounded-lg bg-${color}/10`}>
            <Icon className={`h-6 w-6 text-${color}`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function TopPostCard({ post, rank }: { post: PostWithAuthor; rank: number }) {
  return (
    <div className="flex items-start gap-3 p-3 rounded-lg hover-elevate transition-all">
      <span className="w-6 text-center font-bold text-muted-foreground">{rank}</span>
      <div className="flex-1 min-w-0">
        <p className="text-sm line-clamp-2">{post.content}</p>
        <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Heart className="h-3 w-3" />
            {post.likeCount}
          </span>
          <span className="flex items-center gap-1">
            <MessageCircle className="h-3 w-3" />
            {post.commentCount}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="h-3 w-3" />
            {post.viewCount}
          </span>
        </div>
      </div>
    </div>
  );
}

export default function Analytics() {
  const { user } = useAuth();

  const { data: analytics, isLoading } = useQuery<AnalyticsData>({
    queryKey: ["/api/analytics"],
    enabled: !!user,
  });

  if (isLoading) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  if (!analytics) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="text-center py-12">
          <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">No analytics data available</p>
        </div>
      </MainLayout>
    );
  }

  const chartData = analytics.recentActivity.map(d => ({
    date: new Date(d.date).toLocaleDateString("en-US", { month: "short", day: "numeric" }),
    likes: d.likes,
    comments: d.comments,
    views: d.views,
  }));

  const totalEngagement = analytics.totalLikes + analytics.totalComments;
  const engagementRate = analytics.totalViews > 0 
    ? ((totalEngagement / analytics.totalViews) * 100).toFixed(1)
    : "0";

  return (
    <MainLayout showRightSidebar={false}>
      <div className="max-w-6xl mx-auto space-y-6 p-4">
        <div className="relative overflow-hidden rounded-xl bg-gradient-to-br from-purple-500/20 via-pink-500/15 to-cyan-500/20 p-6 border border-primary/20">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,_var(--tw-gradient-stops))] from-blue-600/10 via-transparent to-transparent" />
          <div className="absolute top-4 right-4 h-20 w-20 rounded-full bg-gradient-to-br from-cyan-400/20 to-purple-500/20 blur-2xl" />
          
          <div className="relative z-10">
            <div className="flex items-center justify-between mb-4 flex-wrap gap-4">
              <div className="flex items-center gap-3">
                <div className="h-12 w-12 rounded-xl bg-gradient-to-br from-primary to-purple-600 flex items-center justify-center shadow-lg shadow-primary/30">
                  <BarChart3 className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-white to-gray-300 bg-clip-text text-transparent">
                    Creator Analytics
                  </h1>
                  <p className="text-sm text-muted-foreground">
                    Track performance & earn AXM rewards on Arbitrum One
                  </p>
                </div>
              </div>
              {user && (
                <Link href={`/profile/${user.id}`}>
                  <div className="flex items-center gap-3 px-4 py-2 rounded-lg bg-background/50 border border-primary/20 backdrop-blur-sm">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={user.avatarUrl || undefined} />
                      <AvatarFallback className="bg-primary/20 text-primary">
                        {(user.displayName || user.username).charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="font-medium">{user.displayName || user.username}</p>
                      <p className="text-xs text-muted-foreground">@{user.username}</p>
                    </div>
                  </div>
                </Link>
              )}
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6">
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-primary/20">
                <div className="flex items-center gap-2">
                  <Eye className="h-4 w-4 text-purple-400" />
                  <span className="text-xs text-muted-foreground">Views</span>
                </div>
                <p className="text-sm font-medium mt-1">{analytics.totalViews.toLocaleString()}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-red-500/20">
                <div className="flex items-center gap-2">
                  <Heart className="h-4 w-4 text-red-400" />
                  <span className="text-xs text-muted-foreground">Likes</span>
                </div>
                <p className="text-sm font-medium mt-1">{analytics.totalLikes.toLocaleString()}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-green-500/20">
                <div className="flex items-center gap-2">
                  <Coins className="h-4 w-4 text-green-400" />
                  <span className="text-xs text-muted-foreground">AXM Earned</span>
                </div>
                <p className="text-sm font-medium mt-1">{analytics.estimatedAxm}</p>
              </div>
              <div className="bg-background/50 backdrop-blur-sm rounded-lg p-3 border border-cyan-500/20">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-cyan-400" />
                  <span className="text-xs text-muted-foreground">Network</span>
                </div>
                <p className="text-sm font-medium mt-1">Arbitrum L2</p>
              </div>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatCard title="Total Posts" value={analytics.totalPosts} icon={FileText} />
          <StatCard title="Total Likes" value={analytics.totalLikes} icon={Heart} color="red-500" />
          <StatCard title="Total Comments" value={analytics.totalComments} icon={MessageCircle} color="blue-500" />
          <StatCard title="Total Views" value={analytics.totalViews} icon={Eye} color="purple-500" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Followers</p>
                  <p className="text-3xl font-bold mt-1">{analytics.totalFollowers.toLocaleString()}</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Engagement Rate</p>
                  <p className="text-3xl font-bold mt-1">{engagementRate}%</p>
                </div>
                <div className="p-3 rounded-lg bg-yellow-500/10">
                  <TrendingUp className="h-6 w-6 text-yellow-500" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-primary/20 to-emerald-500/10 border-primary/30">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Estimated AXM Earnings</p>
                  <p className="text-3xl font-bold mt-1 text-primary">{analytics.estimatedAxm}</p>
                  <p className="text-xs text-muted-foreground mt-1">{analytics.totalRewardPoints.toLocaleString()} points</p>
                </div>
                <div className="p-3 rounded-lg bg-primary/20">
                  <Coins className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="text-lg">Activity Over Time</CardTitle>
            </CardHeader>
            <CardContent>
              {chartData.length === 0 ? (
                <div className="h-64 flex items-center justify-center text-muted-foreground">
                  No activity data for the past 30 days
                </div>
              ) : (
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={chartData}>
                    <defs>
                      <linearGradient id="colorLikes" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                      </linearGradient>
                      <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="date" 
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="#888888"
                      fontSize={12}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        border: "1px solid hsl(var(--border))",
                        borderRadius: "8px",
                      }}
                    />
                    <Area
                      type="monotone"
                      dataKey="views"
                      stroke="#8b5cf6"
                      fillOpacity={1}
                      fill="url(#colorViews)"
                      name="Views"
                    />
                    <Area
                      type="monotone"
                      dataKey="likes"
                      stroke="hsl(var(--primary))"
                      fillOpacity={1}
                      fill="url(#colorLikes)"
                      name="Likes"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Top Performing Posts</CardTitle>
            </CardHeader>
            <CardContent>
              {analytics.topPosts.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No posts yet
                </div>
              ) : (
                <div className="space-y-2">
                  {analytics.topPosts.map((post, index) => (
                    <TopPostCard key={post.id} post={post} rank={index + 1} />
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              Reward Progress
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <div className="flex justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Points to next reward tier</span>
                  <span className="font-mono">{analytics.totalRewardPoints} / 1000</span>
                </div>
                <Progress value={(analytics.totalRewardPoints % 1000) / 10} className="h-3" />
              </div>
              <p className="text-sm text-muted-foreground">
                Earn points by creating content, receiving likes, comments, and followers. 
                Points convert to AXM tokens at a rate of 100 points = 1 AXM.
              </p>
            </div>
          </CardContent>
        </Card>

        <Card className="border-primary/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              <HelpCircle className="h-5 w-5 text-primary" />
              Analytics Guide
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="earnings">
                <AccordionTrigger className="text-sm">How do I earn AXM tokens?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  You earn reward points through engagement. Every like, comment, and view on your content 
                  earns points. 100 points = 1 AXM token. Create quality content and engage with the community 
                  to maximize your earnings on Arbitrum One.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="metrics">
                <AccordionTrigger className="text-sm">What metrics are tracked?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <div className="space-y-1">
                    <p><strong>Views:</strong> Total views across all your content</p>
                    <p><strong>Likes:</strong> Total hearts received on posts</p>
                    <p><strong>Comments:</strong> Engagement through discussions</p>
                    <p><strong>Followers:</strong> Users following your profile</p>
                    <p><strong>Engagement Rate:</strong> Interactions divided by views</p>
                  </div>
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="on-chain">
                <AccordionTrigger className="text-sm">Is analytics data stored on-chain?</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  Analytics data is stored off-chain for performance, but reward distributions and token 
                  earnings are recorded on the Arbitrum One blockchain. This ensures transparent, verifiable 
                  earnings while maintaining fast analytics processing.
                </AccordionContent>
              </AccordionItem>
              <AccordionItem value="tips">
                <AccordionTrigger className="text-sm">Tips to grow your analytics</AccordionTrigger>
                <AccordionContent className="text-sm text-muted-foreground">
                  <ol className="list-decimal list-inside space-y-1">
                    <li>Post consistently with quality content</li>
                    <li>Engage with your followers in comments</li>
                    <li>Share video content for higher engagement</li>
                    <li>Use trending topics and hashtags</li>
                    <li>Collaborate with other creators</li>
                  </ol>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-r from-blue-500/10 via-purple-500/10 to-cyan-500/10 border-primary/20">
          <CardContent className="p-4">
            <div className="flex items-start gap-3">
              <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                <Zap className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="text-sm font-medium">Boost Your Earnings</p>
                <p className="text-xs text-muted-foreground">
                  Verified creators earn 2x reward points. Complete verification to double your AXM earnings 
                  and unlock exclusive creator features.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
