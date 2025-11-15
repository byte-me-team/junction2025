"use client";

import { useState } from "react";

type MatchResponse = any; // you can tighten this later

export default function TestMatchingPage() {
  const [user1Email, setUser1Email] = useState("user1@example.com");
  const [user2Email, setUser2Email] = useState("user2@example.com");

  const [user1Text, setUser1Text] = useState(
    "I like walking outside, reading books, and checking the news."
  );
  const [user2Text, setUser2Text] = useState(
    "I enjoy gentle exercise, meeting people for coffee, and reading newspapers."
  );

  const [saving1, setSaving1] = useState(false);
  const [saving2, setSaving2] = useState(false);
  const [matching, setMatching] = useState(false);

  const [output, setOutput] = useState<MatchResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function savePreferences(email: string, text: string, which: 1 | 2) {
    try {
      which === 1 ? setSaving1(true) : setSaving2(true);
      setError(null);

      const res = await fetch("/api/preferences", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          rawText: text,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to save preferences");
      }
      console.log("Saved preferences:", json);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      which === 1 ? setSaving1(false) : setSaving2(false);
    }
  }

  async function handleMatch() {
    try {
      setMatching(true);
      setError(null);
      setOutput(null);

      const res = await fetch("/api/matches", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          user1Email,
          user2Email,
        }),
      });

      const json = await res.json();
      if (!res.ok) {
        throw new Error(json.error || "Failed to create match");
      }

      setOutput(json);
    } catch (e: any) {
      setError(e.message || "Unknown error");
    } finally {
      setMatching(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-8 p-8 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold">Test Activity Matching</h1>

      <section className="grid gap-6 md:grid-cols-2">
        <div className="border rounded-md p-4 space-y-3">
          <h2 className="font-semibold">User 1</h2>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full border rounded px-2 py-1 text-sm bg-black/10"
              value={user1Email}
              onChange={(e) => setUser1Email(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Preference text
            <textarea
              className="mt-1 w-full border rounded px-2 py-1 text-sm min-h-[120px] bg-black/10"
              value={user1Text}
              onChange={(e) => setUser1Text(e.target.value)}
            />
          </label>
          <button
            className="mt-2 px-3 py-1 rounded bg-blue-600 text-sm disabled:opacity-60"
            onClick={() => savePreferences(user1Email, user1Text, 1)}
            disabled={saving1}
          >
            {saving1 ? "Saving..." : "Save preferences for User 1"}
          </button>
        </div>

        <div className="border rounded-md p-4 space-y-3">
          <h2 className="font-semibold">User 2</h2>
          <label className="block text-sm">
            Email
            <input
              className="mt-1 w-full border rounded px-2 py-1 text-sm bg-black/10"
              value={user2Email}
              onChange={(e) => setUser2Email(e.target.value)}
            />
          </label>
          <label className="block text-sm">
            Preference text
            <textarea
              className="mt-1 w-full border rounded px-2 py-1 text-sm min-h-[120px] bg-black/10"
              value={user2Text}
              onChange={(e) => setUser2Text(e.target.value)}
            />
          </label>
          <button
            className="mt-2 px-3 py-1 rounded bg-blue-600 text-sm disabled:opacity-60"
            onClick={() => savePreferences(user2Email, user2Text, 2)}
            disabled={saving2}
          >
            {saving2 ? "Saving..." : "Save preferences for User 2"}
          </button>
        </div>
      </section>

      <section className="space-y-3">
        <button
          className="px-4 py-2 rounded bg-green-600 text-sm disabled:opacity-60"
          onClick={handleMatch}
          disabled={matching}
        >
          {matching ? "Requesting suggestions..." : "Suggest joint activities"}
        </button>

        {error && (
          <p className="text-sm text-red-400">
            Error: {error}
          </p>
        )}

        {output && (
          <div className="border rounded-md p-4 text-sm whitespace-pre-wrap break-words bg-black/10">
            <h2 className="font-semibold mb-2">Match result</h2>
            <pre>{JSON.stringify(output, null, 2)}</pre>
          </div>
        )}
      </section>
    </main>
  );
}

