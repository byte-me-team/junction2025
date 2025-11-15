"use client";

import { useParams } from "next/navigation";
import { RelativesForm } from "@/components/forms/relative-form";

export default function RelativePage() {
  const params = useParams();
  const userIdParam = params.id;
  const userNameParam = params.name;

  const userId = Array.isArray(userIdParam) ? userIdParam[0] : userIdParam;
  const name = Array.isArray(userNameParam) ? userNameParam[0] : userNameParam;

  if (!userId) return <p>Invalid user ID</p>;
  if (!name) return <p>Invalid name</p>;

  return (
    <main className="p-8">
      <h1 className="text-2xl font-bold mb-4">Enter Relative Preferences</h1>
      <RelativesForm userId={userId} name={name} />
    </main>
  );
}
