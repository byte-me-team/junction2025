"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

export default function CreateMatchModal({
  userId,
  relativeId,
}: {
  userId: string;
  relativeId: string;
}) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [errorMessage, setErrorMessage] = useState("");

  async function handleCreateMatch() {
    setStatus("loading");
    setErrorMessage("");

    try {
      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, relativeId }),
      });

      const data = await res.json();

      if (!res.ok) {
        setStatus("error");
        setErrorMessage(data.error || "Something went wrong");
        return;
      }

      setStatus("success");
    } catch (err) {
      console.error(err);
      setStatus("error");
      setErrorMessage("Something went wrong");
    }
  }

  return (
    <>
      <Button
        size="sm"
        variant="outline"
        onClick={() => {
          setStatus("idle");
          setOpen(true);
        }}
      >
        Hang out!
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-sm rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-xl font-semibold">
              Creating Match
            </DialogTitle>
          </DialogHeader>

          {/* Loading */}
          {status === "loading" && (
            <div className="flex flex-col items-center text-center py-6">
              <Loader2 className="h-10 w-10 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">
                Finding shared interests and generating AI suggestions…
              </p>
            </div>
          )}

          {/* Success */}
          {status === "success" && (
            <div className="flex flex-col items-center text-center py-6">
              <CheckCircle2 className="h-10 w-10 text-green-600 mb-3" />
              <p className="text-base font-medium mb-2">Match created!</p>
              <p className="text-sm text-muted-foreground mb-5">
                AI has generated shared activities for you.
              </p>

              <Button
                className="w-full"
                onClick={() => {
                  setOpen(false);
                  window.location.href = `/matches`;
                }}
              >
                View Suggestions
              </Button>
            </div>
          )}

          {/* Error */}
          {status === "error" && (
            <div className="flex flex-col items-center text-center py-6">
              <XCircle className="h-10 w-10 text-red-600 mb-3" />
              <p className="text-base font-medium mb-2">Something went wrong</p>
              <p className="text-sm text-muted-foreground mb-5">{errorMessage}</p>

              <Button variant="outline" onClick={handleCreateMatch} className="w-full">
                Try Again
              </Button>
            </div>
          )}

          {/* Idle */}
          {status === "idle" && (
            <div className="flex flex-col items-center text-center py-6">
              <p className="text-sm text-muted-foreground mb-5">
                Generate an AI match between you and this relative.
              </p>

              <Button onClick={handleCreateMatch} className="w-full">
                Start
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
