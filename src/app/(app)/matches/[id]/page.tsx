"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useRequireAuth } from "@/lib/use-require-auth";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ScheduleActivityDialog } from "@/components/schedule-activity-dialog";

type Activity = {
  title: string;
  description: string;
  location: string;
  possible_date: string;
};

type MatchData = {
  id: string;
  userId: string;
  relativeId: string;
  suggestionsJson: {
    activities: Activity[];
  };
  createdAt: string;
};

export default function MatchSuggestionsPage() {
  const { matchId } = useParams();
  const { user, isLoading } = useRequireAuth();
  const [match, setMatch] = useState<MatchData | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);
  const [statusNotice, setStatusNotice] = useState("");

  useEffect(() => {
    if (!matchId) return;

    const fetchMatch = async () => {
      try {
        const res = await fetch(`/api/matches/${matchId}`);
        if (!res.ok) throw new Error("Failed to load match");

        const data: MatchData = await res.json();
        setMatch(data);
      } catch (err) {
        console.error(err);
      }
    };

    fetchMatch();
  }, [matchId]);

  if (isLoading) {
    return <p className="text-sm text-muted-foreground p-6">Loading...</p>;
  }

  if (!match) {
    return <p className="text-sm text-destructive p-6">Match not found.</p>;
  }

  return (
    <main>
      <h1 className="text-3xl font-semibold mb-6">Your Suggested Activities</h1>
      <div className="grid gap-6 md:grid-cols-3">
        {match.suggestionsJson.activities.map((activity, idx) => (
          <Card
            key={idx}
            className={`flex h-full flex-col bg-muted/30 border border-border/70`}
          >
            <CardHeader>
              <CardTitle className="text-lg">{activity.title}</CardTitle>
              <CardDescription>{activity.description}</CardDescription>
            </CardHeader>

            <CardContent>
              <p className="text-sm font-medium text-foreground">
                Location:{" "}
                <span className="font-normal text-muted-foreground">
                  {activity.location}
                </span>
              </p>
              <p className="text-sm font-medium text-foreground mt-2">
                Suggested Date:{" "}
                <span className="font-normal text-muted-foreground">
                  {new Date(activity.possible_date).toLocaleDateString()}
                </span>
              </p>
            </CardContent>

            <CardFooter className="mt-auto flex flex-col gap-2">
              <Button
                className="w-full"
                onClick={() =>
                  setStatusNotice(`Started activity: "${activity.title}"!`)
                }
                disabled={isUpdating}
              >
                Let's go!
              </Button>
              <ScheduleActivityDialog
                triggerLabel="Schedule"
                defaultTitle={activity.title}
                defaultDescription={activity.description}
                source="relative"
                sourceId={activity.title}
                relatives={[]}
                triggerVariant="outline"
                triggerSize="default"
                triggerClassName="w-full"
                onScheduled={() =>
                  setStatusNotice(`Scheduled "${activity.title}" in your calendar.`)
                }
              />
            </CardFooter>
          </Card>
        ))}
      </div>

      {statusNotice && (
        <p className="mt-4 text-sm text-primary">{statusNotice}</p>
      )}
    </main>
  );
}
