"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { InviteForm } from "@/components/invite-form";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export default function OnboardingBasicPage() {
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

    const link = `${window.location.origin}/relative/${userId}/${name}`;
    setInviteLink(link);

    // Try native share first
    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invite Link",
          text: `Invite ${name} to join`,
          url: link,
        });
        return;
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    }

    // Fallback: copy to clipboard
    await navigator.clipboard.writeText(link);
    alert("Invite link copied to clipboard!");
  };

  return (
    <main>
      <section className="mx-auto  w-full max-w-4xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.3em] text-primary">
            Invite Loved Ones
          </p>
          <h1 className="text-3xl font-semibold">Tell us the basics</h1>
        </div>

        <InviteForm
          name={name}
          error={error}
          onNameChange={(value) => {
            if (error) setError(null);
            setName(value);
          }}
          buttonLabel="Share"
          onSubmit={handleSubmit}
          footer={
            <div className="flex flex-col gap-3 mt-4">
              <Button type="button" variant="ghost" onClick={() => router.push("/dashboard")}>
                Back to Dashboard
              </Button>
            </div>
          }
        />
      </section>
    </main>
  );
}
