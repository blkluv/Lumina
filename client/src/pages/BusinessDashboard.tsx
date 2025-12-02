import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { MainLayout } from "@/components/layout/MainLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/lib/authContext";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { Link } from "wouter";
import { formatDistanceToNow, format, addDays, startOfWeek, endOfWeek, eachDayOfInterval } from "date-fns";
import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Users,
  Eye,
  MousePointer,
  Phone,
  Mail,
  Globe,
  Calendar,
  Clock,
  Megaphone,
  Target,
  DollarSign,
  Zap,
  Plus,
  Play,
  Pause,
  Trash2,
  Edit,
  FileText,
  Send,
  UserPlus,
  MessageCircle,
  ArrowUpRight,
  Building2,
  Loader2,
  Settings,
  Sparkles,
  LineChart,
  PieChart,
  AlertCircle,
  Heart,
  Share2,
  Bookmark,
  Video,
  Image,
  FileType,
  Hash,
  MapPin,
  ChevronRight,
  ChevronLeft,
  Search,
  Filter,
  Download,
  Upload,
  Inbox,
  Reply,
  Star,
  Flag,
  Hand,
  Vote,
  ClipboardList,
  Repeat,
  Award,
  Trophy,
  Gift,
  CreditCard,
  Wallet,
  ShoppingBag,
  Package,
  Link2,
  ExternalLink,
  Copy,
  Check,
  X,
  MoreHorizontal,
  RefreshCw,
} from "lucide-react";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  PieChart as RePieChart,
  Pie,
  Cell,
  Legend,
  Line,
  LineChart as ReLineChart,
  CartesianGrid,
} from "recharts";
import type { BusinessPromotion, ScheduledPost, BusinessLead, PostWithAuthor } from "@shared/schema";

interface ContentMetrics {
  id: string;
  type: "post" | "reel" | "story" | "video";
  thumbnail?: string;
  caption: string;
  reach: number;
  impressions: number;
  engagement: number;
  likes: number;
  comments: number;
  shares: number;
  saves: number;
  watchTime?: number;
  completionRate?: number;
  createdAt: string;
}

interface ScheduledItem {
  id: string;
  content: string;
  type: "post" | "reel" | "story";
  scheduledFor: string;
  status: "scheduled" | "published" | "failed";
  mediaUrl?: string;
}

interface LeadContact {
  id: string;
  name: string;
  email: string;
  phone?: string;
  source: string;
  status: "new" | "contacted" | "qualified" | "converted" | "lost";
  tags: string[];
  notes?: string;
  supportLevel?: number;
  createdAt: string;
  lastContactedAt?: string;
}

interface AdvocacyAction {
  id: string;
  type: "petition" | "call" | "email" | "event" | "volunteer";
  title: string;
  description: string;
  target?: string;
  goal: number;
  current: number;
  status: "active" | "completed" | "paused";
  endDate?: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  content: string;
  category: string;
  usageCount: number;
}

interface CompetitorProfile {
  id: string;
  name: string;
  username: string;
  avatarUrl?: string;
  followers: number;
  posts: number;
  engagement: number;
  growth: number;
}

interface RevenueStream {
  source: string;
  amount: number;
  transactions: number;
  growth: number;
}

interface BusinessDashboardData {
  overview: {
    totalProfileViews: number;
    totalImpressions: number;
    totalEngagements: number;
    totalFollowers: number;
    followerGrowth: number;
    websiteClicks: number;
    phoneClicks: number;
    emailClicks: number;
    directMessages: number;
    reachRate: number;
    engagementRate: number;
  };
  weeklyTrend: { date: string; views: number; engagements: number; followers: number; reach: number }[];
  contentPerformance: ContentMetrics[];
  topPosts: PostWithAuthor[];
  promotions: BusinessPromotion[];
  scheduledPosts: ScheduledItem[];
  leads: LeadContact[];
  advocacyActions: AdvocacyAction[];
  messageTemplates: MessageTemplate[];
  competitors: CompetitorProfile[];
  revenue: {
    total: number;
    streams: RevenueStream[];
    monthlyTrend: { month: string; revenue: number; tips: number; donations: number }[];
  };
  audienceInsights: {
    demographics: { label: string; value: number; color: string }[];
    genderSplit: { label: string; value: number; color: string }[];
    bestPostingTimes: { hour: number; engagement: number }[];
    topLocations: { location: string; percentage: number }[];
    interests: { interest: string; percentage: number }[];
    deviceTypes: { device: string; percentage: number }[];
  };
  responseMetrics: {
    averageResponseTime: number;
    responseRate: number;
    unreadMessages: number;
    totalConversations: number;
  };
}

function StatCard({ 
  title, 
  value, 
  icon: Icon, 
  trend,
  trendLabel,
  color = "primary",
  subtitle,
}: { 
  title: string; 
  value: number | string;
  icon: any;
  trend?: number;
  trendLabel?: string;
  color?: string;
  subtitle?: string;
}) {
  const trendColor = trend && trend > 0 ? "text-green-500" : trend && trend < 0 ? "text-red-500" : "text-muted-foreground";
  const TrendIcon = trend && trend > 0 ? TrendingUp : TrendingDown;
  
  return (
    <Card data-testid={`stat-card-${title.toLowerCase().replace(/\s+/g, '-')}`}>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">
              {typeof value === "number" ? value.toLocaleString() : value}
            </p>
            {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
            {trend !== undefined && (
              <p className={`text-xs flex items-center gap-1 ${trendColor}`}>
                <TrendIcon className="h-3 w-3" />
                {Math.abs(trend)}% {trendLabel || "vs last week"}
              </p>
            )}
          </div>
          <div className={`p-3 rounded-lg bg-primary/10`}>
            <Icon className={`h-6 w-6 text-primary`} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ContentCard({ content, onView }: { content: ContentMetrics; onView: () => void }) {
  const typeIcons = {
    post: Image,
    reel: Video,
    story: Clock,
    video: Video,
  };
  const TypeIcon = typeIcons[content.type];

  return (
    <Card className="hover-elevate cursor-pointer" onClick={onView} data-testid={`content-card-${content.id}`}>
      <CardContent className="p-4">
        <div className="flex gap-4">
          <div className="relative w-20 h-20 rounded-lg bg-muted flex items-center justify-center flex-shrink-0 overflow-hidden">
            {content.thumbnail ? (
              <img src={content.thumbnail} alt="" className="w-full h-full object-cover" />
            ) : (
              <TypeIcon className="h-8 w-8 text-muted-foreground" />
            )}
            <Badge className="absolute top-1 left-1 text-[10px] px-1.5 py-0" variant="secondary">
              {content.type}
            </Badge>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm line-clamp-2 mb-2">{content.caption}</p>
            <div className="grid grid-cols-4 gap-2 text-xs text-muted-foreground">
              <div className="flex items-center gap-1">
                <Eye className="h-3 w-3" />
                {content.reach.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Heart className="h-3 w-3" />
                {content.likes.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <MessageCircle className="h-3 w-3" />
                {content.comments.toLocaleString()}
              </div>
              <div className="flex items-center gap-1">
                <Share2 className="h-3 w-3" />
                {content.shares.toLocaleString()}
              </div>
            </div>
            {content.completionRate !== undefined && (
              <div className="mt-2">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">Watch completion</span>
                  <span>{content.completionRate}%</span>
                </div>
                <Progress value={content.completionRate} className="h-1.5" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function ScheduleCalendar({ items, onAddPost }: { items: ScheduledItem[]; onAddPost: (date: Date) => void }) {
  const [currentWeek, setCurrentWeek] = useState(new Date());
  const weekStart = startOfWeek(currentWeek, { weekStartsOn: 0 });
  const weekEnd = endOfWeek(currentWeek, { weekStartsOn: 0 });
  const days = eachDayOfInterval({ start: weekStart, end: weekEnd });

  const getItemsForDay = (date: Date) => {
    return items.filter(item => {
      const itemDate = new Date(item.scheduledFor);
      return format(itemDate, 'yyyy-MM-dd') === format(date, 'yyyy-MM-dd');
    });
  };

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Calendar className="h-5 w-5 text-primary" />
            Content Schedule
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setCurrentWeek(addDays(currentWeek, -7))}
              data-testid="button-prev-week"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            <span className="text-sm font-medium min-w-[140px] text-center">
              {format(weekStart, 'MMM d')} - {format(weekEnd, 'MMM d, yyyy')}
            </span>
            <Button 
              size="icon" 
              variant="ghost" 
              onClick={() => setCurrentWeek(addDays(currentWeek, 7))}
              data-testid="button-next-week"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-7 gap-2">
          {days.map((day, index) => {
            const dayItems = getItemsForDay(day);
            const isToday = format(day, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
            
            return (
              <div 
                key={index} 
                className={`min-h-[120px] p-2 rounded-lg border ${isToday ? 'border-primary bg-primary/5' : 'border-border'}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className={`text-xs font-medium ${isToday ? 'text-primary' : 'text-muted-foreground'}`}>
                    {format(day, 'EEE')}
                  </span>
                  <span className={`text-sm font-semibold ${isToday ? 'text-primary' : ''}`}>
                    {format(day, 'd')}
                  </span>
                </div>
                <div className="space-y-1">
                  {dayItems.slice(0, 2).map((item, i) => (
                    <div 
                      key={i} 
                      className="text-xs p-1.5 rounded bg-primary/10 text-primary truncate"
                      title={item.content}
                    >
                      {format(new Date(item.scheduledFor), 'HH:mm')} - {item.type}
                    </div>
                  ))}
                  {dayItems.length > 2 && (
                    <div className="text-xs text-muted-foreground text-center">
                      +{dayItems.length - 2} more
                    </div>
                  )}
                </div>
                <Button 
                  size="sm" 
                  variant="ghost" 
                  className="w-full h-6 mt-1 text-xs"
                  onClick={() => onAddPost(day)}
                  data-testid={`button-add-post-${format(day, 'yyyy-MM-dd')}`}
                >
                  <Plus className="h-3 w-3" />
                </Button>
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}

function LeadCard({ lead, onEdit, onContact }: { lead: LeadContact; onEdit: () => void; onContact: () => void }) {
  const statusColors: Record<string, string> = {
    new: "bg-blue-500",
    contacted: "bg-yellow-500",
    qualified: "bg-purple-500",
    converted: "bg-green-500",
    lost: "bg-red-500",
  };

  return (
    <Card className="hover-elevate" data-testid={`lead-card-${lead.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <Avatar className="h-10 w-10">
              <AvatarFallback>{lead.name.charAt(0).toUpperCase()}</AvatarFallback>
            </Avatar>
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h4 className="font-semibold">{lead.name}</h4>
                <Badge className={statusColors[lead.status]} variant="secondary">
                  {lead.status}
                </Badge>
                {lead.supportLevel !== undefined && (
                  <Badge variant="outline" className="gap-1">
                    <Star className="h-3 w-3" />
                    Level {lead.supportLevel}
                  </Badge>
                )}
              </div>
              <div className="flex items-center gap-3 text-sm text-muted-foreground mt-1">
                <span className="flex items-center gap-1">
                  <Mail className="h-3 w-3" />
                  {lead.email}
                </span>
                {lead.phone && (
                  <span className="flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {lead.phone}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-2 mt-2 flex-wrap">
                {lead.tags.map((tag, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {tag}
                  </Badge>
                ))}
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                Source: {lead.source} · Added {formatDistanceToNow(new Date(lead.createdAt))} ago
              </p>
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Button size="icon" variant="ghost" onClick={onContact} data-testid={`button-contact-${lead.id}`}>
              <Send className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-lead-${lead.id}`}>
              <Edit className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function AdvocacyCard({ action, onEdit }: { action: AdvocacyAction; onEdit: () => void }) {
  const typeIcons = {
    petition: ClipboardList,
    call: Phone,
    email: Mail,
    event: Calendar,
    volunteer: Hand,
  };
  const TypeIcon = typeIcons[action.type];
  const progress = (action.current / action.goal) * 100;

  return (
    <Card className="hover-elevate" data-testid={`advocacy-card-${action.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="p-3 rounded-lg bg-primary/10 flex-shrink-0">
            <TypeIcon className="h-6 w-6 text-primary" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold">{action.title}</h4>
              <Badge variant={action.status === "active" ? "default" : "secondary"}>
                {action.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{action.description}</p>
            {action.target && (
              <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                <Target className="h-3 w-3" /> Target: {action.target}
              </p>
            )}
            <div className="mt-3">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="font-medium">{action.current.toLocaleString()} / {action.goal.toLocaleString()}</span>
                <span className="text-muted-foreground">{Math.round(progress)}%</span>
              </div>
              <Progress value={progress} className="h-2" />
            </div>
            {action.endDate && (
              <p className="text-xs text-muted-foreground mt-2">
                Ends: {format(new Date(action.endDate), 'MMM d, yyyy')}
              </p>
            )}
          </div>
          <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-advocacy-${action.id}`}>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

function CompetitorCard({ competitor }: { competitor: CompetitorProfile }) {
  return (
    <Card className="hover-elevate" data-testid={`competitor-card-${competitor.id}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          <Avatar className="h-12 w-12">
            <AvatarImage src={competitor.avatarUrl} />
            <AvatarFallback>{competitor.name.charAt(0)}</AvatarFallback>
          </Avatar>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold truncate">{competitor.name}</h4>
            <p className="text-sm text-muted-foreground">@{competitor.username}</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 mt-4 text-center">
          <div>
            <p className="text-lg font-bold">{(competitor.followers / 1000).toFixed(1)}K</p>
            <p className="text-xs text-muted-foreground">Followers</p>
          </div>
          <div>
            <p className="text-lg font-bold">{competitor.posts}</p>
            <p className="text-xs text-muted-foreground">Posts</p>
          </div>
          <div>
            <p className="text-lg font-bold">{competitor.engagement}%</p>
            <p className="text-xs text-muted-foreground">Engagement</p>
          </div>
        </div>
        <div className="mt-3 pt-3 border-t flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Growth (30d)</span>
          <span className={`text-sm font-medium flex items-center gap-1 ${competitor.growth > 0 ? 'text-green-500' : 'text-red-500'}`}>
            {competitor.growth > 0 ? <TrendingUp className="h-3 w-3" /> : <TrendingDown className="h-3 w-3" />}
            {Math.abs(competitor.growth)}%
          </span>
        </div>
      </CardContent>
    </Card>
  );
}

function PromotionCard({ promotion, onEdit, onToggle, onDelete }: { 
  promotion: BusinessPromotion; 
  onEdit: () => void;
  onToggle: () => void;
  onDelete: () => void;
}) {
  const statusColors: Record<string, string> = {
    draft: "bg-gray-500",
    active: "bg-green-500",
    paused: "bg-yellow-500",
    completed: "bg-blue-500",
    cancelled: "bg-red-500",
  };

  const progress = promotion.targetReach ? (promotion.actualReach || 0) / promotion.targetReach * 100 : 0;

  return (
    <Card className="hover-elevate" data-testid={`promotion-card-${promotion.id}`}>
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <h4 className="font-semibold truncate">{promotion.title}</h4>
              <Badge className={statusColors[promotion.status || "draft"]} variant="secondary">
                {promotion.status}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-1 line-clamp-2">{promotion.description}</p>
            
            <div className="flex items-center gap-4 mt-3 text-sm text-muted-foreground">
              <span className="flex items-center gap-1">
                <Eye className="h-4 w-4" />
                {(promotion.actualReach || 0).toLocaleString()} reach
              </span>
              <span className="flex items-center gap-1">
                <MousePointer className="h-4 w-4" />
                {(promotion.clicks || 0).toLocaleString()} clicks
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-4 w-4" />
                {(promotion.conversions || 0).toLocaleString()} conversions
              </span>
            </div>

            {promotion.targetReach && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span>Progress</span>
                  <span>{Math.round(progress)}%</span>
                </div>
                <Progress value={progress} className="h-2" />
              </div>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            {promotion.status === "active" ? (
              <Button size="icon" variant="ghost" onClick={onToggle} data-testid={`button-pause-promotion-${promotion.id}`}>
                <Pause className="h-4 w-4" />
              </Button>
            ) : promotion.status === "paused" || promotion.status === "draft" ? (
              <Button size="icon" variant="ghost" onClick={onToggle} data-testid={`button-start-promotion-${promotion.id}`}>
                <Play className="h-4 w-4" />
              </Button>
            ) : null}
            <Button size="icon" variant="ghost" onClick={onEdit} data-testid={`button-edit-promotion-${promotion.id}`}>
              <Edit className="h-4 w-4" />
            </Button>
            <Button size="icon" variant="ghost" onClick={onDelete} data-testid={`button-delete-promotion-${promotion.id}`}>
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CreatePromotionDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [promotionType, setPromotionType] = useState("boost_post");
  const [budget, setBudget] = useState("");
  const [targetReach, setTargetReach] = useState("");

  const createMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/business/promotions", {
        title,
        description,
        promotionType,
        budget: parseInt(budget) || 0,
        targetReach: parseInt(targetReach) || null,
      });
    },
    onSuccess: () => {
      toast({ title: "Promotion created", description: "Your promotion has been created as a draft." });
      queryClient.invalidateQueries({ queryKey: ["/api/business/dashboard"] });
      onOpenChange(false);
      setTitle("");
      setDescription("");
      setBudget("");
      setTargetReach("");
    },
    onError: () => {
      toast({ title: "Error", description: "Failed to create promotion.", variant: "destructive" });
    },
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Promotion</DialogTitle>
          <DialogDescription>Create a new promotional campaign to reach more customers.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="promo-title">Title</Label>
            <Input 
              id="promo-title" 
              placeholder="Summer Sale Announcement" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-promotion-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="promo-desc">Description</Label>
            <Textarea 
              id="promo-desc" 
              placeholder="Describe your promotion..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-promotion-description"
            />
          </div>
          <div className="space-y-2">
            <Label>Promotion Type</Label>
            <Select value={promotionType} onValueChange={setPromotionType}>
              <SelectTrigger data-testid="select-promotion-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="boost_post">Boost Post</SelectItem>
                <SelectItem value="sponsored">Sponsored Content</SelectItem>
                <SelectItem value="discount">Discount Offer</SelectItem>
                <SelectItem value="event">Event Promotion</SelectItem>
                <SelectItem value="announcement">Announcement</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="promo-budget">Budget (AXM)</Label>
              <Input 
                id="promo-budget" 
                type="number" 
                placeholder="100" 
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                data-testid="input-promotion-budget"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="promo-reach">Target Reach</Label>
              <Input 
                id="promo-reach" 
                type="number" 
                placeholder="1000" 
                value={targetReach}
                onChange={(e) => setTargetReach(e.target.value)}
                data-testid="input-promotion-reach"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => createMutation.mutate()} disabled={!title || createMutation.isPending} data-testid="button-create-promotion">
            {createMutation.isPending ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
            Create Promotion
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function CreateAdvocacyDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { toast } = useToast();
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [actionType, setActionType] = useState("petition");
  const [target, setTarget] = useState("");
  const [goal, setGoal] = useState("");

  const handleCreate = () => {
    toast({ title: "Action created", description: "Your advocacy action has been created." });
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create Advocacy Action</DialogTitle>
          <DialogDescription>Mobilize your community with calls to action.</DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Action Type</Label>
            <Select value={actionType} onValueChange={setActionType}>
              <SelectTrigger data-testid="select-action-type">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="petition">Petition</SelectItem>
                <SelectItem value="call">Phone Campaign</SelectItem>
                <SelectItem value="email">Email Campaign</SelectItem>
                <SelectItem value="event">Event</SelectItem>
                <SelectItem value="volunteer">Volunteer Drive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-title">Title</Label>
            <Input 
              id="action-title" 
              placeholder="Support Community Education" 
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              data-testid="input-action-title"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="action-desc">Description</Label>
            <Textarea 
              id="action-desc" 
              placeholder="Describe the action and its goals..." 
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              data-testid="input-action-description"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="action-target">Target (Optional)</Label>
              <Input 
                id="action-target" 
                placeholder="City Council" 
                value={target}
                onChange={(e) => setTarget(e.target.value)}
                data-testid="input-action-target"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="action-goal">Goal</Label>
              <Input 
                id="action-goal" 
                type="number" 
                placeholder="500" 
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
                data-testid="input-action-goal"
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleCreate} disabled={!title || !goal} data-testid="button-create-action">
            Create Action
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default function BusinessDashboard() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("overview");
  const [showCreatePromotion, setShowCreatePromotion] = useState(false);
  const [showCreateAdvocacy, setShowCreateAdvocacy] = useState(false);
  const [leadFilter, setLeadFilter] = useState("all");
  const [contentFilter, setContentFilter] = useState("all");

  const { data: dashboard, isLoading } = useQuery<BusinessDashboardData>({
    queryKey: ["/api/business/dashboard"],
    enabled: !!user?.isBusinessAccount,
  });

  const togglePromotionMutation = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      const newStatus = status === "active" ? "paused" : "active";
      return apiRequest("PATCH", `/api/business/promotions/${id}`, { status: newStatus });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/dashboard"] });
      toast({ title: "Promotion updated" });
    },
  });

  const deletePromotionMutation = useMutation({
    mutationFn: async (id: string) => {
      return apiRequest("DELETE", `/api/business/promotions/${id}`, {});
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/business/dashboard"] });
      toast({ title: "Promotion deleted" });
    },
  });

  if (!user?.isBusinessAccount) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex flex-col items-center justify-center h-[calc(100vh-8rem)] text-center px-4">
          <Building2 className="h-16 w-16 text-muted-foreground mb-4" />
          <h2 className="text-2xl font-bold mb-2">Business Account Required</h2>
          <p className="text-muted-foreground mb-6 max-w-md">
            Access analytics, promotions, and business tools by upgrading to a business account.
          </p>
          <Link href="/settings">
            <Button className="gap-2" data-testid="button-upgrade-business">
              <Settings className="h-4 w-4" />
              Go to Settings to Enable
            </Button>
          </Link>
        </div>
      </MainLayout>
    );
  }

  if (isLoading) {
    return (
      <MainLayout showRightSidebar={false}>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </MainLayout>
    );
  }

  const mockData: BusinessDashboardData = dashboard || {
    overview: {
      totalProfileViews: 12847,
      totalImpressions: 45230,
      totalEngagements: 3421,
      totalFollowers: 1234,
      followerGrowth: 12,
      websiteClicks: 234,
      phoneClicks: 45,
      emailClicks: 89,
      directMessages: 156,
      reachRate: 67.5,
      engagementRate: 4.8,
    },
    weeklyTrend: [
      { date: "Mon", views: 1200, engagements: 340, followers: 12, reach: 980 },
      { date: "Tue", views: 1450, engagements: 420, followers: 18, reach: 1120 },
      { date: "Wed", views: 1100, engagements: 290, followers: 8, reach: 890 },
      { date: "Thu", views: 1680, engagements: 510, followers: 24, reach: 1340 },
      { date: "Fri", views: 2100, engagements: 620, followers: 32, reach: 1680 },
      { date: "Sat", views: 1890, engagements: 480, followers: 22, reach: 1520 },
      { date: "Sun", views: 1420, engagements: 390, followers: 15, reach: 1140 },
    ],
    contentPerformance: [
      { id: "1", type: "reel", caption: "Check out our new product launch! Amazing features that will transform your workflow.", reach: 15420, impressions: 23000, engagement: 8.5, likes: 1240, comments: 89, shares: 234, saves: 567, watchTime: 45, completionRate: 72, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "2", type: "post", caption: "Behind the scenes at our latest team meeting. Great energy and amazing ideas!", reach: 8900, impressions: 12500, engagement: 5.2, likes: 450, comments: 34, shares: 67, saves: 123, createdAt: new Date(Date.now() - 172800000).toISOString() },
      { id: "3", type: "video", caption: "Tutorial: How to maximize your productivity with our platform", reach: 22300, impressions: 34000, engagement: 9.1, likes: 2100, comments: 156, shares: 445, saves: 890, watchTime: 180, completionRate: 58, createdAt: new Date(Date.now() - 259200000).toISOString() },
      { id: "4", type: "story", caption: "Quick poll: What feature would you like next?", reach: 6700, impressions: 8900, engagement: 12.3, likes: 780, comments: 230, shares: 0, saves: 0, createdAt: new Date(Date.now() - 345600000).toISOString() },
    ],
    topPosts: [],
    promotions: [],
    scheduledPosts: [
      { id: "1", content: "Exciting announcement coming soon!", type: "post", scheduledFor: addDays(new Date(), 1).toISOString(), status: "scheduled" },
      { id: "2", content: "New tutorial video", type: "reel", scheduledFor: addDays(new Date(), 2).toISOString(), status: "scheduled" },
      { id: "3", content: "Weekly tips thread", type: "post", scheduledFor: addDays(new Date(), 3).toISOString(), status: "scheduled" },
    ],
    leads: [
      { id: "1", name: "John Smith", email: "john@example.com", phone: "+1 555-0123", source: "Website Form", status: "new", tags: ["VIP", "Enterprise"], supportLevel: 5, createdAt: new Date(Date.now() - 86400000).toISOString() },
      { id: "2", name: "Sarah Johnson", email: "sarah@company.co", source: "Event", status: "contacted", tags: ["Interested", "Follow-up"], supportLevel: 3, createdAt: new Date(Date.now() - 172800000).toISOString() },
      { id: "3", name: "Mike Williams", email: "mike@startup.io", phone: "+1 555-0456", source: "Referral", status: "qualified", tags: ["Hot Lead"], supportLevel: 4, createdAt: new Date(Date.now() - 259200000).toISOString() },
    ],
    advocacyActions: [
      { id: "1", type: "petition", title: "Support Local Education Initiative", description: "Sign the petition to increase funding for community education programs.", target: "City Council", goal: 1000, current: 756, status: "active", endDate: addDays(new Date(), 14).toISOString() },
      { id: "2", type: "volunteer", title: "Community Clean-up Day", description: "Join us for our monthly community clean-up event.", goal: 50, current: 42, status: "active", endDate: addDays(new Date(), 7).toISOString() },
      { id: "3", type: "call", title: "Call Your Representatives", description: "Voice your support for the new environmental policy.", target: "State Legislature", goal: 200, current: 89, status: "active" },
    ],
    messageTemplates: [
      { id: "1", name: "Welcome Message", content: "Thank you for reaching out! We'll get back to you within 24 hours.", category: "auto-reply", usageCount: 234 },
      { id: "2", name: "Follow-up", content: "Hi! Just following up on our previous conversation. Do you have any questions?", category: "sales", usageCount: 156 },
      { id: "3", name: "Thank You", content: "Thank you for your support! We truly appreciate it.", category: "general", usageCount: 89 },
    ],
    competitors: [
      { id: "1", name: "Competitor One", username: "competitor1", followers: 15600, posts: 234, engagement: 5.2, growth: 8.5 },
      { id: "2", name: "Industry Leader", username: "industryleader", followers: 89000, posts: 567, engagement: 3.8, growth: 2.1 },
      { id: "3", name: "Rising Star", username: "risingstar", followers: 8900, posts: 123, engagement: 7.4, growth: 15.3 },
    ],
    revenue: {
      total: 12450,
      streams: [
        { source: "Tips", amount: 4500, transactions: 234, growth: 12 },
        { source: "Donations", amount: 3200, transactions: 89, growth: 8 },
        { source: "Subscriptions", amount: 2800, transactions: 56, growth: 15 },
        { source: "NFT Sales", amount: 1950, transactions: 23, growth: 25 },
      ],
      monthlyTrend: [
        { month: "Jul", revenue: 8200, tips: 3100, donations: 2400 },
        { month: "Aug", revenue: 9800, tips: 3800, donations: 2800 },
        { month: "Sep", revenue: 10500, tips: 4000, donations: 3000 },
        { month: "Oct", revenue: 11200, tips: 4200, donations: 3100 },
        { month: "Nov", revenue: 12450, tips: 4500, donations: 3200 },
      ],
    },
    audienceInsights: {
      demographics: [
        { label: "18-24", value: 25, color: "#22c55e" },
        { label: "25-34", value: 35, color: "#3b82f6" },
        { label: "35-44", value: 22, color: "#a855f7" },
        { label: "45-54", value: 12, color: "#f59e0b" },
        { label: "55+", value: 6, color: "#ef4444" },
      ],
      genderSplit: [
        { label: "Male", value: 48, color: "#3b82f6" },
        { label: "Female", value: 45, color: "#ec4899" },
        { label: "Other", value: 7, color: "#8b5cf6" },
      ],
      bestPostingTimes: [
        { hour: 8, engagement: 45 },
        { hour: 9, engagement: 62 },
        { hour: 10, engagement: 78 },
        { hour: 11, engagement: 85 },
        { hour: 12, engagement: 95 },
        { hour: 13, engagement: 88 },
        { hour: 14, engagement: 72 },
        { hour: 15, engagement: 68 },
        { hour: 16, engagement: 75 },
        { hour: 17, engagement: 82 },
        { hour: 18, engagement: 90 },
        { hour: 19, engagement: 98 },
        { hour: 20, engagement: 92 },
        { hour: 21, engagement: 78 },
        { hour: 22, engagement: 55 },
      ],
      topLocations: [
        { location: "United States", percentage: 45 },
        { location: "United Kingdom", percentage: 18 },
        { location: "Canada", percentage: 12 },
        { location: "Australia", percentage: 8 },
        { location: "Germany", percentage: 6 },
      ],
      interests: [
        { interest: "Technology", percentage: 68 },
        { interest: "Finance", percentage: 54 },
        { interest: "Education", percentage: 47 },
        { interest: "Health", percentage: 38 },
        { interest: "Entertainment", percentage: 32 },
      ],
      deviceTypes: [
        { device: "Mobile", percentage: 72 },
        { device: "Desktop", percentage: 24 },
        { device: "Tablet", percentage: 4 },
      ],
    },
    responseMetrics: {
      averageResponseTime: 45,
      responseRate: 94,
      unreadMessages: 12,
      totalConversations: 234,
    },
  };

  return (
    <MainLayout showRightSidebar={false}>
      <div className="space-y-6 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold" data-testid="text-business-dashboard-title">Business Dashboard</h1>
            <p className="text-muted-foreground">Manage your business presence and track performance</p>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <Button variant="outline" className="gap-2" asChild>
              <Link href="/analytics">
                <LineChart className="h-4 w-4" />
                Full Analytics
              </Link>
            </Button>
            <Button className="gap-2" onClick={() => setShowCreatePromotion(true)} data-testid="button-new-promotion">
              <Plus className="h-4 w-4" />
              New Promotion
            </Button>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} data-testid="tabs-business-dashboard">
          <ScrollArea className="w-full">
            <TabsList className="inline-flex w-max">
              <TabsTrigger value="overview" data-testid="tab-overview">Overview</TabsTrigger>
              <TabsTrigger value="content" data-testid="tab-content">Content</TabsTrigger>
              <TabsTrigger value="scheduler" data-testid="tab-scheduler">Scheduler</TabsTrigger>
              <TabsTrigger value="leads" data-testid="tab-leads">Leads & CRM</TabsTrigger>
              <TabsTrigger value="advocacy" data-testid="tab-advocacy">Advocacy</TabsTrigger>
              <TabsTrigger value="messaging" data-testid="tab-messaging">Messaging</TabsTrigger>
              <TabsTrigger value="competitors" data-testid="tab-competitors">Competitors</TabsTrigger>
              <TabsTrigger value="monetization" data-testid="tab-monetization">Monetization</TabsTrigger>
              <TabsTrigger value="promotions" data-testid="tab-promotions">Promotions</TabsTrigger>
              <TabsTrigger value="audience" data-testid="tab-audience">Audience</TabsTrigger>
            </TabsList>
          </ScrollArea>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Profile Views" 
                value={mockData.overview.totalProfileViews} 
                icon={Eye}
                trend={15}
                subtitle="Last 7 days"
              />
              <StatCard 
                title="Post Impressions" 
                value={mockData.overview.totalImpressions} 
                icon={BarChart3}
                trend={8}
              />
              <StatCard 
                title="Engagements" 
                value={mockData.overview.totalEngagements} 
                icon={Zap}
                trend={23}
              />
              <StatCard 
                title="Followers" 
                value={mockData.overview.totalFollowers} 
                icon={Users}
                trend={mockData.overview.followerGrowth}
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard 
                title="Reach Rate" 
                value={`${mockData.overview.reachRate}%`} 
                icon={Target}
                trend={5}
              />
              <StatCard 
                title="Engagement Rate" 
                value={`${mockData.overview.engagementRate}%`} 
                icon={Heart}
                trend={12}
              />
              <StatCard 
                title="Website Clicks" 
                value={mockData.overview.websiteClicks} 
                icon={Globe}
                trend={-3}
              />
              <StatCard 
                title="Direct Messages" 
                value={mockData.overview.directMessages} 
                icon={MessageCircle}
                trend={18}
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-primary" />
                    Weekly Performance
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={mockData.weeklyTrend}>
                        <defs>
                          <linearGradient id="colorViews" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                          </linearGradient>
                          <linearGradient id="colorEngagements" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                            <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                          </linearGradient>
                        </defs>
                        <XAxis dataKey="date" axisLine={false} tickLine={false} />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--popover))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                        />
                        <Area type="monotone" dataKey="views" stroke="#22c55e" fill="url(#colorViews)" strokeWidth={2} name="Views" />
                        <Area type="monotone" dataKey="engagements" stroke="#3b82f6" fill="url(#colorEngagements)" strokeWidth={2} name="Engagements" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MousePointer className="h-5 w-5 text-primary" />
                    Quick Actions
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Globe className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Website Clicks</span>
                    </div>
                    <span className="font-semibold">{mockData.overview.websiteClicks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Phone className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Phone Clicks</span>
                    </div>
                    <span className="font-semibold">{mockData.overview.phoneClicks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Mail className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Email Clicks</span>
                    </div>
                    <span className="font-semibold">{mockData.overview.emailClicks}</span>
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <MessageCircle className="h-5 w-5 text-muted-foreground" />
                      <span className="text-sm">Direct Messages</span>
                    </div>
                    <span className="font-semibold">{mockData.overview.directMessages}</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Top Performing Content</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockData.contentPerformance.slice(0, 3).map((content) => (
                    <div key={content.id} className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                      <div className="w-10 h-10 rounded bg-primary/10 flex items-center justify-center flex-shrink-0">
                        {content.type === "video" || content.type === "reel" ? (
                          <Video className="h-5 w-5 text-primary" />
                        ) : (
                          <Image className="h-5 w-5 text-primary" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{content.caption.substring(0, 30)}...</p>
                        <p className="text-xs text-muted-foreground">{content.reach.toLocaleString()} reach</p>
                      </div>
                      <Badge variant="outline">{content.engagement}%</Badge>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full" onClick={() => setActiveTab("content")}>
                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Active Advocacy</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {mockData.advocacyActions.slice(0, 2).map((action) => (
                    <div key={action.id} className="p-2 rounded-lg bg-muted/50">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium truncate">{action.title}</span>
                        <Badge variant="secondary" className="text-xs">{action.type}</Badge>
                      </div>
                      <Progress value={(action.current / action.goal) * 100} className="h-1.5" />
                      <p className="text-xs text-muted-foreground mt-1">
                        {action.current} / {action.goal}
                      </p>
                    </div>
                  ))}
                  <Button variant="ghost" className="w-full" onClick={() => setActiveTab("advocacy")}>
                    View All <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">Revenue Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-primary mb-4">
                    ${mockData.revenue.total.toLocaleString()}
                  </div>
                  <div className="space-y-2">
                    {mockData.revenue.streams.slice(0, 3).map((stream, i) => (
                      <div key={i} className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">{stream.source}</span>
                        <span className="font-medium">${stream.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <Button variant="ghost" className="w-full mt-3" onClick={() => setActiveTab("monetization")}>
                    View Details <ArrowUpRight className="h-4 w-4 ml-1" />
                  </Button>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="content" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Content Performance</h3>
                <p className="text-sm text-muted-foreground">Analyze how your content is performing</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={contentFilter} onValueChange={setContentFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-content-filter">
                    <SelectValue placeholder="All Types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    <SelectItem value="post">Posts</SelectItem>
                    <SelectItem value="reel">Reels</SelectItem>
                    <SelectItem value="video">Videos</SelectItem>
                    <SelectItem value="story">Stories</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2" data-testid="button-export-content">
                  <Download className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Reach" value={mockData.contentPerformance.reduce((sum, c) => sum + c.reach, 0)} icon={Eye} trend={18} />
              <StatCard title="Total Impressions" value={mockData.contentPerformance.reduce((sum, c) => sum + c.impressions, 0)} icon={BarChart3} trend={12} />
              <StatCard title="Avg. Engagement" value={`${(mockData.contentPerformance.reduce((sum, c) => sum + c.engagement, 0) / mockData.contentPerformance.length).toFixed(1)}%`} icon={Heart} trend={8} />
              <StatCard title="Total Saves" value={mockData.contentPerformance.reduce((sum, c) => sum + c.saves, 0)} icon={Bookmark} trend={25} />
            </div>

            <div className="space-y-4">
              {mockData.contentPerformance
                .filter(c => contentFilter === "all" || c.type === contentFilter)
                .map((content) => (
                  <ContentCard key={content.id} content={content} onView={() => toast({ title: "Content details coming soon" })} />
                ))}
            </div>
          </TabsContent>

          <TabsContent value="scheduler" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Content Scheduler</h3>
                <p className="text-sm text-muted-foreground">Plan and schedule your content in advance</p>
              </div>
              <Button className="gap-2" data-testid="button-schedule-post">
                <Plus className="h-4 w-4" />
                Schedule New Post
              </Button>
            </div>

            <ScheduleCalendar 
              items={mockData.scheduledPosts} 
              onAddPost={(date) => toast({ title: `Adding post for ${format(date, 'MMM d')}` })} 
            />

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-primary" />
                  Best Times to Post
                </CardTitle>
                <CardDescription>Based on when your audience is most active</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={mockData.audienceInsights.bestPostingTimes}>
                      <XAxis 
                        dataKey="hour" 
                        axisLine={false} 
                        tickLine={false}
                        tickFormatter={(h) => `${h}:00`}
                      />
                      <YAxis axisLine={false} tickLine={false} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--popover))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        labelFormatter={(h) => `${h}:00`}
                      />
                      <Bar dataKey="engagement" fill="#22c55e" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 flex items-center gap-4 text-sm">
                  <Badge className="bg-green-500">Peak: 12pm & 7pm</Badge>
                  <span className="text-muted-foreground">Schedule posts during peak hours for maximum reach</span>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Upcoming Posts</CardTitle>
              </CardHeader>
              <CardContent>
                {mockData.scheduledPosts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No posts scheduled</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {mockData.scheduledPosts.map((post) => (
                      <div key={post.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="p-2 rounded bg-primary/10">
                            {post.type === "reel" ? <Video className="h-4 w-4 text-primary" /> : <Image className="h-4 w-4 text-primary" />}
                          </div>
                          <div>
                            <p className="text-sm font-medium">{post.content}</p>
                            <p className="text-xs text-muted-foreground">
                              {format(new Date(post.scheduledFor), 'MMM d, yyyy')} at {format(new Date(post.scheduledFor), 'h:mm a')}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant="outline">{post.status}</Badge>
                          <Button size="icon" variant="ghost" data-testid={`button-edit-scheduled-${post.id}`}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button size="icon" variant="ghost" data-testid={`button-delete-scheduled-${post.id}`}>
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="leads" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Leads & CRM</h3>
                <p className="text-sm text-muted-foreground">Manage your contacts and track conversions</p>
              </div>
              <div className="flex items-center gap-2">
                <Select value={leadFilter} onValueChange={setLeadFilter}>
                  <SelectTrigger className="w-[140px]" data-testid="select-lead-filter">
                    <SelectValue placeholder="All Leads" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Leads</SelectItem>
                    <SelectItem value="new">New</SelectItem>
                    <SelectItem value="contacted">Contacted</SelectItem>
                    <SelectItem value="qualified">Qualified</SelectItem>
                    <SelectItem value="converted">Converted</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" className="gap-2" data-testid="button-import-leads">
                  <Upload className="h-4 w-4" />
                  Import
                </Button>
                <Button className="gap-2" data-testid="button-add-lead">
                  <UserPlus className="h-4 w-4" />
                  Add Lead
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Total Leads" value={mockData.leads.length} icon={Users} trend={15} />
              <StatCard title="New This Week" value={mockData.leads.filter(l => l.status === "new").length} icon={UserPlus} trend={8} />
              <StatCard title="Conversion Rate" value="24%" icon={Target} trend={5} />
              <StatCard title="Avg. Response Time" value="2.5h" icon={Clock} trend={-12} trendLabel="improvement" />
            </div>

            <div className="space-y-4">
              {mockData.leads
                .filter(l => leadFilter === "all" || l.status === leadFilter)
                .map((lead) => (
                  <LeadCard 
                    key={lead.id} 
                    lead={lead} 
                    onEdit={() => toast({ title: "Edit lead coming soon" })}
                    onContact={() => toast({ title: "Contact form coming soon" })}
                  />
                ))}
            </div>

            {mockData.leads.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Users className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No leads yet</h3>
                  <p className="text-muted-foreground mb-4">Start collecting leads from your content and campaigns</p>
                  <Button className="gap-2" data-testid="button-add-first-lead">
                    <UserPlus className="h-4 w-4" />
                    Add Your First Lead
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="advocacy" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Advocacy & Actions</h3>
                <p className="text-sm text-muted-foreground">Mobilize your community with calls to action</p>
              </div>
              <Button className="gap-2" onClick={() => setShowCreateAdvocacy(true)} data-testid="button-create-action">
                <Plus className="h-4 w-4" />
                Create Action
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Active Actions" value={mockData.advocacyActions.filter(a => a.status === "active").length} icon={ClipboardList} />
              <StatCard title="Total Participants" value={mockData.advocacyActions.reduce((sum, a) => sum + a.current, 0)} icon={Users} trend={22} />
              <StatCard title="Completion Rate" value="68%" icon={Target} trend={5} />
              <StatCard title="Volunteer Hours" value={mockData.advocacyActions.filter(a => a.type === "volunteer").reduce((sum, a) => sum + a.current * 2, 0)} icon={Hand} trend={15} />
            </div>

            <div className="space-y-4">
              {mockData.advocacyActions.map((action) => (
                <AdvocacyCard 
                  key={action.id} 
                  action={action}
                  onEdit={() => toast({ title: "Edit action coming soon" })}
                />
              ))}
            </div>

            {mockData.advocacyActions.length === 0 && (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No advocacy actions yet</h3>
                  <p className="text-muted-foreground mb-4">Create petitions, volunteer drives, and call campaigns</p>
                  <Button className="gap-2" onClick={() => setShowCreateAdvocacy(true)} data-testid="button-create-first-action">
                    <Plus className="h-4 w-4" />
                    Create Your First Action
                  </Button>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="messaging" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Messaging Center</h3>
                <p className="text-sm text-muted-foreground">Manage conversations and response templates</p>
              </div>
              <Button variant="outline" className="gap-2" asChild>
                <Link href="/messages">
                  <Inbox className="h-4 w-4" />
                  Open Inbox
                </Link>
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <StatCard title="Response Rate" value={`${mockData.responseMetrics.responseRate}%`} icon={Reply} trend={5} />
              <StatCard title="Avg. Response Time" value={`${mockData.responseMetrics.averageResponseTime}m`} icon={Clock} trend={-15} trendLabel="faster" />
              <StatCard title="Unread Messages" value={mockData.responseMetrics.unreadMessages} icon={Inbox} />
              <StatCard title="Total Conversations" value={mockData.responseMetrics.totalConversations} icon={MessageCircle} trend={12} />
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="h-5 w-5 text-primary" />
                    Quick Reply Templates
                  </CardTitle>
                  <Button size="sm" className="gap-2" data-testid="button-add-template">
                    <Plus className="h-4 w-4" />
                    Add Template
                  </Button>
                </div>
                <CardDescription>Save time with pre-written responses</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {mockData.messageTemplates.map((template) => (
                    <div key={template.id} className="flex items-start justify-between p-3 rounded-lg bg-muted/50">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-sm">{template.name}</h4>
                          <Badge variant="outline" className="text-xs">{template.category}</Badge>
                        </div>
                        <p className="text-sm text-muted-foreground line-clamp-2">{template.content}</p>
                        <p className="text-xs text-muted-foreground mt-1">Used {template.usageCount} times</p>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button size="icon" variant="ghost" data-testid={`button-copy-template-${template.id}`}>
                          <Copy className="h-4 w-4" />
                        </Button>
                        <Button size="icon" variant="ghost" data-testid={`button-edit-template-${template.id}`}>
                          <Edit className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Auto-Response Settings</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Away Message</p>
                    <p className="text-sm text-muted-foreground">Auto-reply when you're not available</p>
                  </div>
                  <Switch data-testid="switch-away-message" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Instant Reply</p>
                    <p className="text-sm text-muted-foreground">Immediately acknowledge new messages</p>
                  </div>
                  <Switch defaultChecked data-testid="switch-instant-reply" />
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">FAQ Bot</p>
                    <p className="text-sm text-muted-foreground">Answer common questions automatically</p>
                  </div>
                  <Switch data-testid="switch-faq-bot" />
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="competitors" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Competitor Analysis</h3>
                <p className="text-sm text-muted-foreground">Track and compare with similar accounts</p>
              </div>
              <Button className="gap-2" data-testid="button-add-competitor">
                <Plus className="h-4 w-4" />
                Add Competitor
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {mockData.competitors.map((competitor) => (
                <CompetitorCard key={competitor.id} competitor={competitor} />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Performance Comparison</CardTitle>
                <CardDescription>How you compare to tracked competitors</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart 
                      data={[
                        { metric: "Followers", you: mockData.overview.totalFollowers, avg: mockData.competitors.reduce((sum, c) => sum + c.followers, 0) / mockData.competitors.length },
                        { metric: "Engagement", you: mockData.overview.engagementRate * 100, avg: mockData.competitors.reduce((sum, c) => sum + c.engagement, 0) / mockData.competitors.length * 100 },
                        { metric: "Growth", you: mockData.overview.followerGrowth * 10, avg: mockData.competitors.reduce((sum, c) => sum + c.growth, 0) / mockData.competitors.length * 10 },
                      ]}
                      layout="vertical"
                    >
                      <XAxis type="number" axisLine={false} tickLine={false} />
                      <YAxis dataKey="metric" type="category" axisLine={false} tickLine={false} width={100} />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="you" fill="#22c55e" name="You" radius={[0, 4, 4, 0]} />
                      <Bar dataKey="avg" fill="#6b7280" name="Competitors Avg" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="monetization" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Monetization</h3>
                <p className="text-sm text-muted-foreground">Track your revenue and earnings</p>
              </div>
              <Button variant="outline" className="gap-2" data-testid="button-withdraw">
                <Wallet className="h-4 w-4" />
                Withdraw
              </Button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-primary/20 to-primary/5 border-primary/20">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-2">
                    <p className="text-sm text-muted-foreground">Total Revenue</p>
                    <DollarSign className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-3xl font-bold">${mockData.revenue.total.toLocaleString()}</p>
                  <p className="text-xs text-green-500 flex items-center gap-1 mt-1">
                    <TrendingUp className="h-3 w-3" /> +18% this month
                  </p>
                </CardContent>
              </Card>
              {mockData.revenue.streams.map((stream, i) => (
                <StatCard 
                  key={i}
                  title={stream.source}
                  value={`$${stream.amount.toLocaleString()}`}
                  icon={stream.source === "Tips" ? Gift : stream.source === "Donations" ? Heart : stream.source === "NFT Sales" ? ShoppingBag : CreditCard}
                  trend={stream.growth}
                  subtitle={`${stream.transactions} transactions`}
                />
              ))}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Revenue Trend</CardTitle>
                <CardDescription>Monthly earnings breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={mockData.revenue.monthlyTrend}>
                      <defs>
                        <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#22c55e" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#22c55e" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} />
                      <YAxis axisLine={false} tickLine={false} tickFormatter={(v) => `$${v}`} />
                      <Tooltip 
                        contentStyle={{ 
                          backgroundColor: "hsl(var(--popover))", 
                          border: "1px solid hsl(var(--border))",
                          borderRadius: "8px"
                        }}
                        formatter={(value: number) => [`$${value}`, '']}
                      />
                      <Legend />
                      <Area type="monotone" dataKey="revenue" stroke="#22c55e" fill="url(#colorRevenue)" strokeWidth={2} name="Total" />
                      <Area type="monotone" dataKey="tips" stroke="#3b82f6" fill="transparent" strokeWidth={2} name="Tips" />
                      <Area type="monotone" dataKey="donations" stroke="#ec4899" fill="transparent" strokeWidth={2} name="Donations" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gift className="h-5 w-5 text-primary" />
                    Top Supporters
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {[
                      { name: "CryptoWhale", amount: 450, avatar: null },
                      { name: "TechEnthusiast", amount: 320, avatar: null },
                      { name: "SupporterOne", amount: 185, avatar: null },
                    ].map((supporter, i) => (
                      <div key={i} className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                        <div className="flex items-center gap-3">
                          <div className="flex items-center justify-center w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold">
                            {i + 1}
                          </div>
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>{supporter.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <span className="font-medium text-sm">{supporter.name}</span>
                        </div>
                        <span className="font-semibold text-primary">${supporter.amount}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5 text-primary" />
                    Monetization Tools
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Gift className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Tips</p>
                        <p className="text-xs text-muted-foreground">Accept tips from supporters</p>
                      </div>
                    </div>
                    <Switch defaultChecked data-testid="switch-tips" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <Heart className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Donations</p>
                        <p className="text-xs text-muted-foreground">Enable donation button</p>
                      </div>
                    </div>
                    <Switch defaultChecked data-testid="switch-donations" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Subscriptions</p>
                        <p className="text-xs text-muted-foreground">Offer premium content</p>
                      </div>
                    </div>
                    <Switch data-testid="switch-subscriptions" />
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/50">
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="h-5 w-5 text-muted-foreground" />
                      <div>
                        <p className="font-medium text-sm">Shop Integration</p>
                        <p className="text-xs text-muted-foreground">Sell products directly</p>
                      </div>
                    </div>
                    <Switch data-testid="switch-shop" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="promotions" className="mt-6 space-y-6">
            <div className="flex items-center justify-between flex-wrap gap-4">
              <div>
                <h3 className="text-lg font-semibold">Your Promotions</h3>
                <p className="text-sm text-muted-foreground">Create and manage promotional campaigns</p>
              </div>
              <Button className="gap-2" onClick={() => setShowCreatePromotion(true)} data-testid="button-create-promotion">
                <Plus className="h-4 w-4" />
                Create Promotion
              </Button>
            </div>

            {mockData.promotions.length === 0 ? (
              <Card>
                <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                  <Megaphone className="h-12 w-12 text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No promotions yet</h3>
                  <p className="text-muted-foreground mb-4 max-w-sm">
                    Create your first promotion to boost your reach and attract more customers.
                  </p>
                  <Button className="gap-2" onClick={() => setShowCreatePromotion(true)} data-testid="button-create-first-promotion">
                    <Plus className="h-4 w-4" />
                    Create Your First Promotion
                  </Button>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {mockData.promotions.map((promo) => (
                  <PromotionCard 
                    key={promo.id} 
                    promotion={promo}
                    onEdit={() => {}}
                    onToggle={() => togglePromotionMutation.mutate({ id: promo.id, status: promo.status || "draft" })}
                    onDelete={() => deletePromotionMutation.mutate(promo.id)}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="audience" className="mt-6 space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Audience Insights</h3>
              <p className="text-sm text-muted-foreground">Understand your audience demographics and behavior</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <PieChart className="h-5 w-5 text-primary" />
                    Age Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={mockData.audienceInsights.demographics}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ label, value }) => `${label}: ${value}%`}
                        >
                          {mockData.audienceInsights.demographics.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5 text-primary" />
                    Gender Distribution
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[300px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <RePieChart>
                        <Pie
                          data={mockData.audienceInsights.genderSplit}
                          cx="50%"
                          cy="50%"
                          innerRadius={60}
                          outerRadius={100}
                          paddingAngle={2}
                          dataKey="value"
                          label={({ label, value }) => `${label}: ${value}%`}
                        >
                          {mockData.audienceInsights.genderSplit.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                        </Pie>
                        <Legend />
                        <Tooltip />
                      </RePieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <MapPin className="h-5 w-5 text-primary" />
                    Top Locations
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.audienceInsights.topLocations.map((loc, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{loc.location}</span>
                          <span className="font-medium">{loc.percentage}%</span>
                        </div>
                        <Progress value={loc.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Hash className="h-5 w-5 text-primary" />
                    Top Interests
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.audienceInsights.interests.map((interest, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{interest.interest}</span>
                          <span className="font-medium">{interest.percentage}%</span>
                        </div>
                        <Progress value={interest.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Clock className="h-5 w-5 text-primary" />
                    Best Posting Times
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="h-[200px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={mockData.audienceInsights.bestPostingTimes}>
                        <XAxis 
                          dataKey="hour" 
                          axisLine={false} 
                          tickLine={false}
                          tickFormatter={(h) => `${h}`}
                        />
                        <YAxis axisLine={false} tickLine={false} />
                        <Tooltip 
                          contentStyle={{ 
                            backgroundColor: "hsl(var(--popover))", 
                            border: "1px solid hsl(var(--border))",
                            borderRadius: "8px"
                          }}
                          labelFormatter={(h) => `${h}:00`}
                        />
                        <Bar dataKey="engagement" fill="#22c55e" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Settings className="h-5 w-5 text-primary" />
                    Device Types
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {mockData.audienceInsights.deviceTypes.map((device, index) => (
                      <div key={index} className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>{device.device}</span>
                          <span className="font-medium">{device.percentage}%</span>
                        </div>
                        <Progress value={device.percentage} className="h-2" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>

      <CreatePromotionDialog open={showCreatePromotion} onOpenChange={setShowCreatePromotion} />
      <CreateAdvocacyDialog open={showCreateAdvocacy} onOpenChange={setShowCreateAdvocacy} />
    </MainLayout>
  );
}
