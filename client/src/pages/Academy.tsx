import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import {
  ArrowLeft,
  GraduationCap,
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
  Unlock
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useWallet } from "@/lib/walletContext";
import { useAcademyContract, CourseInfo, Enrollment, Certification } from "@/lib/useContracts";
import { CONTRACT_ADDRESSES, getExplorerUrl } from "@/lib/contracts";

const COURSE_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Expert'];
const COURSE_STATUS = ['Draft', 'Published', 'Archived'];
const CERT_TYPES = ['Completion', 'Excellence', 'Mastery', 'Instructor'];

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
        description: `You've been enrolled in the course. TX: ${txHash?.slice(0, 10)}...`,
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
      case 0: return "bg-green-500/10 text-green-500";
      case 1: return "bg-blue-500/10 text-blue-500";
      case 2: return "bg-purple-500/10 text-purple-500";
      case 3: return "bg-orange-500/10 text-orange-500";
      default: return "bg-muted text-muted-foreground";
    }
  };

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
            <h1 className="text-3xl font-bold flex items-center gap-2" data-testid="text-academy-title">
              <GraduationCap className="h-8 w-8 text-primary" />
              Axiom Academy
            </h1>
            <p className="text-muted-foreground mt-1">
              Learn Web3, earn certifications, and advance your blockchain knowledge
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

        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card className="hover-elevate" data-testid="card-total-courses">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-total-courses">
                  {totalCourses}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Available on-chain
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-enrollments">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Enrollments</CardTitle>
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
                Active learners
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-certifications">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Certifications Issued</CardTitle>
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
                NFT credentials
              </p>
            </CardContent>
          </Card>

          <Card className="hover-elevate" data-testid="card-your-progress">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Your Progress</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-20" />
              ) : (
                <div className="text-2xl font-bold" data-testid="text-your-courses">
                  {enrolledCourseIds.length} / {certificationIds.length}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                Enrolled / Certified
              </p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="courses" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 lg:w-[400px]">
            <TabsTrigger value="courses" data-testid="tab-courses">
              <BookOpen className="h-4 w-4 mr-2" />
              Courses
            </TabsTrigger>
            <TabsTrigger value="my-learning" data-testid="tab-my-learning">
              <Play className="h-4 w-4 mr-2" />
              My Learning
            </TabsTrigger>
            <TabsTrigger value="certificates" data-testid="tab-certificates">
              <Award className="h-4 w-4 mr-2" />
              Certificates
            </TabsTrigger>
          </TabsList>

          <TabsContent value="courses" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {isLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i} className="overflow-hidden">
                    <Skeleton className="h-40 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-full mb-4" />
                      <Skeleton className="h-10 w-full" />
                    </CardContent>
                  </Card>
                ))
              ) : courses.length === 0 ? (
                <Card className="col-span-full p-8 text-center">
                  <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="text-lg font-semibold mb-2">No Courses Available</h3>
                  <p className="text-muted-foreground">
                    Courses will appear here once they are published on-chain.
                  </p>
                </Card>
              ) : (
                courses.map((course) => (
                  <Card key={course.courseId} className="overflow-hidden hover-elevate" data-testid={`card-course-${course.courseId}`}>
                    <div className="h-32 bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                      <GraduationCap className="h-16 w-16 text-primary/40" />
                    </div>
                    <CardHeader className="pb-2">
                      <div className="flex items-start justify-between gap-2">
                        <CardTitle className="text-lg line-clamp-1">{course.title}</CardTitle>
                        <Badge className={getLevelColor(course.level)}>
                          {COURSE_LEVELS[course.level] || 'Unknown'}
                        </Badge>
                      </div>
                      <CardDescription className="line-clamp-2">
                        {course.description || 'No description available'}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <BookOpen className="h-3 w-3" />
                          {course.totalLessons} lessons
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="h-3 w-3" />
                          {course.enrollmentCount} enrolled
                        </span>
                      </div>
                    </CardContent>
                    <CardFooter>
                      {enrolledCourseIds.includes(course.courseId) ? (
                        <Button variant="secondary" className="w-full" disabled>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Enrolled
                        </Button>
                      ) : (
                        <Button 
                          className="w-full" 
                          onClick={() => handleEnroll(course.courseId)}
                          disabled={enrollingCourse === course.courseId || !isConnected}
                          data-testid={`button-enroll-${course.courseId}`}
                        >
                          {enrollingCourse === course.courseId ? (
                            <>
                              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                              Enrolling...
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Enroll Now
                            </>
                          )}
                        </Button>
                      )}
                    </CardFooter>
                  </Card>
                ))
              )}
            </div>
          </TabsContent>

          <TabsContent value="my-learning" className="space-y-6">
            {!isConnected ? (
              <Card className="p-8 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Connect your wallet to view your enrolled courses and progress.
                </p>
              </Card>
            ) : enrolledCourseIds.length === 0 ? (
              <Card className="p-8 text-center">
                <BookOpen className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Courses Yet</h3>
                <p className="text-muted-foreground mb-4">
                  You haven't enrolled in any courses. Browse available courses to get started.
                </p>
                <Button onClick={() => (document.querySelector('[data-testid="tab-courses"]') as HTMLElement)?.click()}>
                  Browse Courses
                </Button>
              </Card>
            ) : (
              <div className="space-y-4">
                {enrolledCourseIds.map((courseId) => {
                  const course = courses.find(c => c.courseId === courseId);
                  const enrollment = enrollments.get(courseId);
                  
                  if (!course) return null;
                  
                  return (
                    <Card key={courseId} className="hover-elevate" data-testid={`card-enrolled-${courseId}`}>
                      <CardContent className="p-6">
                        <div className="flex items-start gap-4">
                          <div className="h-16 w-16 rounded-lg bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shrink-0">
                            <GraduationCap className="h-8 w-8 text-primary/60" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <h3 className="font-semibold truncate">{course.title}</h3>
                              <Badge className={getLevelColor(course.level)}>
                                {COURSE_LEVELS[course.level]}
                              </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mb-3">
                              {course.totalLessons} lessons
                            </p>
                            <div className="space-y-2">
                              <div className="flex items-center justify-between text-sm">
                                <span>Progress</span>
                                <span className="font-medium">
                                  {enrollment?.progressPercentage || 0}%
                                </span>
                              </div>
                              <Progress value={enrollment?.progressPercentage || 0} className="h-2" />
                            </div>
                          </div>
                          <Button variant="outline" size="sm">
                            <Play className="h-4 w-4 mr-2" />
                            Continue
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>

          <TabsContent value="certificates" className="space-y-6">
            {!isConnected ? (
              <Card className="p-8 text-center">
                <Lock className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">Connect Wallet</h3>
                <p className="text-muted-foreground">
                  Connect your wallet to view your earned certifications.
                </p>
              </Card>
            ) : certifications.length === 0 ? (
              <Card className="p-8 text-center">
                <Award className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <h3 className="text-lg font-semibold mb-2">No Certificates Yet</h3>
                <p className="text-muted-foreground mb-4">
                  Complete courses to earn on-chain certifications that prove your skills.
                </p>
                <Button onClick={() => (document.querySelector('[data-testid="tab-courses"]') as HTMLElement)?.click()}>
                  Start Learning
                </Button>
              </Card>
            ) : (
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {certifications.map((cert) => {
                  const course = courses.find(c => c.courseId === cert.courseId);
                  
                  return (
                    <Card key={cert.certificationId} className="hover-elevate overflow-hidden" data-testid={`card-cert-${cert.certificationId}`}>
                      <div className="h-32 bg-gradient-to-br from-yellow-500/20 to-orange-500/20 flex items-center justify-center">
                        <Award className="h-16 w-16 text-yellow-500/60" />
                      </div>
                      <CardHeader>
                        <div className="flex items-start justify-between gap-2">
                          <CardTitle className="text-lg">
                            {course?.title || `Course #${cert.courseId}`}
                          </CardTitle>
                          <Badge variant="secondary">
                            <Star className="h-3 w-3 mr-1" />
                            {CERT_TYPES[cert.certificationType] || 'Certificate'}
                          </Badge>
                        </div>
                        <CardDescription>
                          Issued: {new Date(cert.issuedAt * 1000).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardFooter className="flex gap-2">
                        <Button variant="outline" size="sm" className="flex-1" asChild>
                          <a 
                            href={cert.credentialURI} 
                            target="_blank" 
                            rel="noopener noreferrer"
                          >
                            <ExternalLink className="h-4 w-4 mr-2" />
                            View NFT
                          </a>
                        </Button>
                      </CardFooter>
                    </Card>
                  );
                })}
              </div>
            )}
          </TabsContent>
        </Tabs>

        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ExternalLink className="h-5 w-5" />
              Contract Information
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">Academy Hub Contract</p>
                <code className="text-sm font-mono">
                  {CONTRACT_ADDRESSES.ACADEMY_HUB}
                </code>
              </div>
              <Button variant="outline" size="sm" asChild>
                <a 
                  href={getExplorerUrl(CONTRACT_ADDRESSES.ACADEMY_HUB)} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  data-testid="link-explorer"
                >
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View on Explorer
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
