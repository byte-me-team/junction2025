"use client";

import { Badge } from "@/components/ui/badge";
import { SidebarInset } from "@/components/ui/sidebar";
import { TopBar } from "@/components/layout/top-bar";
import { AppSidebar } from "@/components/app-sidebar";
import { SidebarProvider } from "@/components/ui/sidebar";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Button } from "@/components/ui/button";
import CreateMatchModal from "@/components/create-match-modal";

type Relative = {
  id: string;
  name: string;
  preferences: string[];
  dislikes: string[];
};

export default function RelativesPage() {
  const { user, isLoading } = useRequireAuth();
  const [relatives, setRelatives] = useState<Relative[]>([]);
  const [isLoadingRelatives, setIsLoadingRelatives] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user?.id) return;

    const fetchRelatives = async () => {
      setIsLoadingRelatives(true);
      setError(null);
      try {
        const res = await fetch(`/api/relative?userId=${user.id}`);
        if (!res.ok) {
          const payload = await res.json().catch(() => null);
          throw new Error(payload?.error ?? "Failed to load relatives");
        }
        const data = await res.json();
        setRelatives(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error");
      } finally {
        setIsLoadingRelatives(false);
      }
    };

    fetchRelatives();
  }, [user?.id]);

  if (isLoading) {
    return (
      <main className="px-6 py-10">
        <p className="text-sm text-muted-foreground">Loading your relatives…</p>
      </main>
    );
  }

  if (!user) return null;

  return (
    <SidebarProvider>
      <AppSidebar />
      <SidebarInset className="flex min-h-screen flex-1 flex-col bg-background">
        <TopBar />

        <main className="bg-background">
          <section className="mx-auto w-full max-w-5xl px-6 py-10">
            <div className="mb-8 space-y-1">
              <p className="text-sm font-semibold text-primary">
                Hello, {user.name || user.email}
              </p>
              <h1 className="text-3xl font-semibold">Your relatives</h1>
              <p className="text-base text-muted-foreground">
                Add or view relatives and their preferences.
              </p>
            </div>

            {isLoadingRelatives && (
              <p className="text-sm text-muted-foreground">Loading relatives…</p>
            )}

            {error && (
              <p className="text-sm text-destructive mb-4">{error}</p>
            )}

            {!isLoadingRelatives && relatives.length === 0 && (
              <p className="text-sm text-muted-foreground mb-4">
                You have no relatives added yet.
              </p>
            )}

            <div className="grid gap-4">
              {relatives.map((relative) => (
                <article
                  key={relative.id}
                  className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm"
                >
                  <div className="flex justify-between items-center">
                    <div>
                      <h2 className="text-xl font-semibold">
                        {decodeURIComponent(relative.name)}
                      </h2>

                      <p className="text-sm text-muted-foreground mt-2 mb-2">
                        Preferences:{" "}
                        {relative.preferences?.length ? (
                          relative.preferences.map((x) => (
                            <Badge key={x} className="mx-1">
                              {x}
                            </Badge>
                          ))
                        ) : (
                          "None"
                        )}
                      </p>

                      <p className="text-sm text-muted-foreground mt-2 mb-2">
                        Dislikes:{" "}
                        {relative.dislikes?.length ? (
                          relative.dislikes.map((x) => (
                            <Badge key={x} className="mx-1" variant="destructive">
                              {x}
                            </Badge>
                          ))
                        ) : (
                          "None"
                        )}
                      </p>
                    </div>

                    {/* 🌟 Modal appears on click */}
                    <CreateMatchModal
                      userId={user.id}
                      relativeId={relative.id}
                    />
                  </div>
                </article>
              ))}
            </div>

            <div className="mt-10">
              <Button asChild variant="secondary">
                <Link href="/dashboard">Back to Dashboard</Link>
              </Button>
            </div>
          </section>
        </main>
      </SidebarInset>
    </SidebarProvider>
  );
}
