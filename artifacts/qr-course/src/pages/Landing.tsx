import { useLocation } from "wouter";
import { ArrowRight, BookOpen, LineChart, Calculator, Brain } from "lucide-react";
import { TopicsList } from "@/components/TopicsList";
import { CompanyContact } from "@/components/CompanyContact";

const weeks = [
  {
    title: "Limits and Derivatives",
    detail: "Tangent lines, limits, continuity, derivatives, and differentiation rules.",
  },
  {
    title: "Differentiation Techniques and Applications",
    detail: "The chain rule, implicit differentiation, related rates, Newton's method, and optimization.",
  },
  {
    title: "Integration",
    detail: "Antiderivatives, Riemann sums, the fundamental theorem, and integration techniques.",
  },
  {
    title: "Applications of Integration and Infinite Series",
    detail: "Areas, volumes, differential equations, improper integrals, and Taylor series.",
  },
];

const features = [
  {
    icon: BookOpen,
    title: "29 micro-lectures",
    detail: "Each idea at short, medium, or long depth, grounded in a real example.",
  },
  {
    icon: Calculator,
    title: "Write the math",
    detail: "Compose limits, derivatives, and integrals in symbols with a built-in math keyboard.",
  },
  {
    icon: Brain,
    title: "AI tutor & grading",
    detail: "A section-scoped tutor, adaptive practice, and instant AI-graded work.",
  },
  {
    icon: LineChart,
    title: "Track your progress",
    detail: "Homework, tests, a midterm, and a final — all in one connected arc.",
  },
];

export default function Landing() {
  const [, setLocation] = useLocation();

  return (
    <div className="min-h-[100dvh] bg-background text-foreground">
      <header className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-primary rounded-md flex items-center justify-center text-primary-foreground font-serif font-bold text-lg">
            ∑
          </div>
          <span className="font-serif font-semibold text-lg tracking-tight">
             Calculus
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setLocation("/dashboard")}
            className="px-4 py-2 rounded-md text-sm font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
            data-testid="button-open-course"
          >
            Open course
          </button>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 flex gap-8 items-start">
        <div className="hidden md:block pt-6 sticky top-0 max-h-screen overflow-y-auto pb-8">
          <TopicsList />
        </div>

      <main className="flex-1 min-w-0">
        <section className="py-16 md:py-24 text-center max-w-3xl mx-auto">
          <p className="text-sm font-medium tracking-wide uppercase text-muted-foreground mb-4">
             A four-week course on the mathematics of change
          </p>
          <h1 className="font-serif text-4xl md:text-5xl font-bold leading-tight mb-6">
             Understand change, calculate rates, add it all up.
          </h1>
          <p className="text-lg text-muted-foreground mb-8">
             Start with limits and the questions that created calculus. Learn to
             measure instantaneous change with derivatives, accumulate it with
             integrals, and use series to approximate what you cannot solve exactly.
          </p>
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={() => setLocation("/dashboard")}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-md text-base font-medium bg-primary text-primary-foreground hover:opacity-90 transition-opacity"
              data-testid="button-start"
            >
              Start the course — no sign-up needed
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </section>

        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pb-16">
          {features.map((f) => (
            <div
              key={f.title}
              className="rounded-xl border border-card-border bg-card p-5"
            >
              <f.icon className="w-6 h-6 text-primary mb-3" />
              <h3 className="font-serif font-semibold text-base mb-1">
                {f.title}
              </h3>
              <p className="text-sm text-muted-foreground">{f.detail}</p>
            </div>
          ))}
        </section>

        <section className="pb-24">
          <h2 className="font-serif text-2xl font-bold text-center mb-8">
             Four weeks, one connected arc
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {weeks.map((w, i) => (
              <div
                key={w.title}
                className="rounded-xl border border-card-border bg-card p-6 flex gap-4"
              >
                <div className="shrink-0 w-10 h-10 rounded-md bg-secondary flex items-center justify-center font-serif font-bold text-primary">
                  {i + 1}
                </div>
                <div>
                  <h3 className="font-serif font-semibold mb-1">{w.title}</h3>
                  <p className="text-sm text-muted-foreground">{w.detail}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        <section className="md:hidden pb-16">
          <TopicsList className="mx-auto" />
        </section>
      </main>
      </div>

      <footer className="border-t border-border px-6 py-6 text-sm text-muted-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
           <span>Calculus — understand change, calculate rates, add it all up.</span>
          <CompanyContact />
        </div>
      </footer>
    </div>
  );
}
