"use client"

import type { FormEvent, ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"

type SignupFormProps = {
  className?: string
  name: string
  email: string
  error?: string | null
  buttonLabel?: string
  supportingText?: string
  helperText?: string
  footer?: ReactNode
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function SignupForm({
  className,
  name,
  email,
  error,
  buttonLabel = "Continue",
  supportingText = "We keep your answers in localStorage until the backend is ready.",
  helperText = "Use whatever name seniors and relatives will recognize.",
  footer,
  onNameChange,
  onEmailChange,
  onSubmit,
}: SignupFormProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Start your Aging with AI plan</CardTitle>
        <CardDescription>
          Tell us who we&apos;re planning for and how to reach them.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="onboarding-name">Name (optional)</FieldLabel>
              <Input
                id="onboarding-name"
                type="text"
                placeholder="Grandma Liisa"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
              />
              <FieldDescription className="text-muted-foreground">
                {helperText}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="onboarding-email">Email *</FieldLabel>
              <Input
                id="onboarding-email"
                type="email"
                placeholder="you@example.com"
                value={email}
                onChange={(event) => onEmailChange(event.target.value)}
                required
              />
              <FieldDescription
                className={cn(
                  "text-muted-foreground",
                  error && "text-destructive"
                )}
              >
                {error ?? supportingText}
              </FieldDescription>
            </Field>
            <Field>
              <Button type="submit" className="w-full">
                {buttonLabel}
              </Button>
              {footer}
            </Field>
          </FieldGroup>
        </form>
      </CardContent>
    </Card>
  )
}
