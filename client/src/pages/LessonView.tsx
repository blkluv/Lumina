import { useState, useEffect } from "react";
import { Link, useParams, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft,
  ArrowRight,
  Flame,
  BookOpen,
  Clock,
  CheckCircle,
  Play,
  RefreshCw,
  Star,
  ChevronRight,
  Trophy,
  Home
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useWallet } from "@/lib/walletContext";
import { useAcademyContract, Enrollment } from "@/lib/useContracts";
import { getCourseById, getCategoryForCourse, COURSE_LEVELS, Lesson } from "@/data/forgeCourses";

export default function LessonView() {
  const { courseId: courseIdParam, lessonId: lessonIdParam } = useParams<{ courseId: string; lessonId: string }>();
  const courseId = parseInt(courseIdParam || "0");
  const lessonId = parseInt(lessonIdParam || "0");
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const academy = useAcademyContract();

  const [isEnrolled, setIsEnrolled] = useState(false);
  const [enrollment, setEnrollment] = useState<Enrollment | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isCompleting, setIsCompleting] = useState(false);
  const [onChainCourseId, setOnChainCourseId] = useState<number | null>(null);

  const course = getCourseById(courseId);
  const category = getCategoryForCourse(courseId);
  const lesson = course?.lessons.find(l => l.id === lessonId);
  const lessonIndex = course?.lessons.findIndex(l => l.id === lessonId) ?? -1;
  const totalLessons = course?.lessons.length ?? 0;
  const prevLesson = lessonIndex > 0 ? course?.lessons[lessonIndex - 1] : null;
  const nextLesson = lessonIndex < totalLessons - 1 ? course?.lessons[lessonIndex + 1] : null;

  useEffect(() => {
    const checkEnrollmentAndCourse = async () => {
      if (!course) {
        setIsLoading(false);
        return;
      }

      try {
        const totalCourses = await academy.getTotalCourses();
        let foundOnChainCourse = null;
        
        for (let i = 1; i <= Math.min(totalCourses, 20); i++) {
          const onChainCourse = await academy.getCourse(i);
          if (onChainCourse && 
              onChainCourse.status === 1 && 
              onChainCourse.title.toLowerCase().trim() === course.title.toLowerCase().trim()) {
            foundOnChainCourse = onChainCourse;
            break;
          }
        }
        
        if (foundOnChainCourse) {
          setOnChainCourseId(foundOnChainCourse.courseId);
          
          if (isConnected && address) {
            const studentCourses = await academy.getStudentCourses(address);
            const enrolled = studentCourses.includes(foundOnChainCourse.courseId);
            setIsEnrolled(enrolled);
            
            if (enrolled) {
              const enrollmentData = await academy.getEnrollment(foundOnChainCourse.courseId, address);
              setEnrollment(enrollmentData);
            }
          }
        }
      } catch (error) {
        console.error("Failed to check enrollment:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkEnrollmentAndCourse();
  }, [course, isConnected, address]);

  const handleCompleteLesson = async () => {
    if (!isConnected) return;
    
    setIsCompleting(true);
    
    // Store completion in localStorage since frontend lessons don't map 1:1 to on-chain modules
    const completionKey = `lesson_completed_${courseId}_${lessonId}_${address}`;
    localStorage.setItem(completionKey, 'true');
    
    // Update local progress tracking
    const progressKey = `course_progress_${courseId}_${address}`;
    const existingProgress = JSON.parse(localStorage.getItem(progressKey) || '[]');
    if (!existingProgress.includes(lessonId)) {
      existingProgress.push(lessonId);
      localStorage.setItem(progressKey, JSON.stringify(existingProgress));
    }
    
    toast({
      title: "Lesson Completed!",
      description: `Great job! You've completed "${lesson?.title}". +10 XP earned!`,
    });
    
    setIsCompleting(false);
    
    if (nextLesson) {
      setTimeout(() => {
        navigate(`/academy/course/${courseId}/lesson/${nextLesson.id}`);
      }, 1000);
    }
  };
  
  // Check local completion status
  const checkLocalCompletion = () => {
    if (!address) return false;
    const completionKey = `lesson_completed_${courseId}_${lessonId}_${address}`;
    return localStorage.getItem(completionKey) === 'true';
  };
  
  const isLocallyCompleted = checkLocalCompletion();

  // Get local progress for this course
  const getLocalProgress = () => {
    if (!address) return [];
    const progressKey = `course_progress_${courseId}_${address}`;
    return JSON.parse(localStorage.getItem(progressKey) || '[]');
  };
  
  const localProgress = getLocalProgress();
  const localCompletedCount = localProgress.length;
  const progressPercent = enrollment?.progressPercentage || (localCompletedCount / totalLessons) * 100;
  const completedLessons = Math.max(Math.floor((enrollment?.progressPercentage || 0) / 100 * totalLessons), localCompletedCount);
  const isLessonCompleted = isLocallyCompleted || lessonIndex < completedLessons;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-6">
            <div className="h-8 w-48 bg-muted rounded" />
            <div className="h-96 bg-muted rounded-lg" />
          </div>
        </main>
      </div>
    );
  }

  if (!course || !lesson) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <h1 className="text-2xl font-bold mb-4">Lesson Not Found</h1>
            <p className="text-muted-foreground mb-6">
              This lesson doesn't exist or has been removed.
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

  if (!isEnrolled) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <div className="text-center py-16">
            <Flame className="h-16 w-16 mx-auto text-orange-500 mb-4" />
            <h1 className="text-2xl font-bold mb-4">Enrollment Required</h1>
            <p className="text-muted-foreground mb-6">
              You need to enroll in "{course.title}" to access this lesson.
            </p>
            <Link href={`/academy/course/${courseId}`}>
              <Button>
                <BookOpen className="h-4 w-4 mr-2" />
                View Course & Enroll
              </Button>
            </Link>
          </div>
        </main>
      </div>
    );
  }

  const CategoryIcon = category?.icon || BookOpen;

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6 flex-wrap">
          <Link href="/academy">
            <Button variant="ghost" size="sm" className="gap-1" data-testid="button-back-forge">
              <Home className="h-4 w-4" />
              The Forge
            </Button>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <Link href={`/academy/course/${courseId}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              {course.title}
            </Button>
          </Link>
          <ChevronRight className="h-4 w-4" />
          <span className="text-foreground">Lesson {lessonIndex + 1}</span>
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground">Course Progress</span>
            <span className="text-sm font-medium">{completedLessons}/{totalLessons} lessons</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>

        <Card className="mb-8">
          <CardContent className="p-6 md:p-8">
            <div className="flex items-start gap-4 mb-6">
              <div className={`h-12 w-12 rounded-xl bg-gradient-to-br ${category?.color || 'from-primary/20 to-primary/10'} flex items-center justify-center shrink-0`}>
                <CategoryIcon className={`h-6 w-6 ${category?.iconColor || 'text-primary'}`} />
              </div>
              <div className="flex-1">
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <Badge variant="outline" className="gap-1">
                    <BookOpen className="h-3 w-3" />
                    Lesson {lessonIndex + 1} of {totalLessons}
                  </Badge>
                  <Badge variant="outline" className="gap-1">
                    <Clock className="h-3 w-3" />
                    {lesson.duration}
                  </Badge>
                  {isLessonCompleted && (
                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                      <CheckCircle className="h-3 w-3 mr-1" />
                      Completed
                    </Badge>
                  )}
                </div>
                <h1 className="text-2xl md:text-3xl font-bold" data-testid="text-lesson-title">{lesson.title}</h1>
              </div>
            </div>

            <div className="bg-muted/30 rounded-lg p-4 mb-6 border">
              <p className="text-muted-foreground italic">{lesson.overview}</p>
            </div>

            {lesson.content ? (
              <div className="prose prose-sm dark:prose-invert max-w-none">
                <div className="lesson-content">
                  {lesson.content.split('\n').map((line, i) => {
                    if (line.startsWith('## ')) {
                      return <h2 key={i} className="text-xl font-bold mt-8 mb-4 text-foreground">{line.replace('## ', '')}</h2>;
                    } else if (line.startsWith('### ')) {
                      return <h3 key={i} className="text-lg font-semibold mt-6 mb-3 text-foreground">{line.replace('### ', '')}</h3>;
                    } else if (line.startsWith('**') && line.endsWith('**')) {
                      return <p key={i} className="font-semibold mt-4 mb-2 text-foreground">{line.replace(/\*\*/g, '')}</p>;
                    } else if (line.startsWith('- ')) {
                      return <li key={i} className="ml-4 text-muted-foreground list-disc">{line.replace('- ', '')}</li>;
                    } else if (line.match(/^\d+\./)) {
                      return <li key={i} className="ml-4 text-muted-foreground list-decimal">{line.replace(/^\d+\.\s*/, '')}</li>;
                    } else if (line.trim() === '') {
                      return <div key={i} className="h-2" />;
                    } else {
                      return <p key={i} className="text-muted-foreground my-2 leading-relaxed">{line}</p>;
                    }
                  })}
                </div>
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                <p>Lesson content is being prepared...</p>
              </div>
            )}

            <Separator className="my-8" />

            <div className="bg-amber-500/10 rounded-lg p-6 border border-amber-500/20">
              <p className="text-lg font-semibold mb-3 flex items-center gap-2">
                <Star className="h-5 w-5 text-amber-500" />
                Key Takeaways
              </p>
              <ul className="space-y-2">
                {lesson.keyTakeaways.map((takeaway, i) => (
                  <li key={i} className="flex items-start gap-3">
                    <CheckCircle className="h-4 w-4 text-emerald-500 mt-1 shrink-0" />
                    <span className="text-muted-foreground">{takeaway}</span>
                  </li>
                ))}
              </ul>
            </div>
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-4 flex-wrap">
          {prevLesson ? (
            <Link href={`/academy/course/${courseId}/lesson/${prevLesson.id}`}>
              <Button variant="outline" data-testid="button-prev-lesson">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Previous: {prevLesson.title}
              </Button>
            </Link>
          ) : (
            <div />
          )}

          <div className="flex items-center gap-3">
            {!isLessonCompleted && (
              <Button 
                onClick={handleCompleteLesson}
                disabled={isCompleting}
                data-testid="button-complete-lesson"
              >
                {isCompleting ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Completing...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark Complete
                  </>
                )}
              </Button>
            )}
            
            {nextLesson ? (
              <Link href={`/academy/course/${courseId}/lesson/${nextLesson.id}`}>
                <Button variant={isLessonCompleted ? "default" : "outline"} data-testid="button-next-lesson">
                  Next: {nextLesson.title}
                  <ArrowRight className="h-4 w-4 ml-2" />
                </Button>
              </Link>
            ) : (
              <Link href={`/academy/course/${courseId}`}>
                <Button data-testid="button-finish-course">
                  <Trophy className="h-4 w-4 mr-2" />
                  Finish Course
                </Button>
              </Link>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
