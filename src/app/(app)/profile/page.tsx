"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { TagInput, TagInputHandle } from "@/components/forms/tag-input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Field, FieldLabel } from "@/components/ui/field";
import { useRequireAuth } from "@/lib/use-require-auth";

export default function ProfilePreferencesPage() {
    const { user, isLoading } = useRequireAuth();
    const router = useRouter();
    const { data: session } = useSession();

    const enjoyInputRef = useRef<TagInputHandle>(null);
    const dislikeInputRef = useRef<TagInputHandle>(null);

    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [city, setCity] = useState("");

    const [enjoyList, setEnjoyList] = useState<string[]>([]);
    const [dislikeList, setDislikeList] = useState<string[]>([]);
    const [travelDistanceKm, setTravelDistanceKm] = useState(10);
    const [preferredTime, setPreferredTime] = useState<"any"|"morning"|"afternoon"|"evening">("any");
    const [socialPreference, setSocialPreference] = useState<"any"|"alone"|"small_group"|"family">("any");
    const [adventurous, setAdventurous] = useState<"yes"|"sometimes"|"no">("sometimes");

    const [statusLeft, setStatusLeft] = useState("");
    const [statusRight, setStatusRight] = useState("");

    useEffect(() => {
        if (!user) {
        router.replace("/auth/sign-in");
        return;
        }

        async function loadProfile() {
        try {
            setName(user.name || "");
            setEmail(user.email || "");
            setCity(user.city || "");

            // Prefill preferences
            if (user.preferences) {
                setEnjoyList(user.preferences.enjoyList || []);
                setDislikeList(user.preferences.dislikeList || []);
                setTravelDistanceKm(user.preferences.travelDistanceKm || 10);
                setPreferredTime(user.preferences.preferredTime || "any");
                setSocialPreference(user.preferences.socialPreference || "any");
                setAdventurous(user.preferences.adventurous || "sometimes");
            }} catch (err) {
                console.error(err);
            }
        }   

        loadProfile();
    }, [session, router]);

    const handleLeftSave = async () => {
        enjoyInputRef.current?.commitPending();
        dislikeInputRef.current?.commitPending();

        try {
        const res = await fetch("/api/profile/preferences", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
            enjoyList,
            dislikeList,
            travelDistanceKm,
            preferredTime,
            socialPreference,
            adventurous,
            }),
        });
        const data = await res.json();
        if (!res.ok) {
            setStatusLeft(data.error || "Failed to update preferences.");
            return;
        }
        setStatusLeft("Preferences saved successfully!");
        } catch (err) {
        console.error(err);
        setStatusLeft("Unexpected error.");
        }
    };

    const handleRightSave = async () => {
        try {
        const res = await fetch("/api/profile/account", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, email, city }),
        });
        const data = await res.json();
        if (!res.ok) {
            setStatusRight(data.error || "Failed to update account info.");
            return;
        }
        setStatusRight("Account info saved!");
        } catch (err) {
        console.error(err);
        setStatusRight("Unexpected error.");
        }
    };

    return (
        <main>
          <section>
            <h1 className="text-3xl font-semibold mb-6">Edit Your Profile</h1>

            <div className="grid md:grid-cols-2 gap-6">
            {/* Left column: preferences */}
            <Card>
                <CardHeader>
                <CardTitle>Preferences & Interests</CardTitle>
                <CardDescription>
                    Edit your activity preferences and interests. Existing items are shown as bubbles.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <TagInput
                    ref={enjoyInputRef}
                    label="Things you enjoy doing"
                    description="Hit Enter after each idea."
                    placeholder="Gardening · Strolls · Reading"
                    items={enjoyList}
                    onChange={setEnjoyList}
                />

                <TagInput
                    ref={dislikeInputRef}
                    label="Things you dislike"
                    description="Hit Enter after each idea."
                    placeholder="Crowded malls · Loud music"
                    items={dislikeList}
                    onChange={setDislikeList}
                />

                <Field>
                    <FieldLabel>Travel distance (km)</FieldLabel>
                    <div className="flex items-center gap-3">
                    <input
                        type="range"
                        min={1}
                        max={40}
                        value={travelDistanceKm}
                        onChange={(e) => setTravelDistanceKm(Number(e.target.value))}
                        className="w-full"
                    />
                    <span className="font-semibold">{travelDistanceKm} km</span>
                    </div>
                </Field>

                <Field>
                    <FieldLabel>Preferred time of day</FieldLabel>
                    <select
                    className="w-full rounded-xl border border-border bg-card p-3 text-base"
                    value={preferredTime}
                    onChange={(e) => setPreferredTime(e.target.value as any)}
                    >
                    <option value="any">No preference</option>
                    <option value="morning">Morning</option>
                    <option value="afternoon">Afternoon</option>
                    <option value="evening">Evening</option>
                    </select>
                </Field>

                <Field>
                    <FieldLabel>Social preference</FieldLabel>
                    <select
                    className="w-full rounded-xl border border-border bg-card p-3 text-base"
                    value={socialPreference}
                    onChange={(e) => setSocialPreference(e.target.value as any)}
                    >
                    <option value="any">Flexible</option>
                    <option value="alone">Alone</option>
                    <option value="small_group">Small group</option>
                    <option value="family">With family</option>
                    </select>
                </Field>

                <Field>
                    <FieldLabel>Adventurousness</FieldLabel>
                    <select
                    className="w-full rounded-xl border border-border bg-card p-3 text-base"
                    value={adventurous}
                    onChange={(e) => setAdventurous(e.target.value as any)}
                    >
                    <option value="yes">Yes, bring it on</option>
                    <option value="sometimes">Sometimes</option>
                    <option value="no">Prefer familiar</option>
                    </select>
                </Field>

                <Button onClick={handleLeftSave} className="w-full mt-2">Save Preferences</Button>
                {statusLeft && <p className="text-sm mt-2 text-green-600">{statusLeft}</p>}
                </CardContent>
            </Card>

            {/* Right column: basic info */}
            <Card>
                <CardHeader>
                <CardTitle>Account Info</CardTitle>
                <CardDescription>
                    Edit your basic account info.
                </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                <Field>
                    <FieldLabel>Name</FieldLabel>
                    <Input value={name} onChange={(e) => setName(e.target.value)} />
                </Field>

                <Field>
                    <FieldLabel>Email</FieldLabel>
                    <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
                </Field>

                <Field>
                    <FieldLabel>City</FieldLabel>
                    <Input value={city} onChange={(e) => setCity(e.target.value)} />
                </Field>

                <Button onClick={handleRightSave} className="w-full">Save Account Info</Button>
                {statusRight && <p className="text-sm mt-2 text-green-600">{statusRight}</p>}
                </CardContent>
            </Card>
            </div>
      </section>
    </main>
  );
}
