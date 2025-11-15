import { NextResponse } from "next/server";

import { prisma } from "@/lib/prisma";

type CreateUserPayload = {
  email?: unknown;
  name?: unknown;
};

export async function GET() {
  try {
    const users = await prisma.user.findMany({
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    return NextResponse.json({ users });
  } catch (error) {
    console.error("Failed to fetch users", error);
    return NextResponse.json(
      { error: "Unable to fetch users." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const body = (await request.json()) as CreateUserPayload;
    const email =
      typeof body.email === "string" ? body.email.trim().toLowerCase() : "";

    if (!email || !email.includes("@")) {
      return NextResponse.json(
        { error: "A valid email is required." },
        { status: 400 }
      );
    }

    const name = typeof body.name === "string" ? body.name.trim() : undefined;

    const user = await prisma.user.create({
      data: {
        email,
        name,
      },
    });

    return NextResponse.json(user, { status: 201 });
  } catch (error) {
    console.error("Failed to create user", error);

    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Email already exists." },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Unable to create user." },
      { status: 500 }
    );
  }
}
