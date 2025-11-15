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

type LoginFormProps = {
  className?: string
  email: string
  password: string
  emailError?: string | null
  passwordError?: string | null
  formError?: string | null
  buttonLabel?: string
  supportingText?: string
  footer?: ReactNode
  isSubmitting?: boolean
  onEmailChange: (value: string) => void
  onPasswordChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginForm({
  className,
  email,
  password,
  emailError,
  passwordError,
  formError,
  buttonLabel = "Sign in",
  supportingText = "Enter your credentials to access the dashboard.",
  footer,
  isSubmitting,
  onEmailChange,
  onPasswordChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Sign in to continue</CardTitle>
          <CardDescription>
            Enter your email and password to access your profile.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-6">
            <FieldGroup>
              <Field>
                <FieldLabel htmlFor="login-email">Email</FieldLabel>
                <Input
                  id="login-email"
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
                  {emailError ? emailError : supportingText}
                </FieldDescription>
              </Field>
              <Field>
                <FieldLabel htmlFor="login-password">Password</FieldLabel>
                <Input
                  id="login-password"
                  type="password"
                  placeholder="••••••••"
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
                  {passwordError ?? "At least 8 characters."}
                </FieldDescription>
              </Field>
              <Field>
                {formError && (
                  <p className="mb-2 text-sm font-medium text-destructive">
                    {formError}
                  </p>
                )}
                <Button type="submit" className="w-full" disabled={isSubmitting}>
                  {isSubmitting ? "Signing in..." : buttonLabel}
                </Button>
                {footer}
              </Field>
            </FieldGroup>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
