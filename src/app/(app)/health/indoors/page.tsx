"use client";

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

type Pose = {
  id: number;
  english_name: string;
  sanskrit_name_adapted?: string;
  difficulty_level: string;
  url_png: string;
  pose_benefits?: string;
};

type YogaSuggestion = {
  title: string;
  difficulty: string;
  poses: Pose[];
};

const commonSymptoms = [
  "Neck tension",
  "Lower back pain",
  "Stiff shoulders",
  "Tired legs",
  "Headache",
];

const goals = ["Calming down", "Improve mobility", "Decrease pain", "Boost energy", "Increase flexibility"];

export default function YogaRoutinesPage() {
  const [manualModalOpen, setManualModalOpen] = useState(false);
  const [allPoses, setAllPoses] = useState<Pose[]>([]);
  const [poseSearch, setPoseSearch] = useState("");

  const [preferences, setPreferences] = useState("");
  const [mood, setMood] = useState(3);
  const [symptoms, setSymptoms] = useState<string[]>([]);
  const [customSymptom, setCustomSymptom] = useState("");
  const [goal, setGoal] = useState(goals[0]);

  const [suggestion, setSuggestion] = useState<YogaSuggestion | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openManualPoseModal = async () => {
    setManualModalOpen(true);

    if (allPoses.length === 0) {
      const res = await fetch("/api/poses");
      const data = await res.json();
      setAllPoses(data.poses ?? data); 
    }
  };

  const addPoseToSuggestion = (pose: Pose) => {
    if (!suggestion) return;

    if (suggestion.poses.some((p) => p.id === pose.id)) return;

    setSuggestion({
      ...suggestion,
      poses: [...suggestion.poses, pose],
    });

    setManualModalOpen(false);
  };

  const handleGenerate = async () => {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch("/api/yoga-suggestions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          preferences: { interests: [{ name: preferences }] },
          mood,
          symptoms,
          goal,
        }),
      });

      const data = await res.json();

      if (res.ok) setSuggestion(data.suggestions.sessions[0]);
      else setError(data.error ?? "Unknown error");
    } catch (err) {
      setError((err as Error).message);
      setManualModalOpen(true);

      if (allPoses.length === 0) {
        const r = await fetch("/api/poses");
        const d = await r.json();
        setAllPoses(d.poses ?? d);
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleSymptom = (symptom: string) => {
    setSymptoms((prev) =>
      prev.includes(symptom) ? prev.filter((s) => s !== symptom) : [...prev, symptom]
    );
  };

  const filtered = allPoses.filter((p) =>
    p.english_name.toLowerCase().includes(poseSearch.toLowerCase())
  );

  const alreadyInSession = (pose: Pose) =>
    suggestion ? suggestion.poses.some((p) => p.id === pose.id) : false;

  return (
    <main className="p-6 max-w-4xl mx-auto space-y-6">
      <h1 className="text-3xl font-semibold">AI-Assisted Yoga Flow</h1>

      {!suggestion ? (
        <>
          {/* Mood */}
          <Card>
            <CardHeader>
              <CardTitle>Your current mood</CardTitle>
            </CardHeader>
            <CardContent className="flex gap-2 justify-between">
              {[1, 2, 3, 4, 5].map((level) => {
                const emoji = ["😞", "😐", "😌", "🙂", "😄"][level - 1];
                return (
                  <button
                    key={level}
                    className={`text-2xl ${mood === level ? "scale-125" : ""}`}
                    onClick={() => setMood(level)}
                  >
                    {emoji}
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Symptoms */}
          <Card>
            <CardHeader>
              <CardTitle>Symptoms</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap gap-2">
                {commonSymptoms.map((s) => (
                  <button
                    key={s}
                    className={`px-2 py-1 border rounded ${
                      symptoms.includes(s) ? "bg-primary text-white" : "bg-card"
                    }`}
                    onClick={() => toggleSymptom(s)}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex gap-2 mt-2">
                <input
                  type="text"
                  placeholder="Add custom symptom"
                  value={customSymptom}
                  onChange={(e) => setCustomSymptom(e.target.value)}
                  className="border rounded p-1 flex-1"
                />
                <Button
                  size="sm"
                  onClick={() => {
                    if (customSymptom.trim()) {
                      toggleSymptom(customSymptom.trim());
                      setCustomSymptom("");
                    }
                  }}
                >
                  Add
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Goal */}
          <Card>
            <CardHeader>
              <CardTitle>Goal</CardTitle>
            </CardHeader>
            <CardContent>
              <select
                className="border rounded p-1 w-full"
                value={goal}
                onChange={(e) => setGoal(e.target.value)}
              >
                {goals.map((g) => (
                  <option key={g} value={g}>
                    {g}
                  </option>
                ))}
              </select>
            </CardContent>
          </Card>

          {/* Preferences */}
          <Card>
            <CardHeader>
              <CardTitle>Preferences / Focus</CardTitle>
            </CardHeader>
            <CardContent>
              <textarea
                value={preferences}
                onChange={(e) => setPreferences(e.target.value)}
                placeholder="Describe what you like, your mood, or what you want from the session..."
                className="w-full border rounded-md p-2"
                rows={3}
              />
              <Button onClick={handleGenerate} disabled={loading} className="mt-2">
                {loading ? "Generating..." : "Generate Custom Yoga Session"}
              </Button>
            </CardContent>
          </Card>
        </>
      ) : (
        <>
          {/* Suggestion */}
          <Card>
            <CardHeader>
              <CardTitle>{suggestion.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                Difficulty: {suggestion.difficulty}
              </p>
            </CardHeader>
            <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {suggestion.poses.map((pose) => (
                <div
                  key={pose.id}
                  className="border rounded-lg p-3 flex flex-col items-center"
                >
                  <img
                    src={pose.url_png}
                    alt={pose.english_name}
                    width={128}
                    height={128}
                    className="mb-2"
                  />
                  <p className="font-semibold">{pose.english_name}</p>
                  {pose.sanskrit_name_adapted && (
                    <p className="text-xs text-muted-foreground">
                      {pose.sanskrit_name_adapted}
                    </p>
                  )}
                  {pose.pose_benefits && (
                    <p className="text-xs mt-1">{pose.pose_benefits}</p>
                  )}
                </div>
              ))}
            </CardContent>
          </Card>

          <Button
            className="w-full"
            variant="outline"
            onClick={openManualPoseModal}
          >
            ➕ Add Pose Manually
          </Button>

          {/* Generate Again */}
          <Button
            onClick={() => {
              setSuggestion(null);
              setPreferences("");
              setSymptoms([]);
              setCustomSymptom("");
              setGoal(goals[0]);
              setMood(3);
            }}
          >
            Generate Again
          </Button>
        </>
      )}
      <Dialog open={manualModalOpen} onOpenChange={setManualModalOpen}>
          <DialogContent className="
            sm:max-w-2xl 
            bg-background 
            text-foreground 
            border 
            shadow-xl 
            rounded-xl
          ">
            <DialogHeader>
              <DialogTitle className="text-2xl font-bold">
                Add a Yoga Pose
              </DialogTitle>
              <DialogDescription>
                Browse and add poses to your session. You can search by pose name.
              </DialogDescription>
            </DialogHeader>

            <div className="mt-4">
              <Input
                placeholder="Search poses..."
                value={poseSearch}
                onChange={(e) => setPoseSearch(e.target.value)}
                className="w-full"
              />
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mt-6">
              {filtered.map((pose) => {
                const disabled = alreadyInSession(pose);

                return (
                  <button
                    key={pose.id}
                    onClick={() => !disabled && addPoseToSuggestion(pose)}
                    disabled={disabled}
                    className={`relative rounded-xl border flex flex-col p-4 items-center shadow-sm
                      transition hover:shadow-md hover:bg-gray-50
                      ${disabled ? "opacity-50 cursor-not-allowed" : ""}
                    `}
                  >
                    <img
                      src={pose.url_png}
                      alt={pose.english_name}
                      className="w-28 h-28 object-contain"
                    />

                    <p className="mt-2 font-semibold text-sm text-gray-900">
                      {pose.english_name}
                    </p>

                    {disabled && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center text-sm font-semibold rounded-xl">
                        Added
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <Button className="mt-6 w-full" variant="secondary">
              Close
            </Button>
          </DialogContent>
        </Dialog>
    </main>
  );
}
