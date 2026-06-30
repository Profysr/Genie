import { useNavigate } from "react-router-dom";
import { FileQuestion } from "lucide-react";

export default function NotFoundPage() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm px-4">
        <div className="flex justify-center">
          <div className="p-5 rounded-full bg-muted">
            <FileQuestion className="w-9 h-9 text-muted-foreground" />
          </div>
        </div>
        <h1 className="text-2xl font-bold tracking-tight">404</h1>
        <p className="text-base font-medium">Page not found</p>
        <p className="text-sm text-muted-foreground">
          This page doesn&apos;t exist or you don&apos;t have permission to view it.
        </p>
        <button
          onClick={() => navigate(-1)}
          className="text-sm text-primary hover:underline"
        >
          Go back
        </button>
      </div>
    </div>
  );
}
