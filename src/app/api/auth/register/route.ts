import { hash } from "bcryptjs";
import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";
import type { OnboardingState } from "@/lib/onboarding-store";

type RegisterPayload = {
  name?: string;
  email?: string;
  password?: string;
  city?: string;
  onboarding?: OnboardingState;
};

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as RegisterPayload;
    const email = body.email?.trim().toLowerCase() ?? "";
    const password = body.password?.trim() ?? "";
    const name = body.name?.trim();
    const city = body.city?.trim();

    if (!email || !password || !city) {
      return NextResponse.json(
        { error: "Email, city, and password are required." },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: "Password must be at least 8 characters." },
        { status: 400 }
      );
    }

    const existingUser = await prisma.user.findUnique({ where: { email } });

    if (existingUser) {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 }
      );
    }

    const passwordHash = await hash(password, 10);

    const onboardingPreferences = body.onboarding?.preferences;
    const sanitizedOnboarding: Record<string, unknown> | null = body.onboarding
      ? {
          ...body.onboarding,
          basicInfo: {
            name: body.onboarding.basicInfo.name,
            email: body.onboarding.basicInfo.email,
            city: body.onboarding.basicInfo.city,
          },
        }
      : null;

    const user = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash,
        city,
        preferences: onboardingPreferences
          ? {
              create: {
                rawText: JSON.stringify(onboardingPreferences),
                normalizedJson: sanitizedOnboarding,
              },
            }
          : undefined,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    return NextResponse.json({ user }, { status: 201 });
  } catch (error) {
    console.error("Failed to register user", error);
    return NextResponse.json(
      { error: "Unable to create account." },
      { status: 500 }
    );
  }
}
