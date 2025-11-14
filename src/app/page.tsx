export default function Home() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <section className="mx-auto flex w-full max-w-4xl flex-col gap-8 px-6 py-24">
        <p className="text-sm font-semibold uppercase tracking-[0.3em] text-primary">
          Aging With AI
        </p>
        <div className="space-y-4">
          <h1 className="text-4xl font-semibold sm:text-5xl">
            Planning and activity-matching for seniors and their families
          </h1>
          <p className="text-lg text-muted-foreground">
            We help older adults discover nearby events, match with relatives for
            shared outings, and stay gently motivated through AI-powered
            suggestions.
          </p>
        </div>

        <div className="rounded-2xl border border-border bg-card/80 p-6 shadow-sm transition-all sm:p-8">
          <h2 className="text-2xl font-semibold">Coming soon</h2>
          <p className="mt-3 text-base text-muted-foreground">
            This is a placeholder experience while we build onboarding, shared
            planning, and daily suggestion flows. Expect quick iterations over the
            next few days as we plug in Prisma, our event ingestion pipeline, and
            the Featherless ranking service.
          </p>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-border/60 bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">Focus</p>
              <p className="mt-2 text-lg font-semibold">
                Respectful motivation, zero hype
              </p>
            </div>
            <div className="rounded-xl border border-border/60 bg-muted/50 p-4">
              <p className="text-sm font-medium text-muted-foreground">Status</p>
              <p className="mt-2 text-lg font-semibold">UI scaffolding in progress</p>
            </div>
          </div>
        </div>

        <div className="rounded-2xl border border-dashed border-primary/40 p-6">
          <p className="text-sm font-semibold uppercase tracking-widest text-primary">
            Placeholder CTA
          </p>
          <p className="mt-2 text-xl font-medium">
            Intake form & onboarding wizard land here soon.
          </p>
        </div>
      </section>
    </main>
  );
}
