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
  error?: string | null
  buttonLabel?: string
  supportingText?: string
  footer?: ReactNode
  onEmailChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function LoginForm({
  className,
  email,
  error,
  buttonLabel = "Continue",
  supportingText = "We'll keep this email in localStorage until real auth ships.",
  footer,
  onEmailChange,
  onSubmit,
}: LoginFormProps) {
  return (
    <div className={cn("flex flex-col gap-6", className)}>
      <Card>
        <CardHeader>
          <CardTitle>Sign in to continue</CardTitle>
          <CardDescription>
            Enter your email so we can simulate a session during the hackathon.
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
                    error && "text-destructive"
                  )}
                >
                  {error ? error : supportingText}
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
    </div>
  )
}
