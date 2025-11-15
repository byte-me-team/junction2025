"use client";

import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Button } from "@/components/ui/button";
import CreateMatchModal from "@/components/create-match-modal";
import { Sparkles, Users } from "lucide-react";
import { SidebarInset, SidebarProvider } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/app-sidebar";
import { TopBar } from "@/components/layout/top-bar";

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
        <div className="flex-1 px-4 py-6 sm:px-6 lg:px-8">
          <div className="mx-auto w-full max-w-7xl">
            <main className="px-6 py-10">
              <section className="space-y-8">
                <div className="space-y-4 rounded-3xl border border-primary/20 bg-card/80 p-6 shadow-lg shadow-primary/10">
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <p className="text-sm font-semibold text-primary flex items-center gap-2">
                        <Sparkles className="h-4 w-4" />
                        Care circle
                      </p>
                      <h1 className="text-3xl font-semibold">Loved ones</h1>
                      <p className="text-base text-muted-foreground">
                        Pair Evergreen with relatives, caregivers, or close friends.
                      </p>
                    </div>
                    <Button asChild size="lg" className="gap-2">
                      <Link href="/invite">
                        <Users className="h-4 w-4" />
                        Invite loved ones
                      </Link>
                    </Button>
                  </div>
                </div>

                {isLoadingRelatives && (
                  <p className="text-sm text-muted-foreground">Loading relatives…</p>
                )}
                {error && <p className="text-sm text-destructive">{error}</p>}

                {!isLoadingRelatives && relatives.length === 0 ? (
                  <p className="text-sm text-muted-foreground">
                    You have no relatives added yet.
                  </p>
                ) : (
                  <div className="space-y-4">
                    {relatives.map((relative) => (
                      <article
                        key={relative.id}
                        className="rounded-2xl border border-border bg-card/70 p-5 shadow-sm space-y-4"
                      >
                        <div className="flex flex-wrap items-start justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-semibold">
                              {decodeURIComponent(relative.name)}
                            </h2>
                            <p className="text-sm text-muted-foreground mt-2">
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
                            <p className="text-sm text-muted-foreground mt-2">
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

                          <CreateMatchModal
                            userId={user.id}
                            relativeId={relative.id}
                            relativeName={decodeURIComponent(relative.name)}
                          />
                        </div>
                      </article>
                    ))}
                  </div>
                )}
              </section>
            </main>
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
    
  );
}
