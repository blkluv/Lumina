import { useState, useMemo } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/lib/authContext";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { 
  Palette, 
  Sparkles, 
  Image as ImageIcon, 
  Video, 
  Plus, 
  Trash2, 
  Play,
  Clock,
  CheckCircle,
  XCircle,
  Wand2,
  LayoutTemplate,
  History,
  X
} from "lucide-react";
import type { PromptTemplate, GenerationJob, UserBrandProfile } from "@shared/schema";

interface GenerationJobWithDetails extends GenerationJob {
  template?: PromptTemplate | null;
}

export default function CreationHub() {
  const { user, isLoading: authLoading } = useAuth();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState("create");

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Sign In Required</CardTitle>
            <CardDescription>Please sign in to access the Creation Hub</CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Creation Hub
          </h1>
          <p className="text-muted-foreground">
            Generate AI-powered images and videos with your unique visual style
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full max-w-md grid-cols-4">
            <TabsTrigger value="create" className="flex items-center gap-2" data-testid="tab-create">
              <Wand2 className="w-4 h-4" />
              Create
            </TabsTrigger>
            <TabsTrigger value="templates" className="flex items-center gap-2" data-testid="tab-templates">
              <LayoutTemplate className="w-4 h-4" />
              Templates
            </TabsTrigger>
            <TabsTrigger value="brand" className="flex items-center gap-2" data-testid="tab-brand">
              <Palette className="w-4 h-4" />
              Brand
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-2" data-testid="tab-history">
              <History className="w-4 h-4" />
              History
            </TabsTrigger>
          </TabsList>

          <TabsContent value="create">
            <CreationPanel />
          </TabsContent>

          <TabsContent value="templates">
            <TemplatesPanel />
          </TabsContent>

          <TabsContent value="brand">
            <BrandProfilePanel />
          </TabsContent>

          <TabsContent value="history">
            <JobHistoryPanel />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

function CreationPanel() {
  const { toast } = useToast();
  const [subject, setSubject] = useState("");
  const [vibe, setVibe] = useState("");
  const [medium, setMedium] = useState("");
  const [styleOverrides, setStyleOverrides] = useState("");
  const [outputType, setOutputType] = useState<"image" | "video">("image");
  const [modelProvider, setModelProvider] = useState("mock");
  const [templateId, setTemplateId] = useState<string | null>(null);
  const [aspectRatio, setAspectRatio] = useState("1:1");

  const { data: brandProfile } = useQuery<UserBrandProfile | null>({
    queryKey: ["/api/creation-hub/brand-profile"],
  });

  const { data: templates } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/creation-hub/templates"],
  });

  const generateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/creation-hub/generate", data);
      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Generation Started",
        description: "Your content is being generated. Check the History tab for results.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/creation-hub/jobs"] });
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to start generation",
        variant: "destructive",
      });
    },
  });

  const selectedTemplate = templates?.find(t => t.id === templateId);

  const previewPrompt = useMemo(() => {
    let prompt = "";
    
    if (selectedTemplate) {
      prompt = selectedTemplate.basePrompt;
      if (subject) prompt = prompt.replace(/{subject}/g, subject);
      if (vibe) prompt = prompt.replace(/{vibe}/g, vibe);
      if (medium) prompt = prompt.replace(/{medium}/g, medium);
    } else {
      const parts = [];
      if (subject) parts.push(subject);
      if (vibe) parts.push(`in a ${vibe} atmosphere`);
      if (medium) parts.push(`rendered as ${medium}`);
      prompt = parts.join(", ");
    }

    if (brandProfile) {
      const brandParts = [];
      if (brandProfile.styleKeywords) {
        brandParts.push(`in the style of ${brandProfile.styleKeywords}`);
      }
      if (brandProfile.primaryColor || brandProfile.secondaryColor) {
        const colors = [brandProfile.primaryColor, brandProfile.secondaryColor].filter(Boolean).join(" and ");
        if (colors) brandParts.push(`using colors ${colors}`);
      }
      if (brandParts.length > 0) {
        prompt += ", " + brandParts.join(", ");
      }
    }

    if (styleOverrides) {
      prompt += ", " + styleOverrides;
    }

    return prompt || "Enter details to preview your prompt...";
  }, [subject, vibe, medium, styleOverrides, selectedTemplate, brandProfile]);

  const handleGenerate = () => {
    if (!subject && !selectedTemplate) {
      toast({
        title: "Missing Input",
        description: "Please enter a subject or select a template",
        variant: "destructive",
      });
      return;
    }

    generateMutation.mutate({
      subject,
      vibe,
      medium,
      styleOverrides,
      outputType,
      modelProvider,
      templateId,
      aspectRatio: aspectRatio || brandProfile?.defaultAspectRatio || "1:1"
    });
  };

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Wand2 className="w-5 h-5" />
            Generation Settings
          </CardTitle>
          <CardDescription>
            Configure your AI-generated content
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="template">Template (Optional)</Label>
            <Select value={templateId || "none"} onValueChange={(v) => setTemplateId(v === "none" ? null : v)}>
              <SelectTrigger data-testid="select-template">
                <SelectValue placeholder="Select a template..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="none">No template</SelectItem>
                {templates?.map((template) => (
                  <SelectItem key={template.id} value={template.id}>
                    {template.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedTemplate && (
              <p className="text-sm text-muted-foreground">{selectedTemplate.description}</p>
            )}
          </div>

          <div className="space-y-2">
            <Label htmlFor="subject">Subject</Label>
            <Input
              id="subject"
              placeholder="e.g., a majestic lion, a futuristic city..."
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              data-testid="input-subject"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="vibe">Vibe / Atmosphere</Label>
              <Input
                id="vibe"
                placeholder="e.g., ethereal, dark, vibrant..."
                value={vibe}
                onChange={(e) => setVibe(e.target.value)}
                data-testid="input-vibe"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="medium">Medium / Style</Label>
              <Input
                id="medium"
                placeholder="e.g., oil painting, 3D render..."
                value={medium}
                onChange={(e) => setMedium(e.target.value)}
                data-testid="input-medium"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="styleOverrides">Style Overrides</Label>
            <Textarea
              id="styleOverrides"
              placeholder="Add any additional style instructions..."
              value={styleOverrides}
              onChange={(e) => setStyleOverrides(e.target.value)}
              className="resize-none"
              data-testid="input-style-overrides"
            />
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="space-y-2">
              <Label>Output Type</Label>
              <Select value={outputType} onValueChange={(v) => setOutputType(v as "image" | "video")}>
                <SelectTrigger data-testid="select-output-type">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="image">
                    <div className="flex items-center gap-2">
                      <ImageIcon className="w-4 h-4" />
                      Image
                    </div>
                  </SelectItem>
                  <SelectItem value="video">
                    <div className="flex items-center gap-2">
                      <Video className="w-4 h-4" />
                      Video
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Aspect Ratio</Label>
              <Select value={aspectRatio} onValueChange={setAspectRatio}>
                <SelectTrigger data-testid="select-aspect-ratio">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="1:1">1:1 (Square)</SelectItem>
                  <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                  <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                  <SelectItem value="4:5">4:5 (Social)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Provider</Label>
              <Select value={modelProvider} onValueChange={setModelProvider}>
                <SelectTrigger data-testid="select-provider">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="mock">Mock (Demo)</SelectItem>
                  <SelectItem value="replicate" disabled>Replicate</SelectItem>
                  <SelectItem value="stability" disabled>Stability AI</SelectItem>
                  <SelectItem value="openai" disabled>OpenAI</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button 
            onClick={handleGenerate} 
            className="w-full"
            disabled={generateMutation.isPending}
            data-testid="button-generate"
          >
            {generateMutation.isPending ? (
              <>
                <div className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Sparkles className="w-4 h-4 mr-2" />
                Generate {outputType === "image" ? "Image" : "Video"}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Final Prompt Preview</CardTitle>
          <CardDescription>
            This is the prompt that will be sent to the AI model
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 min-h-[200px]">
            <p className="text-sm whitespace-pre-wrap" data-testid="text-prompt-preview">
              {previewPrompt}
            </p>
          </div>

          {brandProfile && (
            <div className="mt-4 flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Brand Style:</span>
              <div className="flex items-center gap-2">
                {brandProfile.primaryColor && (
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: brandProfile.primaryColor }}
                  />
                )}
                {brandProfile.secondaryColor && (
                  <div 
                    className="w-4 h-4 rounded-full border"
                    style={{ backgroundColor: brandProfile.secondaryColor }}
                  />
                )}
                {brandProfile.styleKeywords && (
                  <span className="text-sm">{brandProfile.styleKeywords}</span>
                )}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function TemplatesPanel() {
  const { toast } = useToast();
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    basePrompt: "",
    outputType: "image" as "image" | "video",
    placeholders: ""
  });

  const { data: templates, isLoading } = useQuery<PromptTemplate[]>({
    queryKey: ["/api/creation-hub/templates"],
  });

  const createMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/creation-hub/templates", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Template Created", description: "Your template has been saved" });
      queryClient.invalidateQueries({ queryKey: ["/api/creation-hub/templates"] });
      setShowCreateDialog(false);
      setNewTemplate({ name: "", description: "", basePrompt: "", outputType: "image", placeholders: "" });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await apiRequest("DELETE", `/api/creation-hub/templates/${id}`);
    },
    onSuccess: () => {
      toast({ title: "Template Deleted" });
      queryClient.invalidateQueries({ queryKey: ["/api/creation-hub/templates"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const globalTemplates = templates?.filter(t => !t.ownerId) || [];
  const myTemplates = templates?.filter(t => t.ownerId) || [];

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold">Prompt Templates</h2>
        <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
          <DialogTrigger asChild>
            <Button data-testid="button-create-template">
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>Create New Template</DialogTitle>
              <DialogDescription>
                Create a reusable prompt template with placeholders like {"{subject}"}, {"{vibe}"}, {"{medium}"}
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Template Name</Label>
                <Input
                  value={newTemplate.name}
                  onChange={(e) => setNewTemplate({ ...newTemplate, name: e.target.value })}
                  placeholder="e.g., Cinematic Portrait"
                  data-testid="input-template-name"
                />
              </div>
              <div className="space-y-2">
                <Label>Description</Label>
                <Input
                  value={newTemplate.description}
                  onChange={(e) => setNewTemplate({ ...newTemplate, description: e.target.value })}
                  placeholder="Brief description of what this template creates"
                  data-testid="input-template-description"
                />
              </div>
              <div className="space-y-2">
                <Label>Base Prompt</Label>
                <Textarea
                  value={newTemplate.basePrompt}
                  onChange={(e) => setNewTemplate({ ...newTemplate, basePrompt: e.target.value })}
                  placeholder="A hyper realistic cinematic portrait of {subject} in a {vibe} atmosphere, ultra detailed, {medium}."
                  className="min-h-[100px]"
                  data-testid="input-template-prompt"
                />
                <p className="text-xs text-muted-foreground">
                  Use {"{subject}"}, {"{vibe}"}, {"{medium}"} as placeholders
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Output Type</Label>
                  <Select 
                    value={newTemplate.outputType} 
                    onValueChange={(v) => setNewTemplate({ ...newTemplate, outputType: v as "image" | "video" })}
                  >
                    <SelectTrigger data-testid="select-template-output-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="image">Image</SelectItem>
                      <SelectItem value="video">Video</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Placeholders</Label>
                  <Input
                    value={newTemplate.placeholders}
                    onChange={(e) => setNewTemplate({ ...newTemplate, placeholders: e.target.value })}
                    placeholder="subject, vibe, medium"
                    data-testid="input-template-placeholders"
                  />
                </div>
              </div>
              <Button 
                onClick={() => createMutation.mutate(newTemplate)}
                disabled={!newTemplate.name || !newTemplate.basePrompt || createMutation.isPending}
                className="w-full"
                data-testid="button-save-template"
              >
                {createMutation.isPending ? "Saving..." : "Save Template"}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {myTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">My Templates</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {myTemplates.map((template) => (
              <Card key={template.id} className="hover-elevate">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <div className="flex items-center gap-1">
                      <Badge variant="outline">
                        {template.outputType === "image" ? (
                          <ImageIcon className="w-3 h-3 mr-1" />
                        ) : (
                          <Video className="w-3 h-3 mr-1" />
                        )}
                        {template.outputType}
                      </Badge>
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteMutation.mutate(template.id)}
                        data-testid={`button-delete-template-${template.id}`}
                      >
                        <Trash2 className="w-4 h-4 text-destructive" />
                      </Button>
                    </div>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.basePrompt}
                  </p>
                  {template.placeholders && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {template.placeholders.split(",").map((p, i) => (
                        <Badge key={i} variant="secondary" className="text-xs">
                          {"{" + p.trim() + "}"}
                        </Badge>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {globalTemplates.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-medium">Global Templates</h3>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
            {globalTemplates.map((template) => (
              <Card key={template.id} className="hover-elevate">
                <CardHeader className="pb-2">
                  <div className="flex items-start justify-between gap-2">
                    <CardTitle className="text-base">{template.name}</CardTitle>
                    <Badge variant="outline">
                      {template.outputType === "image" ? (
                        <ImageIcon className="w-3 h-3 mr-1" />
                      ) : (
                        <Video className="w-3 h-3 mr-1" />
                      )}
                      {template.outputType}
                    </Badge>
                  </div>
                  <CardDescription>{template.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-3">
                    {template.basePrompt}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {templates?.length === 0 && (
        <Card className="py-12">
          <CardContent className="text-center">
            <LayoutTemplate className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Templates Yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first prompt template to speed up content generation
            </p>
            <Button onClick={() => setShowCreateDialog(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Create Template
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

function BrandProfilePanel() {
  const { toast } = useToast();
  const [primaryColor, setPrimaryColor] = useState("#10b981");
  const [secondaryColor, setSecondaryColor] = useState("#6366f1");
  const [styleKeywords, setStyleKeywords] = useState<string[]>([]);
  const [newKeyword, setNewKeyword] = useState("");
  const [defaultAspectRatio, setDefaultAspectRatio] = useState("1:1");

  const { data: profile, isLoading } = useQuery<UserBrandProfile | null>({
    queryKey: ["/api/creation-hub/brand-profile"],
  });

  useState(() => {
    if (profile) {
      setPrimaryColor(profile.primaryColor || "#10b981");
      setSecondaryColor(profile.secondaryColor || "#6366f1");
      setStyleKeywords(profile.styleKeywords?.split(",").map(s => s.trim()).filter(Boolean) || []);
      setDefaultAspectRatio(profile.defaultAspectRatio || "1:1");
    }
  });

  const updateMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("PUT", "/api/creation-hub/brand-profile", data);
      return response.json();
    },
    onSuccess: () => {
      toast({ title: "Brand Profile Saved", description: "Your visual style has been updated" });
      queryClient.invalidateQueries({ queryKey: ["/api/creation-hub/brand-profile"] });
    },
    onError: (error: any) => {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    },
  });

  const addKeyword = () => {
    if (newKeyword.trim() && !styleKeywords.includes(newKeyword.trim())) {
      setStyleKeywords([...styleKeywords, newKeyword.trim()]);
      setNewKeyword("");
    }
  };

  const removeKeyword = (keyword: string) => {
    setStyleKeywords(styleKeywords.filter(k => k !== keyword));
  };

  const handleSave = () => {
    updateMutation.mutate({
      primaryColor,
      secondaryColor,
      styleKeywords: styleKeywords.join(", "),
      defaultAspectRatio
    });
  };

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="grid lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="w-5 h-5" />
            Brand Colors
          </CardTitle>
          <CardDescription>
            Define your visual identity colors
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Primary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                  data-testid="input-primary-color"
                />
                <Input
                  value={primaryColor}
                  onChange={(e) => setPrimaryColor(e.target.value)}
                  className="flex-1"
                  data-testid="input-primary-color-hex"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>Secondary Color</Label>
              <div className="flex items-center gap-2">
                <input
                  type="color"
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="w-12 h-10 rounded border cursor-pointer"
                  data-testid="input-secondary-color"
                />
                <Input
                  value={secondaryColor}
                  onChange={(e) => setSecondaryColor(e.target.value)}
                  className="flex-1"
                  data-testid="input-secondary-color-hex"
                />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Default Aspect Ratio</Label>
            <Select value={defaultAspectRatio} onValueChange={setDefaultAspectRatio}>
              <SelectTrigger data-testid="select-default-aspect-ratio">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1:1">1:1 (Square)</SelectItem>
                <SelectItem value="16:9">16:9 (Landscape)</SelectItem>
                <SelectItem value="9:16">9:16 (Portrait)</SelectItem>
                <SelectItem value="4:5">4:5 (Social)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label>Style Keywords</Label>
            <p className="text-sm text-muted-foreground mb-2">
              Add keywords that define your visual aesthetic
            </p>
            <div className="flex gap-2">
              <Input
                value={newKeyword}
                onChange={(e) => setNewKeyword(e.target.value)}
                placeholder="e.g., neon cyberpunk, minimalist..."
                onKeyDown={(e) => e.key === "Enter" && addKeyword()}
                data-testid="input-style-keyword"
              />
              <Button onClick={addKeyword} variant="outline" data-testid="button-add-keyword">
                <Plus className="w-4 h-4" />
              </Button>
            </div>
            <div className="flex flex-wrap gap-2 mt-3">
              {styleKeywords.map((keyword, i) => (
                <Badge key={i} variant="secondary" className="flex items-center gap-1">
                  {keyword}
                  <button
                    onClick={() => removeKeyword(keyword)}
                    className="ml-1 hover:text-destructive"
                    data-testid={`button-remove-keyword-${i}`}
                  >
                    <X className="w-3 h-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <Button 
            onClick={handleSave}
            disabled={updateMutation.isPending}
            className="w-full"
            data-testid="button-save-brand"
          >
            {updateMutation.isPending ? "Saving..." : "Save Brand Profile"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Preview</CardTitle>
          <CardDescription>
            See how your brand style will appear in prompts
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="bg-muted rounded-lg p-4 mb-4">
            <p className="text-sm">
              <span className="text-muted-foreground">Style modifier: </span>
              {styleKeywords.length > 0 ? (
                <span>in the style of {styleKeywords.join(", ")}</span>
              ) : (
                <span className="text-muted-foreground italic">No style keywords added</span>
              )}
            </p>
            <p className="text-sm mt-2">
              <span className="text-muted-foreground">Color modifier: </span>
              using colors {primaryColor} and {secondaryColor}
            </p>
          </div>

          <div className="space-y-2">
            <Label>Color Preview</Label>
            <div className="flex gap-2">
              <div 
                className="flex-1 h-24 rounded-lg flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: primaryColor }}
              >
                Primary
              </div>
              <div 
                className="flex-1 h-24 rounded-lg flex items-center justify-center text-white font-medium"
                style={{ backgroundColor: secondaryColor }}
              >
                Secondary
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function JobHistoryPanel() {
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [outputFilter, setOutputFilter] = useState<string>("all");

  const { data: jobs, isLoading } = useQuery<GenerationJobWithDetails[]>({
    queryKey: ["/api/creation-hub/jobs"],
    refetchInterval: 5000,
  });

  const filteredJobs = jobs?.filter(job => {
    if (statusFilter !== "all" && job.status !== statusFilter) return false;
    if (outputFilter !== "all" && job.outputType !== outputFilter) return false;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex justify-center py-12">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "pending":
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case "running":
        return <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin" />;
      case "completed":
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case "failed":
        return <XCircle className="w-4 h-4 text-destructive" />;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-4 items-center justify-between">
        <h2 className="text-xl font-semibold">Generation History</h2>
        <div className="flex gap-2">
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-status-filter">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="running">Running</SelectItem>
              <SelectItem value="completed">Completed</SelectItem>
              <SelectItem value="failed">Failed</SelectItem>
            </SelectContent>
          </Select>
          <Select value={outputFilter} onValueChange={setOutputFilter}>
            <SelectTrigger className="w-[140px]" data-testid="select-output-filter">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Types</SelectItem>
              <SelectItem value="image">Images</SelectItem>
              <SelectItem value="video">Videos</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {filteredJobs && filteredJobs.length > 0 ? (
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredJobs.map((job) => (
            <Card key={job.id} className="overflow-hidden hover-elevate">
              <div className="aspect-video bg-muted relative">
                {job.resultUrl ? (
                  job.outputType === "image" ? (
                    <img
                      src={job.resultUrl}
                      alt="Generated content"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <Play className="w-12 h-12 text-muted-foreground" />
                    </div>
                  )
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    {job.status === "running" || job.status === "pending" ? (
                      <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <XCircle className="w-12 h-12 text-muted-foreground" />
                    )}
                  </div>
                )}
                <div className="absolute top-2 right-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    {getStatusIcon(job.status)}
                    {job.status}
                  </Badge>
                </div>
                <div className="absolute top-2 left-2">
                  <Badge variant="outline" className="bg-background/80">
                    {job.outputType === "image" ? (
                      <ImageIcon className="w-3 h-3 mr-1" />
                    ) : (
                      <Video className="w-3 h-3 mr-1" />
                    )}
                    {job.aspectRatio}
                  </Badge>
                </div>
              </div>
              <CardContent className="p-4">
                <p className="text-sm text-muted-foreground line-clamp-2 mb-2">
                  {job.resolvedPrompt}
                </p>
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>{job.provider} / {job.model}</span>
                  <span>
                    {job.createdAt ? new Date(job.createdAt).toLocaleDateString() : "Unknown"}
                  </span>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="py-12">
          <CardContent className="text-center">
            <History className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium mb-2">No Generations Yet</h3>
            <p className="text-muted-foreground">
              Start creating content to see your generation history here
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
