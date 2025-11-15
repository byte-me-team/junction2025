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
  city: string
  password: string
  confirmPassword: string
  emailError?: string | null
  cityError?: string | null
  passwordError?: string | null
  confirmPasswordError?: string | null
  formError?: string | null
  buttonLabel?: string
  supportingText?: string
  helperText?: string
  footer?: ReactNode
  onNameChange: (value: string) => void
  onEmailChange: (value: string) => void
  onCityChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onConfirmPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function SignupForm({
  className,
  name,
  email,
  city,
  password,
  confirmPassword,
  emailError,
  cityError,
  passwordError,
  confirmPasswordError,
  formError,
  buttonLabel = "Continue",
  supportingText = "We'll store your answers securely when onboarding completes.",
  helperText = "Use whatever name seniors and relatives will recognize.",
  footer,
  onNameChange,
  onEmailChange,
  onCityChange,
  onPasswordChange,
  onConfirmPasswordChange,
  onSubmit,
}: SignupFormProps) {
  const cityOptions = [
    "Helsinki",
    "Espoo",
    "Vantaa",
    "Tampere",
    "Turku",
    "Oulu",
    "Jyväskylä",
    "Kuopio",
    "Lahti",
  ];

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
                placeholder="John Doe"
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
                  emailError && "text-destructive"
                )}
              >
                {emailError ?? supportingText}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="onboarding-city">City *</FieldLabel>
              <select
                id="onboarding-city"
                className="w-full rounded-xl border border-border bg-card p-3 text-base"
                value={city}
                onChange={(event) => onCityChange(event.target.value)}
                required
              >
                <option value="">Select a city</option>
                {cityOptions.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
              <FieldDescription
                className={cn(
                  "text-muted-foreground",
                  cityError && "text-destructive"
                )}
              >
                {cityError ?? "We'll use this to personalize nearby activities."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="onboarding-password">Password *</FieldLabel>
              <Input
                id="onboarding-password"
                type="password"
                placeholder="Create a password"
                value={password}
                onChange={(event) => onPasswordChange(event.target.value)}
                required
              />
              <FieldDescription
                className={cn(
                  "text-muted-foreground",
                  passwordError && "text-destructive"
                )}
              >
                {passwordError ?? "Minimum 8 characters."}
              </FieldDescription>
            </Field>
            <Field>
              <FieldLabel htmlFor="onboarding-confirm-password">
                Confirm password
              </FieldLabel>
              <Input
                id="onboarding-confirm-password"
                type="password"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(event) =>
                  onConfirmPasswordChange(event.target.value)
                }
                required
              />
              <FieldDescription
                className={cn(
                  "text-muted-foreground",
                  confirmPasswordError && "text-destructive"
                )}
              >
                {confirmPasswordError ?? "Helps avoid typos."}
              </FieldDescription>
            </Field>
            <Field>
              {formError && (
                <p className="mb-2 text-sm font-medium text-destructive">
                  {formError}
                </p>
              )}
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
