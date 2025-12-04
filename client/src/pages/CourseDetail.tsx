import { useState, useEffect } from "react";
import { Link, useParams } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  Flame,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  Play,
  RefreshCw,
  Target,
  Zap,
  Trophy,
  Lock,
  ChevronRight,
  Users,
  Star,
  Wallet
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useWallet } from "@/lib/walletContext";
import { useAcademyContract, Enrollment } from "@/lib/useContracts";
import { getCourseById, getCategoryForCourse, COURSE_LEVELS, CourseContent } from "@/data/forgeCourses";

export default function CourseDetail() {
  const { id } = useParams<{ id: string }>();
  const courseId = parseInt(id || "0");
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const academy = useAcademyContract();

  const [course, setCourse] = useState<CourseContent | null>(null);
  const [category, setCategory] = useState<ReturnType<typeof getCategoryForCourse>>(undefined);
  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isEnrolling, setIsEnrolling] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isCourseActive, setIsCourseActive] = useState(false);

  useEffect(() => {
    const courseData = getCourseById(courseId);
    const categoryData = getCategoryForCourse(courseId);
    setCourse(courseData || null);
    setCategory(categoryData);
    setIsLoading(false);
  }, [courseId]);

  useEffect(() => {
    const checkCourseStatus = async () => {
      try {
        const onChainCourse = await academy.getCourse(courseId);
        setIsCourseActive(onChainCourse !== null && onChainCourse.status === 1);
      } catch (error) {
        setIsCourseActive(false);
      }
    };
    checkCourseStatus();
  }, [courseId]);

  useEffect(() => {
    const checkEnrollment = async () => {
      if (!isConnected || !address || !courseId) return;
      
      try {
        const studentCourses = await academy.getStudentCourses(address);
        const enrolled = studentCourses.includes(courseId);
        setIsEnrolled(enrolled);
        
        if (enrolled) {
          const enrollmentData = await academy.getEnrollment(courseId, address);
          setEnrollment(enrollmentData);
        }
      } catch (error) {
        console.error("Failed to check enrollment:", error);
      }
    };

    checkEnrollment();
  }, [isConnected, address, courseId]);

  const handleEnroll = async () => {
    if (!isConnected) {
      toast({
        title: "Wallet Required",
        description: "Please connect your wallet to enroll in courses",
        variant: "destructive",
      });
      return;
    }

    setIsEnrolling(true);
    try {
      const txHash = await academy.enrollInCourse(courseId);
      toast({
        title: "Enrollment Successful",
        description: `Welcome to ${course?.title}! Your journey begins. TX: ${txHash?.slice(0, 10)}...`,
      });
      setIsEnrolled(true);
    } catch (error: any) {
      toast({
        title: "Enrollment Failed",
        description: error.message || "Failed to enroll in course",
        variant: "destructive",
      });
    } finally {
      setIsEnrolling(false);
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-64 bg-muted rounded-lg" />
            <div className="space-y-4">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-20 bg-muted rounded" />
              ))}
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (!course) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Course Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This course doesn't exist or has been removed.
            </p>
            <Link href="/academy">
              <Button>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to The Forge
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const CategoryIcon = category?.icon || BookOpen;
  const totalLessons = course.lessons.length;
  const progressPercent = enrollment?.progressPercentage || 0;
  const completedLessons = Math.floor((progressPercent / 100) * totalLessons);

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link href="/academy">
            <Button variant="ghost" size="sm" className="gap-1" data-testid="button-back-forge">
              <ArrowLeft className="h-4 w-4" />
              The Forge
            </Button>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span>{category?.name}</span>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">{course.title}</span>
        </div>

        <div className={`rounded-xl p-8 mb-8 bg-gradient-to-br ${category?.color || 'from-primary/10 to-primary/5'}`}>
          <div className="flex flex-col md:flex-row md:items-start gap-6">
            <div className={`h-16 w-16 rounded-xl bg-gradient-to-br ${category?.color || 'from-primary/20 to-primary/10'} flex items-center justify-center shrink-0`}>
              <CategoryIcon className={`h-8 w-8 ${category?.iconColor || 'text-primary'}`} />
            </div>
            <div className="flex-1">
              <div className="flex flex-wrap items-center gap-3 mb-3">
                <Badge className={getLevelColor(course.level)} variant="outline">
                  {COURSE_LEVELS[course.level]}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <Clock className="h-3 w-3" />
                  {course.totalDuration}
                </Badge>
                <Badge variant="outline" className="gap-1">
                  <BookOpen className="h-3 w-3" />
                  {course.lessons.length} lessons
                </Badge>
              </div>
              <h1 className="text-3xl font-bold mb-3" data-testid="text-course-title">{course.title}</h1>
              <p className="text-muted-foreground text-lg">{course.longDescription}</p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap items-center gap-4">
            {isEnrolled ? (
              <div className="flex items-center gap-4 flex-1">
                <div className="flex-1 max-w-md">
                  <div className="flex justify-between text-sm mb-1">
                    <span>Progress</span>
                    <span>{completedLessons}/{totalLessons} lessons</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                </div>
                <Button size="lg" data-testid="button-continue">
                  <Play className="h-5 w-5 mr-2" />
                  Continue Learning
                </Button>
              </div>
            ) : isCourseActive ? (
              <Button 
                size="lg"
                onClick={handleEnroll}
                disabled={isEnrolling || !isConnected}
                data-testid="button-enroll"
              >
                {isEnrolling ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Start Course
                  </>
                )}
              </Button>
            ) : (
              <div className="flex items-center gap-3">
                <Button size="lg" variant="secondary" disabled data-testid="button-coming-soon">
                  <Clock className="h-5 w-5 mr-2" />
                  Coming Soon
                </Button>
                <span className="text-sm text-muted-foreground">On-chain enrollment opening soon</span>
              </div>
            )}
            <div className="flex items-center gap-2 text-sm">
              <Trophy className="h-5 w-5 text-amber-500" />
              <span>Earns: <strong>{course.badge}</strong> badge</span>
            </div>
          </div>

          {!isConnected && isCourseActive && (
            <div className="mt-4 p-3 rounded-lg bg-background/50 flex items-center gap-3 text-sm">
              <Wallet className="h-5 w-5 text-muted-foreground" />
              <span className="text-muted-foreground">Connect your wallet to enroll and track progress</span>
            </div>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-6 mb-8">
          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Target className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Learning Outcomes</p>
                  <p className="font-semibold">{course.learningOutcomes.length} skills</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-amber-500/10 flex items-center justify-center">
                  <Zap className="h-5 w-5 text-amber-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">XP Reward</p>
                  <p className="font-semibold">{course.lessons.length * 10} XP</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="hover-elevate">
            <CardContent className="p-6">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                  <Award className="h-5 w-5 text-emerald-500" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Certificate</p>
                  <p className="font-semibold">On-chain NFT</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {course.prerequisites.length > 0 && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Lock className="h-5 w-5" />
                Prerequisites
              </CardTitle>
              <CardDescription>Complete these courses first</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {course.prerequisites.map((prereq, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-muted-foreground" />
                    {prereq}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        )}

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Target className="h-5 w-5 text-primary" />
              What You'll Learn
            </CardTitle>
            <CardDescription>By the end of this course, you will be able to:</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="grid sm:grid-cols-2 gap-3">
              {course.learningOutcomes.map((outcome, i) => (
                <li key={i} className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5 shrink-0" />
                  <span className="text-sm">{outcome}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <BookOpen className="h-5 w-5 text-primary" />
              Course Curriculum
            </CardTitle>
            <CardDescription>
              {course.lessons.length} lessons • {course.totalDuration} total
            </CardDescription>
          </CardHeader>
          <CardContent className="pb-2">
            <Accordion type="multiple" className="w-full">
              {course.lessons.map((lesson, index) => {
                const isCompleted = enrollment && index < completedLessons;
                return (
                  <AccordionItem key={lesson.id} value={`lesson-${lesson.id}`}>
                    <AccordionTrigger className="hover:no-underline">
                      <div className="flex items-center gap-4 text-left w-full pr-4">
                        <div className={`h-8 w-8 rounded-full flex items-center justify-center shrink-0 ${
                          isCompleted 
                            ? 'bg-emerald-500 text-white' 
                            : 'bg-muted text-muted-foreground'
                        }`}>
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4" />
                          ) : (
                            <span className="text-sm font-medium">{index + 1}</span>
                          )}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{lesson.title}</p>
                          <p className="text-sm text-muted-foreground">{lesson.duration}</p>
                        </div>
                      </div>
                    </AccordionTrigger>
                    <AccordionContent>
                      <div className="pl-12 space-y-4">
                        <p className="text-sm text-muted-foreground">{lesson.overview}</p>
                        <div>
                          <p className="text-sm font-medium mb-2">Key Takeaways:</p>
                          <ul className="space-y-1">
                            {lesson.keyTakeaways.map((takeaway, i) => (
                              <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                                <Star className="h-3 w-3 text-amber-500 mt-1 shrink-0" />
                                {takeaway}
                              </li>
                            ))}
                          </ul>
                        </div>
                        {isEnrolled && (
                          <Button size="sm" variant={isCompleted ? "secondary" : "default"}>
                            {isCompleted ? (
                              <>
                                <CheckCircle className="h-4 w-4 mr-2" />
                                Review Lesson
                              </>
                            ) : (
                              <>
                                <Play className="h-4 w-4 mr-2" />
                                Start Lesson
                              </>
                            )}
                          </Button>
                        )}
                      </div>
                    </AccordionContent>
                  </AccordionItem>
                );
              })}
            </Accordion>
          </CardContent>
        </Card>

        {!isEnrolled && (
          <Card className="border-primary/30 bg-gradient-to-r from-primary/5 to-primary/10">
            <CardContent className="p-8 text-center">
              <Flame className="h-12 w-12 mx-auto text-orange-500 mb-4" />
              <h2 className="text-2xl font-bold mb-2">Ready to Start?</h2>
              <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                Begin your journey with {course.title} and earn the {course.badge} badge 
                upon completion.
              </p>
              <Button 
                size="lg"
                onClick={handleEnroll}
                disabled={isEnrolling || !isConnected}
                data-testid="button-enroll-bottom"
              >
                {isEnrolling ? (
                  <>
                    <RefreshCw className="h-5 w-5 mr-2 animate-spin" />
                    Enrolling...
                  </>
                ) : (
                  <>
                    <Play className="h-5 w-5 mr-2" />
                    Enroll Now - It's Free
                  </>
                )}
              </Button>
              {!isConnected && (
                <p className="text-sm text-muted-foreground mt-4">
                  Connect your wallet to enroll
                </p>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  );
}
