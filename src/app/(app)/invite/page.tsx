"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { InviteForm } from "@/components/invite-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Sparkles, CornerUpLeft } from "lucide-react";

export default function InviteRelativePage() {
  const { data: session } = useSession();
  const userId = session?.user?.id;
  const router = useRouter();

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [inviteLink, setInviteLink] = useState("");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!userId) {
      setError("No logged in user found.");
      return;
    }

    if (!name.trim()) {
      setError("Please enter a name.");
      return;
    }

    setError(null);

    const link = `${window.location.origin}/relatives/${userId}/${encodeURIComponent(
      name
    )}`;
    setInviteLink(link);

    if (navigator.share) {
      try {
        await navigator.share({
          title: "Evergreen Invite",
          text: `Join me on Evergreen, ${name}!`,
          url: link,
        });
        return;
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    }

    await navigator.clipboard.writeText(link);
    alert("Invite link copied to clipboard!");
  };

  return (
    <main className="px-6 py-10">
      <section className="mx-auto flex w-full max-w-3xl flex-col gap-6">
        <div className="rounded-3xl border border-border/50 bg-card/85 p-6 shadow-sm">
          <div className="flex items-center gap-2 text-primary">
            <Sparkles className="h-4 w-4" />
            <p className="text-xs font-semibold uppercase tracking-[0.4em]">
              Invite loved ones
            </p>
          </div>
          <h1 className="mt-3 text-3xl font-semibold">
            Send a gentle Evergreen invitation
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Just add their name—we&apos;ll handle the onboarding link and copy it
            to your clipboard.
          </p>
        </div>

        <div className="rounded-3xl border border-border/60 bg-card/90 p-6 shadow-sm">
          <InviteForm
            name={name}
            error={error}
            onNameChange={(value) => {
              if (error) setError(null);
              setName(value);
            }}
            buttonLabel="Create invite"
            onSubmit={handleSubmit}
            footer={
              <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                {inviteLink && (
                  <div className="rounded-2xl border border-border/40 bg-background/70 p-4 text-left">
                    <p className="text-xs uppercase tracking-[0.3em] text-primary">
                      Invite ready
                    </p>
                    <p className="mt-2 truncate font-semibold text-foreground">
                      {inviteLink}
                    </p>
                    <p className="mt-1">
                      Link copied. Paste it in your family chat or email.
                    </p>
                  </div>
                )}
                <Button
                  type="button"
                  variant="outline"
                  className="gap-2"
                  onClick={() => router.push("/relatives")}
                >
                  <CornerUpLeft className="h-4 w-4" />
                  Back to relatives
                </Button>
              </div>
            }
          />
        </div>
      </section>
    </main>
  );
}
