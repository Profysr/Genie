import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useCreateWorkspace } from "@/shared/hooks/useWorkspace";
import { Button } from "@/shared/components/ui/button";
import { Input } from "@/shared/components/ui/input";
import { Label } from "@/shared/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/shared/components/ui/card";
import ImageUpload from "@/shared/components/ui/ImageUpload";

export default function OnboardingPage() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null);

  const { mutate, isPending } = useCreateWorkspace({
    onSuccess: (workspace) => navigate(`/w/${workspace.id}/setup`),
    onError: (err) =>
      setError(err.response?.data?.name?.[0] || "Something went wrong."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    const fd = new FormData();
    fd.append("name", name);
    if (logoFile) fd.append("logo", logoFile);
    mutate(fd);
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-lg">
        <CardHeader>
          <CardTitle className="text-2xl">Create your workspace</CardTitle>
          <CardDescription>
            This is where your team will collaborate. You can change this later.
          </CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="space-y-5">
            {error && <p className="text-sm text-destructive">{error}</p>}

            {/* Logo upload */}
            <div className="flex justify-center">
              <ImageUpload
                onChange={(file) => {
                  setLogoFile(file);
                  setError("");
                }}
                onError={setError}
                aspectRatio="1/1"
                displayWidth={80}
                shape="rounded"
                uploadLabel="Upload logo"
                hint="Optional · JPEG, PNG, GIF or WebP · max 2 MB"
                accept="image/jpeg,image/png,image/gif,image/webp"
                allowedTypes={[
                  "image/jpeg",
                  "image/png",
                  "image/gif",
                  "image/webp",
                ]}
                maxSizeMB={2}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="name">Workspace name</Label>
              <Input
                id="name"
                placeholder="Acme Inc."
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          </CardContent>
          <CardFooter>
            <Button
              type="submit"
              className="w-full"
              disabled={isPending || !name.trim()}
            >
              {isPending ? "Creating…" : "Create workspace →"}
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}
