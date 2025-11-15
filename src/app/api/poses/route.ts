// src/app/api/poses/route.ts
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const res = await fetch("https://yoga-api-nzy4.onrender.com/v1/poses", {
      cache: "no-store",
    });

    const data = await res.json();

    return NextResponse.json(
      Array.isArray(data) ? data : data.poses ?? []
    );
  } catch (e) {
    return NextResponse.json({ error: "Failed to load poses" }, { status: 500 });
  }
}
