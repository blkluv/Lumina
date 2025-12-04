import { useState, useEffect } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  ArrowLeft,
  Flame,
  BookOpen,
  Award,
  Clock,
  CheckCircle,
  Plus,
  RefreshCw,
  Settings,
  Users,
  Shield,
  AlertCircle,
  Rocket,
  Trash2,
  Edit,
  Eye,
  Upload
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Header } from "@/components/layout/Header";
import { useWallet } from "@/lib/walletContext";
import { useAcademyContract, CourseInfo } from "@/lib/useContracts";
import { COURSE_CONTENT, COURSE_LEVELS, getCategoryForCourse, CourseContent } from "@/data/forgeCourses";

const ADMIN_WALLET = "0xDFf9e47eb007bF02e47477d577De9ffA99791528".toLowerCase();

export default function AdminAcademy() {
  const { toast } = useToast();
  const { isConnected, address } = useWallet();
  const academy = useAcademyContract();

  const [isAdmin, setIsAdmin] = useState(false);
  const [isInstructor, setIsInstructor] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [onChainCourses, setOnChainCourses] = useState<CourseInfo[]>([]);
  const [totalCourses, setTotalCourses] = useState(0);

  const [hasAdminRole, setHasAdminRole] = useState(false);
  const [hasInstructorRole, setHasInstructorRole] = useState(false);
  const [instructorRoleBytes, setInstructorRoleBytes] = useState<string | null>(null);
  const [isGrantingRole, setIsGrantingRole] = useState(false);

  const [isRegistering, setIsRegistering] = useState(false);
  const [instructorName, setInstructorName] = useState("");
  const [instructorBio, setInstructorBio] = useState("");

  const [isCreating, setIsCreating] = useState(false);
  const [selectedCourseTemplate, setSelectedCourseTemplate] = useState<string>("");
  const [courseTitle, setCourseTitle] = useState("");
  const [courseDescription, setCourseDescription] = useState("");
  const [courseLevel, setCourseLevel] = useState("0");
  const [requiresVerification, setRequiresVerification] = useState(false);

  const [createdCourseId, setCreatedCourseId] = useState<number | null>(null);
  const [isAddingModule, setIsAddingModule] = useState(false);
  const [moduleTitle, setModuleTitle] = useState("");
  const [moduleDescription, setModuleDescription] = useState("");

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishCourseId, setPublishCourseId] = useState("");

  useEffect(() => {
    if (address) {
      setIsAdmin(address.toLowerCase() === ADMIN_WALLET);
    } else {
      setIsAdmin(false);
    }
  }, [address]);

  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        if (address) {
          const instructorStatus = await academy.isInstructor(address);
          setIsInstructor(instructorStatus);

          const adminRole = await academy.getDefaultAdminRole();
          const instRole = await academy.getInstructorRole();
          setInstructorRoleBytes(instRole);

          if (adminRole && instRole) {
            const hasAdmin = await academy.hasRole(adminRole, address);
            const hasInst = await academy.hasRole(instRole, address);
            setHasAdminRole(hasAdmin);
            setHasInstructorRole(hasInst);
          }
        }

        const count = await academy.getTotalCourses();
        setTotalCourses(count);

        const courses: CourseInfo[] = [];
        for (let i = 1; i <= Math.min(count, 50); i++) {
          const course = await academy.getCourse(i);
          if (course) {
            courses.push(course);
          }
        }
        setOnChainCourses(courses);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, [address]);

  const handleRegisterInstructor = async () => {
    if (!instructorName.trim()) {
      toast({ title: "Name required", variant: "destructive" });
      return;
    }

    setIsRegistering(true);
    try {
      const txHash = await academy.registerInstructor(
        instructorName,
        instructorBio,
        ""
      );
      toast({
        title: "Registration Successful",
        description: `You are now registered as an instructor. TX: ${txHash?.slice(0, 10)}...`,
      });
      setIsInstructor(true);
    } catch (error: any) {
      toast({
        title: "Registration Failed",
        description: error.message || "Failed to register as instructor",
        variant: "destructive",
      });
    } finally {
      setIsRegistering(false);
    }
  };

  const handleGrantInstructorRole = async () => {
    if (!instructorRoleBytes || !address) {
      toast({ title: "Role data not loaded", variant: "destructive" });
      return;
    }

    setIsGrantingRole(true);
    try {
      const txHash = await academy.grantRole(instructorRoleBytes, address);
      toast({
        title: "Role Granted",
        description: `INSTRUCTOR_ROLE granted successfully. TX: ${txHash?.slice(0, 10)}...`,
      });
      setHasInstructorRole(true);
    } catch (error: any) {
      const errMsg = error.message || "Failed to grant role";
      if (errMsg.includes("AccessControl")) {
        toast({
          title: "Permission Denied",
          description: "Your wallet doesn't have DEFAULT_ADMIN_ROLE. Contact the contract owner to grant you instructor access.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Grant Role Failed",
          description: errMsg,
          variant: "destructive",
        });
      }
    } finally {
      setIsGrantingRole(false);
    }
  };

  const handleCreateCourse = async () => {
    if (!courseTitle.trim() || !courseDescription.trim()) {
      toast({ title: "Title and description required", variant: "destructive" });
      return;
    }

    setIsCreating(true);
    try {
      const result = await academy.createCourse(
        courseTitle,
        courseDescription,
        "",
        parseInt(courseLevel),
        requiresVerification
      );
      
      if (result) {
        toast({
          title: "Course Created",
          description: `Course ID: ${result.courseId}. TX: ${result.txHash?.slice(0, 10)}...`,
        });
        setCreatedCourseId(result.courseId);
        setTotalCourses(prev => prev + 1);
        
        const newCourse = await academy.getCourse(result.courseId);
        if (newCourse) {
          setOnChainCourses(prev => [...prev, newCourse]);
        }
      }
    } catch (error: any) {
      toast({
        title: "Creation Failed",
        description: error.message || "Failed to create course",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const handleAddModule = async () => {
    if (!createdCourseId || !moduleTitle.trim()) {
      toast({ title: "Course ID and module title required", variant: "destructive" });
      return;
    }

    setIsAddingModule(true);
    try {
      const result = await academy.addModule(
        createdCourseId,
        moduleTitle,
        moduleDescription,
        true
      );
      
      if (result) {
        toast({
          title: "Module Added",
          description: `Module added to course ${createdCourseId}. TX: ${result.txHash?.slice(0, 10)}...`,
        });
        setModuleTitle("");
        setModuleDescription("");
        
        const updatedCourse = await academy.getCourse(createdCourseId);
        if (updatedCourse) {
          setOnChainCourses(prev => 
            prev.map(c => c.courseId === createdCourseId ? updatedCourse : c)
          );
        }
      }
    } catch (error: any) {
      toast({
        title: "Add Module Failed",
        description: error.message || "Failed to add module",
        variant: "destructive",
      });
    } finally {
      setIsAddingModule(false);
    }
  };

  const handleQuickAddModule = async (courseId: number, courseTitle: string) => {
    setIsAddingModule(true);
    try {
      const result = await academy.addModule(
        courseId,
        "Introduction",
        `Welcome to ${courseTitle}. This module covers the fundamentals.`,
        true
      );
      
      if (result) {
        toast({
          title: "Module Added",
          description: `Introduction module added to "${courseTitle}". TX: ${result.txHash?.slice(0, 10)}...`,
        });
        
        const updatedCourse = await academy.getCourse(courseId);
        if (updatedCourse) {
          setOnChainCourses(prev => 
            prev.map(c => c.courseId === courseId ? updatedCourse : c)
          );
        }
      }
    } catch (error: any) {
      toast({
        title: "Add Module Failed",
        description: error.message || "Failed to add module",
        variant: "destructive",
      });
    } finally {
      setIsAddingModule(false);
    }
  };

  const handlePublishCourse = async () => {
    const courseId = parseInt(publishCourseId);
    if (!courseId || isNaN(courseId)) {
      toast({ title: "Valid course ID required", variant: "destructive" });
      return;
    }

    setIsPublishing(true);
    try {
      const txHash = await academy.publishCourse(courseId);
      toast({
        title: "Course Published",
        description: `Course ${courseId} is now live! TX: ${txHash?.slice(0, 10)}...`,
      });
      
      const updatedCourse = await academy.getCourse(courseId);
      if (updatedCourse) {
        setOnChainCourses(prev => 
          prev.map(c => c.courseId === courseId ? updatedCourse : c)
        );
      }
    } catch (error: any) {
      toast({
        title: "Publish Failed",
        description: error.message || "Failed to publish course",
        variant: "destructive",
      });
    } finally {
      setIsPublishing(false);
    }
  };

  const handleSelectTemplate = (templateId: string) => {
    setSelectedCourseTemplate(templateId);
    const course = COURSE_CONTENT[parseInt(templateId)];
    if (course) {
      setCourseTitle(course.title);
      setCourseDescription(course.longDescription);
      setCourseLevel(course.level.toString());
    }
  };

  if (!isConnected) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="text-center p-8">
            <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-xl font-bold mb-2">Wallet Required</h2>
            <p className="text-muted-foreground">Please connect your wallet to access the admin panel.</p>
          </Card>
        </main>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-background">
        <Header />
        <main className="container mx-auto px-4 py-8 max-w-4xl">
          <Card className="text-center p-8">
            <Shield className="h-12 w-12 mx-auto text-destructive mb-4" />
            <h2 className="text-xl font-bold mb-2">Access Denied</h2>
            <p className="text-muted-foreground mb-4">
              This admin panel is restricted to the contract administrator.
            </p>
            <p className="text-sm text-muted-foreground">
              Connected: {address?.slice(0, 6)}...{address?.slice(-4)}
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              Required: {ADMIN_WALLET.slice(0, 6)}...{ADMIN_WALLET.slice(-4)}
            </p>
            <Link href="/academy">
              <Button variant="outline" className="mt-4">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to The Forge
              </Button>
            </Link>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header />

      <main className="container mx-auto px-4 py-8 max-w-6xl">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-4">
            <Link href="/academy">
              <Button variant="ghost" size="sm" data-testid="button-back">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold flex items-center gap-2">
                <Settings className="h-6 w-6" />
                Academy Admin Panel
              </h1>
              <p className="text-muted-foreground">Manage courses on the AxiomAcademyHub contract</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline" className="bg-green-500/10 text-green-500">
              <CheckCircle className="h-3 w-3 mr-1" />
              Admin Connected
            </Badge>
            {isInstructor && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-500">
                <Award className="h-3 w-3 mr-1" />
                Instructor
              </Badge>
            )}
          </div>
        </div>

        {/* Role Status & Management */}
        <Card className="mb-8 border-orange-500/20">
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Shield className="h-5 w-5 text-orange-500" />
              Role Management
            </CardTitle>
            <CardDescription>
              Contract access control status and role assignment
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Shield className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">DEFAULT_ADMIN_ROLE</span>
                </div>
                <Badge variant={hasAdminRole ? "default" : "secondary"}>
                  {hasAdminRole ? "Granted" : "Not Granted"}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Award className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">INSTRUCTOR_ROLE</span>
                </div>
                <Badge variant={hasInstructorRole ? "default" : "secondary"}>
                  {hasInstructorRole ? "Granted" : "Not Granted"}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/50">
                <div className="flex items-center gap-2 mb-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="text-sm font-medium">Instructor Status</span>
                </div>
                <Badge variant={isInstructor ? "default" : "secondary"}>
                  {isInstructor ? "Registered" : "Not Registered"}
                </Badge>
              </div>
              <div className="p-4 rounded-lg bg-muted/50 flex flex-col justify-center">
                {!hasInstructorRole ? (
                  <Button
                    size="sm"
                    onClick={handleGrantInstructorRole}
                    disabled={isGrantingRole || !hasAdminRole}
                    data-testid="button-grant-role"
                  >
                    {isGrantingRole ? (
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    ) : (
                      <Plus className="h-4 w-4 mr-2" />
                    )}
                    Grant Instructor Role
                  </Button>
                ) : (
                  <Badge className="bg-green-500/10 text-green-500 justify-center">
                    <CheckCircle className="h-3 w-3 mr-1" />
                    Ready to Create
                  </Badge>
                )}
                {!hasAdminRole && !hasInstructorRole && (
                  <p className="text-xs text-muted-foreground mt-2 text-center">
                    Need DEFAULT_ADMIN_ROLE to grant roles
                  </p>
                )}
              </div>
            </div>
            {!hasInstructorRole && (
              <div className="mt-4 p-4 rounded-lg bg-yellow-500/10 border border-yellow-500/20">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-500">Instructor Role Required</p>
                    <p className="text-sm text-muted-foreground mt-1">
                      To create courses, you need the INSTRUCTOR_ROLE on the AxiomAcademyHub contract. 
                      {hasAdminRole 
                        ? " Click 'Grant Instructor Role' above to assign it to yourself."
                        : " The contract deployer needs to grant you this role via the contract's grantRole function."}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        <div className="grid gap-4 md:grid-cols-3 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">On-Chain Courses</CardTitle>
              <BookOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{totalCourses}</div>
              <p className="text-xs text-muted-foreground">Total created</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Published</CardTitle>
              <Rocket className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {onChainCourses.filter(c => c.status === 1).length}
              </div>
              <p className="text-xs text-muted-foreground">Active courses</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Draft</CardTitle>
              <Edit className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {onChainCourses.filter(c => c.status === 0).length}
              </div>
              <p className="text-xs text-muted-foreground">Awaiting publish</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="create" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="create" data-testid="tab-create">Create Course</TabsTrigger>
            <TabsTrigger value="manage" data-testid="tab-manage">Manage Courses</TabsTrigger>
            <TabsTrigger value="publish" data-testid="tab-publish">Publish</TabsTrigger>
            <TabsTrigger value="instructor" data-testid="tab-instructor">Instructor</TabsTrigger>
          </TabsList>

          <TabsContent value="create" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Plus className="h-5 w-5" />
                  Create New Course
                </CardTitle>
                <CardDescription>
                  Create a new course on the blockchain. You can use a template from The Forge curriculum or create from scratch.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label>Use Template (Optional)</Label>
                  <Select value={selectedCourseTemplate} onValueChange={handleSelectTemplate}>
                    <SelectTrigger data-testid="select-template">
                      <SelectValue placeholder="Select a course template..." />
                    </SelectTrigger>
                    <SelectContent>
                      {Object.values(COURSE_CONTENT).map((course: CourseContent) => {
                        const cat = getCategoryForCourse(course.id);
                        return (
                          <SelectItem key={course.id} value={course.id.toString()}>
                            {cat?.name}: {course.title}
                          </SelectItem>
                        );
                      })}
                    </SelectContent>
                  </Select>
                </div>

                <Separator />

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="title">Course Title *</Label>
                    <Input
                      id="title"
                      value={courseTitle}
                      onChange={(e) => setCourseTitle(e.target.value)}
                      placeholder="Enter course title"
                      data-testid="input-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="level">Difficulty Level</Label>
                    <Select value={courseLevel} onValueChange={setCourseLevel}>
                      <SelectTrigger data-testid="select-level">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {COURSE_LEVELS.map((level, i) => (
                          <SelectItem key={i} value={i.toString()}>{level}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Course Description *</Label>
                  <Textarea
                    id="description"
                    value={courseDescription}
                    onChange={(e) => setCourseDescription(e.target.value)}
                    placeholder="Enter course description"
                    rows={4}
                    data-testid="input-description"
                  />
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="verification"
                    checked={requiresVerification}
                    onCheckedChange={setRequiresVerification}
                  />
                  <Label htmlFor="verification">Require verification for enrollment</Label>
                </div>
              </CardContent>
              <CardFooter>
                <Button 
                  onClick={handleCreateCourse} 
                  disabled={isCreating || !courseTitle.trim() || !courseDescription.trim()}
                  data-testid="button-create-course"
                >
                  {isCreating ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Creating...
                    </>
                  ) : (
                    <>
                      <Plus className="h-4 w-4 mr-2" />
                      Create Course
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>

            {createdCourseId && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Add Module to Course #{createdCourseId}
                  </CardTitle>
                  <CardDescription>
                    Add modules to structure your course content.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="moduleTitle">Module Title *</Label>
                    <Input
                      id="moduleTitle"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="Enter module title"
                      data-testid="input-module-title"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moduleDesc">Module Description</Label>
                    <Textarea
                      id="moduleDesc"
                      value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)}
                      placeholder="Enter module description"
                      rows={2}
                    />
                  </div>
                </CardContent>
                <CardFooter>
                  <Button 
                    onClick={handleAddModule} 
                    disabled={isAddingModule || !moduleTitle.trim()}
                    data-testid="button-add-module"
                  >
                    {isAddingModule ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Module
                      </>
                    )}
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="manage" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>On-Chain Courses</CardTitle>
                <CardDescription>
                  View and manage all courses created on the AxiomAcademyHub contract.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {isLoading ? (
                  <div className="text-center py-8 text-muted-foreground">Loading courses...</div>
                ) : onChainCourses.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No courses found on-chain. Create your first course above.
                  </div>
                ) : (
                  <ScrollArea className="h-96">
                    <div className="space-y-3">
                      {onChainCourses.map((course) => (
                        <div
                          key={course.courseId}
                          className="flex items-center justify-between p-4 rounded-lg border"
                          data-testid={`course-row-${course.courseId}`}
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                              <BookOpen className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <p className="font-medium">#{course.courseId}: {course.title}</p>
                              <p className="text-sm text-muted-foreground">
                                Level: {COURSE_LEVELS[course.level]} • {course.moduleCount} modules • {course.enrollmentCount} enrolled
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 flex-wrap justify-end">
                            {course.status === 0 && course.moduleCount === 0 && (
                              <Badge variant="outline" className="text-yellow-500 border-yellow-500/30">
                                Needs Module
                              </Badge>
                            )}
                            <Badge variant={course.status === 1 ? "default" : "secondary"}>
                              {course.status === 0 ? "Draft" : course.status === 1 ? "Published" : "Archived"}
                            </Badge>
                            {course.status === 0 && course.moduleCount === 0 && (
                              <Button
                                size="sm"
                                onClick={() => handleQuickAddModule(course.courseId, course.title)}
                                disabled={isAddingModule}
                                data-testid={`button-quick-add-${course.courseId}`}
                              >
                                {isAddingModule ? (
                                  <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                                ) : (
                                  <Rocket className="h-3 w-3 mr-1" />
                                )}
                                Quick Add Intro
                              </Button>
                            )}
                            {course.status === 0 && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setCreatedCourseId(course.courseId)}
                                data-testid={`button-select-course-${course.courseId}`}
                              >
                                <Plus className="h-3 w-3 mr-1" />
                                Custom Module
                              </Button>
                            )}
                          </div>
                        </div>
                      ))}
                    </div>
                  </ScrollArea>
                )}
              </CardContent>
            </Card>

            {createdCourseId && (
              <Card className="border-primary/20">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Add Module to Course #{createdCourseId}
                  </CardTitle>
                  <CardDescription>
                    Each course must have at least one module before it can be published.
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="moduleTitle2">Module Title *</Label>
                    <Input
                      id="moduleTitle2"
                      value={moduleTitle}
                      onChange={(e) => setModuleTitle(e.target.value)}
                      placeholder="e.g., Getting Started, Introduction, Basics"
                      data-testid="input-module-title-manage"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="moduleDesc2">Module Description</Label>
                    <Textarea
                      id="moduleDesc2"
                      value={moduleDescription}
                      onChange={(e) => setModuleDescription(e.target.value)}
                      placeholder="What students will learn in this module"
                      rows={2}
                    />
                  </div>
                </CardContent>
                <CardFooter className="flex gap-2">
                  <Button 
                    onClick={handleAddModule} 
                    disabled={isAddingModule || !moduleTitle.trim()}
                    data-testid="button-add-module-manage"
                  >
                    {isAddingModule ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      <>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Module
                      </>
                    )}
                  </Button>
                  <Button 
                    variant="outline"
                    onClick={() => setCreatedCourseId(null)}
                  >
                    Cancel
                  </Button>
                </CardFooter>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="publish" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Rocket className="h-5 w-5" />
                  Publish Course
                </CardTitle>
                <CardDescription>
                  Publish a draft course to make it available for student enrollment.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 mb-4">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-blue-500 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="font-medium text-blue-500">Before Publishing</p>
                      <p className="text-sm text-muted-foreground mt-1">
                        Courses must have <strong>at least one module</strong> before they can be published. 
                        Go to "Manage Courses" tab to add modules to draft courses.
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="publishId">Course ID to Publish</Label>
                  <Input
                    id="publishId"
                    type="number"
                    value={publishCourseId}
                    onChange={(e) => setPublishCourseId(e.target.value)}
                    placeholder="Enter course ID"
                    data-testid="input-publish-id"
                  />
                </div>

                {onChainCourses.filter(c => c.status === 0).length > 0 && (
                  <div className="p-3 rounded-lg bg-muted">
                    <p className="text-sm font-medium mb-2">Draft Courses:</p>
                    <div className="flex flex-wrap gap-2">
                      {onChainCourses
                        .filter(c => c.status === 0)
                        .map((course) => (
                          <Button
                            key={course.courseId}
                            variant={course.moduleCount === 0 ? "secondary" : "outline"}
                            size="sm"
                            onClick={() => setPublishCourseId(course.courseId.toString())}
                            className={course.moduleCount === 0 ? "opacity-50" : ""}
                            data-testid={`button-draft-${course.courseId}`}
                          >
                            #{course.courseId}: {course.title}
                            {course.moduleCount === 0 && " (No modules)"}
                            {course.moduleCount > 0 && ` (${course.moduleCount} modules)`}
                          </Button>
                        ))}
                    </div>
                  </div>
                )}
              </CardContent>
              <CardFooter>
                <Button
                  onClick={handlePublishCourse}
                  disabled={isPublishing || !publishCourseId}
                  data-testid="button-publish"
                >
                  {isPublishing ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Publishing...
                    </>
                  ) : (
                    <>
                      <Rocket className="h-4 w-4 mr-2" />
                      Publish Course
                    </>
                  )}
                </Button>
              </CardFooter>
            </Card>
          </TabsContent>

          <TabsContent value="instructor" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Instructor Registration
                </CardTitle>
                <CardDescription>
                  Register as an instructor to create and manage courses.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {isInstructor ? (
                  <div className="flex items-center gap-3 p-4 rounded-lg bg-green-500/10">
                    <CheckCircle className="h-5 w-5 text-green-500" />
                    <div>
                      <p className="font-medium text-green-700 dark:text-green-400">
                        You are registered as an instructor
                      </p>
                      <p className="text-sm text-muted-foreground">
                        You can create and manage courses on the platform.
                      </p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="space-y-2">
                      <Label htmlFor="instName">Instructor Name *</Label>
                      <Input
                        id="instName"
                        value={instructorName}
                        onChange={(e) => setInstructorName(e.target.value)}
                        placeholder="Your name"
                        data-testid="input-instructor-name"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="instBio">Bio</Label>
                      <Textarea
                        id="instBio"
                        value={instructorBio}
                        onChange={(e) => setInstructorBio(e.target.value)}
                        placeholder="Tell us about yourself..."
                        rows={3}
                      />
                    </div>
                  </>
                )}
              </CardContent>
              {!isInstructor && (
                <CardFooter>
                  <Button
                    onClick={handleRegisterInstructor}
                    disabled={isRegistering || !instructorName.trim()}
                    data-testid="button-register-instructor"
                  >
                    {isRegistering ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Registering...
                      </>
                    ) : (
                      <>
                        <Award className="h-4 w-4 mr-2" />
                        Register as Instructor
                      </>
                    )}
                  </Button>
                </CardFooter>
              )}
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
