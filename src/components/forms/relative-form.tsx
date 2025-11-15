"use client";

import { FormEvent, useState, ReactNode } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field";
import { Input } from "@/components/ui/input";

type RelativesFormProps = {
  className?: string;
  userId: string;
  name: string;
  buttonLabel?: string;
  footer?: ReactNode;
};

export function RelativesForm({
  className,
  userId,
  name,
  buttonLabel = "Save Preferences",
  footer,
}: RelativesFormProps) {
  const [rawText, setRawText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!rawText.trim()) {
      setError("Please enter your preferences.");
      return;
    }

    setError(null);

    try {
      const res = await fetch("/api/relative", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId, name, rawText }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Something went wrong");
        return;
      }

      setSuccess(true); // ✅ mark as successful
      setRawText("");   // optional: clear input
    } catch (err) {
      console.error(err);
      setError("Failed to save preferences");
    }
  };

  return (
    <Card className={cn("max-w-lg mx-auto", className)}>
      <CardHeader>
        <CardTitle>Enter Relative Preferences</CardTitle>
        <CardDescription>
          Add the preferences for this relative.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success ? (
          <p className="text-green-600 font-medium text-center">
            Thank you for submitting your preferences!
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="relative-preferences">Preferences</FieldLabel>
                <Input
                  id="relative-preferences"
                  type="text"
                  placeholder="Likes pizza, hiking, reading"
                  value={rawText}
                  onChange={(e) => setRawText(e.target.value)}
                />
                {error && (
                  <FieldDescription className="text-red-500">{error}</FieldDescription>
                )}
              </Field>
              <Field>
                <Button type="submit" className="w-full">
                  {buttonLabel}
                </Button>
                {footer}
              </Field>
            </FieldGroup>
          </form>
        )}
      </CardContent>
    </Card>
  );
}

