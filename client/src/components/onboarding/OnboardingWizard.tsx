import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/lib/authContext";
import { useWallet } from "@/lib/walletContext";
import { 
  Sparkles, User, Wallet, Search, PenLine, 
  ChevronRight, ChevronLeft, Check, X
} from "lucide-react";
import type { UserOnboarding } from "@shared/schema";

const STEPS = [
  {
    id: "welcome",
    title: "Welcome to Lumina",
    description: "The next generation Web3 social platform where creators earn rewards",
    icon: Sparkles,
  },
  {
    id: "profile",
    title: "Complete Your Profile",
    description: "Add a profile picture and bio to stand out",
    icon: User,
    action: "Go to Settings",
    actionPath: "/settings",
  },
  {
    id: "wallet",
    title: "Connect Your Wallet",
    description: "Link your Arbitrum wallet to receive AXM rewards and tips",
    icon: Wallet,
    isWalletStep: true,
  },
  {
    id: "explore",
    title: "Explore Content",
    description: "Discover creators and trending content in your feed",
    icon: Search,
    action: "Browse Feed",
    actionPath: "/foryou",
  },
  {
    id: "create",
    title: "Create Your First Post",
    description: "Share a post or video to start earning rewards",
    icon: PenLine,
    action: "Create Post",
    actionPath: "/compose",
  },
];

interface OnboardingWizardProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

export function OnboardingWizard({ open, onOpenChange }: OnboardingWizardProps) {
  const { user } = useAuth();
  const { connect, address, isConnecting } = useWallet();
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const { data: onboarding, isLoading } = useQuery<UserOnboarding>({
    queryKey: ["/api/onboarding"],
    enabled: !!user,
  });

  useEffect(() => {
    if (onboarding && !onboarding.isCompleted && !onboarding.skippedAt) {
      setIsOpen(true);
      const stepIndex = STEPS.findIndex(s => s.id === onboarding.currentStep);
      if (stepIndex !== -1) {
        setCurrentStep(stepIndex);
      }
    }
  }, [onboarding]);

  const completeMutation = useMutation({
    mutationFn: async (step: string) => {
      return apiRequest("POST", "/api/onboarding/step", { step });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      if (currentStep < STEPS.length - 1) {
        setCurrentStep(currentStep + 1);
      } else {
        setIsOpen(false);
        toast({ title: "Welcome to Lumina!", description: "You're all set to start exploring" });
      }
    },
  });

  const skipMutation = useMutation({
    mutationFn: async () => {
      return apiRequest("POST", "/api/onboarding/skip");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/onboarding"] });
      setIsOpen(false);
    },
  });

  const handleNext = async () => {
    const step = STEPS[currentStep];
    
    if (step.isWalletStep && !address) {
      try {
        await connect();
      } catch {
        toast({ title: "Wallet connection failed", variant: "destructive" });
        return;
      }
    }
    
    completeMutation.mutate(step.id);
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleSkip = () => {
    skipMutation.mutate();
  };

  const handleAction = () => {
    const step = STEPS[currentStep];
    if (step.actionPath) {
      setIsOpen(false);
      window.location.href = step.actionPath;
    }
  };

  if (isLoading || !onboarding) return null;

  const step = STEPS[currentStep];
  const StepIcon = step.icon;
  const progress = ((currentStep + 1) / STEPS.length) * 100;

  const dialogOpen = open !== undefined ? open : isOpen;
  const handleOpenChange = (value: boolean) => {
    setIsOpen(value);
    onOpenChange?.(value);
  };

  return (
    <Dialog open={dialogOpen} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-md" data-testid="onboarding-wizard">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Sparkles className="h-5 w-5 text-primary" />
            Getting Started
          </DialogTitle>
          <DialogDescription>
            Step {currentStep + 1} of {STEPS.length}
          </DialogDescription>
        </DialogHeader>

        <Progress value={progress} className="h-2" />

        <Card className="border-primary/20">
          <CardContent className="pt-6 text-center space-y-4">
            <div className="mx-auto w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
              <StepIcon className="h-8 w-8 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold" data-testid="step-title">{step.title}</h3>
              <p className="text-sm text-muted-foreground mt-1">{step.description}</p>
            </div>

            {step.isWalletStep && (
              <div className="pt-2">
                {address ? (
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Check className="h-5 w-5" />
                    <span className="font-mono text-sm">
                      {address.slice(0, 6)}...{address.slice(-4)}
                    </span>
                  </div>
                ) : (
                  <Button
                    onClick={connect}
                    disabled={isConnecting}
                    className="w-full"
                    data-testid="connect-wallet-btn"
                  >
                    <Wallet className="h-4 w-4 mr-2" />
                    {isConnecting ? "Connecting..." : "Connect Wallet"}
                  </Button>
                )}
              </div>
            )}

            {step.action && (
              <Button
                variant="outline"
                onClick={handleAction}
                className="w-full"
                data-testid="step-action-btn"
              >
                {step.action}
                <ChevronRight className="h-4 w-4 ml-2" />
              </Button>
            )}
          </CardContent>
        </Card>

        <div className="flex items-center justify-between gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSkip}
            disabled={skipMutation.isPending}
            data-testid="skip-onboarding"
          >
            <X className="h-4 w-4 mr-1" />
            Skip
          </Button>

          <div className="flex gap-2">
            {currentStep > 0 && (
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevious}
                data-testid="previous-step"
              >
                <ChevronLeft className="h-4 w-4 mr-1" />
                Back
              </Button>
            )}
            <Button
              size="sm"
              onClick={handleNext}
              disabled={completeMutation.isPending || (step.isWalletStep && !address && !isConnecting)}
              data-testid="next-step"
            >
              {currentStep === STEPS.length - 1 ? "Finish" : "Continue"}
              <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
