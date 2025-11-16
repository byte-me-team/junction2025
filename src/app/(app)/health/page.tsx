"use client";

import React from "react";
import { useRouter } from "next/navigation";
import { Sun, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ChooseActivityPage() {
  const router = useRouter();

  const cards = [
    {
      id: "outdoor",
      title: "Outdoors",
      description:
        "Fresh-air walks, balance practice and nature-based routines to boost mobility and mood.",
      icon: <Sun className="h-20 w-20 text-emerald-600" aria-hidden />,
      href: "/health/outdoors",
      accent: "from-emerald-400 to-emerald-600",
    },
    {
      id: "indoor",
      title: "Indoors",
      description:
        "Gentle stretches and mobility routines you can do at home — perfect for bad weather or short breaks.",
      icon: <Home className="h-20 w-20 text-emerald-500" aria-hidden />,
      href: "/health/indoors",
      accent: "from-emerald-300 to-emerald-500",
    },
  ];

  return (
    <main>
      <header className="mb-8">
        <p className="text-sm font-semibold text-primary">Wellness</p>
        <h1 className="text-3xl font-bold mt-2">Where would you like to start?</h1>
        <p className="text-sm text-muted-foreground mt-2 max-w-2xl">
          Choose outdoors for walks and balance training, or indoors for gentle stretching and mobility.
        </p>
      </header>

      <section className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {cards.map((card) => (
          <div
            key={card.id}
            role="button"
            tabIndex={0}
            onClick={() => router.push(card.href)}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                router.push(card.href);
              }
            }}
            className={`
              group relative flex cursor-pointer flex-col items-start gap-4 rounded-2xl border
              p-6 shadow-sm transition-shadow focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2
              focus-visible:ring-primary/60 hover:shadow-lg active:translate-y-0.5
              bg-gradient-to-br ${card.accent} bg-opacity-30 hover:bg-opacity-40 hover:scale-105 transition-transform
            `}
            aria-label={`Go to ${card.title}`}
          >
            {card.icon}

            <div className="flex-1">
              <h2 className="text-xl font-semibold">{card.title}</h2>
              <p className="mt-1 text-sm text-muted-foreground max-w-xl">{card.description}</p>
            </div>

            
          </div>
        ))}
      </section>

      <footer className="mt-8 text-xs text-muted-foreground">
        <p>
          These suggestions are general wellness routines for older adults. They are not medical advice — consult a healthcare provider if you have concerns.
        </p>
      </footer>
    </main>
  );
}
