import { useLocation } from "wouter";
import { MainLayout } from "@/components/layout/MainLayout";
import { PostComposer } from "@/components/post/PostComposer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/lib/authContext";
import { Redirect } from "wouter";

export default function Compose() {
  const { user, isLoading } = useAuth();
  const [, navigate] = useLocation();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-8 h-8 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!user) {
    return <Redirect to="/login" />;
  }

  const handleSuccess = () => {
    navigate("/feed");
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto px-4 py-6">
        <Card>
          <CardHeader>
            <CardTitle data-testid="text-compose-title">Create Post</CardTitle>
          </CardHeader>
          <CardContent>
            <PostComposer onSuccess={handleSuccess} />
          </CardContent>
        </Card>
      </div>
    </MainLayout>
  );
}
