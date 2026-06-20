import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import api from "@/lib/api";

/**
 * Handles /verify-email/:key — the link sent by allauth after registration.
 * POSTs the key to /api/auth/registration/verify-email/ and shows result.
 */
export default function EmailVerifyConfirmPage() {
  const { key } = useParams();
  const [status, setStatus] = useState("verifying"); // "verifying" | "success" | "error"
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    async function verify() {
      try {
        await api.post("/api/auth/registration/verify-email/", { key });
        setStatus("success");
      } catch (err) {
        const data = err?.response?.data || {};
        setErrorMsg(
          data.detail ||
            data.key?.[0] ||
            "This link is invalid or has already been used."
        );
        setStatus("error");
      }
    }
    verify();
  }, [key]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 px-4">
      <Card className="w-full max-w-sm">
        <CardHeader className="text-center">
          {status === "verifying" && (
            <>
              <div className="flex justify-center mb-3">
                <Loader2 className="w-10 h-10 text-primary animate-spin" />
              </div>
              <CardTitle className="text-2xl">Verifying…</CardTitle>
              <CardDescription>Confirming your email address.</CardDescription>
            </>
          )}
          {status === "success" && (
            <>
              <div className="flex justify-center mb-3">
                <CheckCircle className="w-10 h-10 text-emerald-500" />
              </div>
              <CardTitle className="text-2xl">Email confirmed!</CardTitle>
              <CardDescription>
                Your account is now active. Sign in to get started.
              </CardDescription>
            </>
          )}
          {status === "error" && (
            <>
              <div className="flex justify-center mb-3">
                <XCircle className="w-10 h-10 text-destructive" />
              </div>
              <CardTitle className="text-2xl">Verification failed</CardTitle>
              <CardDescription>{errorMsg}</CardDescription>
            </>
          )}
        </CardHeader>

        {status !== "verifying" && (
          <>
            <CardContent />
            <CardFooter className="flex-col gap-3">
              <Link to="/login" className="w-full">
                <Button className="w-full">
                  {status === "success" ? "Sign in" : "Back to sign in"}
                </Button>
              </Link>
              {status === "error" && (
                <Link to="/register" className="w-full">
                  <Button variant="outline" className="w-full">
                    Register again
                  </Button>
                </Link>
              )}
            </CardFooter>
          </>
        )}
      </Card>
    </div>
  );
}
