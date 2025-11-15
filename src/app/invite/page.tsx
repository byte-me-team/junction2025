"use client";

import { FormEvent, useState } from "react";
import { useSession } from "next-auth/react";
import { InviteForm } from "@/components/invite-form";

export default function OnboardingBasicPage() {
  const { data: session } = useSession();
  const userId = session?.user?.id; // <-- get ID here

  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

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

    const inviteLink = `${window.location.origin}/relative?name=${encodeURIComponent(
      name
    )}&id=${userId}`;


    if (navigator.share) {
      try {
        await navigator.share({
          title: "Invite Link",
          text: `Invite ${name} to join`,
          url: inviteLink,
        });
        return;
      } catch (err) {
        console.log("Share cancelled or failed:", err);
      }
    }

    await navigator.clipboard.writeText(inviteLink);
    alert("Invite link copied to clipboard!");
  };

  return (
    <main>
      <section className="mx-auto w-full max-w-2xl px-4 py-10 sm:px-6 lg:px-8">
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
          onSubmit={handleSubmit}
          footer={<p className="text-center text-sm text-muted-foreground" />}
        />
      </section>
    </main>
  );
}
