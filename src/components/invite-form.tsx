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

type InviteFormProps = {
  className?: string
  name: string
  error?: string | null
  buttonLabel?: string
  supportingText?: string
  helperText?: string
  footer?: ReactNode
  onNameChange: (value: string) => void
  onSubmit: (event: FormEvent<HTMLFormElement>) => void
}

export function InviteForm({
  className,
  name,
  error,
  buttonLabel = "Continue",
  footer,
  onNameChange,
  onSubmit,
}: InviteFormProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Invite your loved ones</CardTitle>
        <CardDescription>
          Tell us who you want to invite
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={onSubmit} className="space-y-6">
          <FieldGroup>
            <Field>
              <FieldLabel htmlFor="onboarding-name">Name</FieldLabel>
              <Input
                id="onboarding-name"
                type="text"
                placeholder="Daughter Ana"
                value={name}
                onChange={(event) => onNameChange(event.target.value)}
              />
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
