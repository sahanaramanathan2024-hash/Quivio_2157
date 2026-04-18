import { Link } from "wouter";
import { motion } from "framer-motion";
import { BookOpen, Target, Users, Award, ArrowRight, Sparkles, BrainCircuit } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Home() {
  return (
    <div className="flex min-h-screen flex-col" style={{ background: "linear-gradient(135deg, #fff8f0 0%, #fdf4ff 50%, #f0faf9 100%)" }}>
      {/* Header */}
      <header className="px-6 lg:px-14 h-18 flex items-center justify-between bg-white/80 backdrop-blur-md sticky top-0 z-50 border-b border-gray-100 shadow-sm">
        <div className="flex items-center gap-2.5">
          <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shadow-md">
            <BookOpen className="h-5 w-5 text-white" />
          </div>
          <span className="text-xl font-extrabold tracking-tight text-foreground uppercase">QUIVIO</span>
        </div>
        <nav className="flex items-center gap-3">
          <Link href="/sign-in">
            <Button variant="ghost" className="font-semibold text-foreground uppercase tracking-wide text-sm">
              Login
            </Button>
          </Link>
          <Link href="/sign-up">
            <Button className="font-bold rounded-lg px-6 uppercase tracking-wide text-sm bg-accent hover:bg-accent/90 text-white shadow-md">
              Signup
            </Button>
          </Link>
        </nav>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="relative overflow-hidden py-20 md:py-28">
          <div className="container mx-auto px-6 md:px-12 flex flex-col md:flex-row items-center gap-12">
            {/* Left content */}
            <div className="flex-1 max-w-xl">
              <motion.h1
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground mb-2 uppercase"
              >
                QUIVIO
              </motion.h1>
              <motion.div
                initial={{ opacity: 0, scaleX: 0 }}
                animate={{ opacity: 1, scaleX: 1 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="h-1 w-48 mb-6 rounded-full origin-left"
                style={{ background: "linear-gradient(90deg, #f97316, #a855f7, #10b8a6, #3b82f6)" }}
              />
              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="text-base md:text-lg text-muted-foreground leading-relaxed mb-8 max-w-md"
              >
                Quivio turns assessments into an AI-driven adventure — with dynamic question sets, instant feedback, tailored action plans, and points/rewards. Teachers create, students test, and everyone wins more!
              </motion.p>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
              >
                <Link href="/sign-up">
                  <Button
                    size="lg"
                    className="h-13 px-8 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-105 uppercase tracking-wide"
                    style={{ background: "linear-gradient(135deg, #f97316, #fb923c)", color: "white", border: "none" }}
                  >
                    Get Started — Join Now!
                    <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
              </motion.div>
            </div>

            {/* Right floating icons */}
            <div className="flex-1 flex justify-center items-center relative h-72 md:h-80">
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-4 right-16 h-20 w-20 rounded-2xl shadow-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #3b82f6, #60a5fa)" }}
              >
                <BookOpen className="h-10 w-10 text-white" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 10, 0] }}
                transition={{ duration: 3.5, repeat: Infinity, ease: "easeInOut", delay: 0.5 }}
                className="absolute top-20 right-4 h-16 w-16 rounded-2xl shadow-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #10b8a6, #34d399)" }}
              >
                <Target className="h-8 w-8 text-white" />
              </motion.div>
              <motion.div
                animate={{ y: [0, -8, 0] }}
                transition={{ duration: 4, repeat: Infinity, ease: "easeInOut", delay: 1 }}
                className="absolute bottom-16 right-10 h-18 w-18 rounded-full shadow-xl flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #f97316, #fb923c)", width: "72px", height: "72px" }}
              >
                <Users className="h-8 w-8 text-white" />
              </motion.div>
              <motion.div
                animate={{ y: [0, 14, 0] }}
                transition={{ duration: 3.2, repeat: Infinity, ease: "easeInOut", delay: 0.8 }}
                className="absolute bottom-8 right-28 h-16 w-16 rounded-full shadow-lg flex items-center justify-center"
                style={{ background: "linear-gradient(135deg, #f97316, #fbbf24)", width: "64px", height: "64px" }}
              >
                <Award className="h-7 w-7 text-white" />
              </motion.div>
              {/* Decorative dots */}
              <div className="absolute top-12 right-36 h-4 w-4 rounded-full bg-yellow-400 opacity-80" />
              <div className="absolute top-36 right-32 h-3 w-3 rounded-full bg-purple-500 opacity-70" />
              <div className="absolute bottom-24 right-36 h-3 w-3 rounded-full bg-primary opacity-70" />
              <div className="absolute top-48 right-6 h-4 w-4 rounded-full" style={{ background: "#f97316", opacity: 0.6 }} />
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="py-20" style={{ background: "rgba(255,255,255,0.5)", backdropFilter: "blur(10px)" }}>
          <div className="container mx-auto px-6 md:px-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-center mb-14"
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary font-semibold text-sm mb-4">
                <Sparkles className="h-4 w-4" />
                AI-Powered Platform
              </div>
              <h2 className="text-4xl font-extrabold text-foreground mb-4">How it works</h2>
              <p className="text-muted-foreground max-w-xl mx-auto">Everything you need to create, manage, and ace assessments in one place.</p>
            </motion.div>

            <div className="grid gap-8 md:grid-cols-3">
              {[
                {
                  icon: <BrainCircuit className="h-7 w-7 text-white" />,
                  bg: "linear-gradient(135deg, #10b8a6, #34d399)",
                  title: "AI Question Generation",
                  desc: "Enter a topic and let our AI craft perfect, curriculum-aligned questions instantly.",
                },
                {
                  icon: <Target className="h-7 w-7 text-white" />,
                  bg: "linear-gradient(135deg, #f97316, #fbbf24)",
                  title: "Instant Evaluation",
                  desc: "Students submit answers and receive AI-powered feedback with correct answers and explanations.",
                },
                {
                  icon: <Award className="h-7 w-7 text-white" />,
                  bg: "linear-gradient(135deg, #a855f7, #6366f1)",
                  title: "Track Performance",
                  desc: "Detailed analytics reveal strengths and gaps, guiding students to success.",
                },
              ].map((feature, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.5, delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-8 shadow-sm border border-gray-100 hover:shadow-md transition-shadow"
                >
                  <div
                    className="h-14 w-14 rounded-2xl flex items-center justify-center mb-5 shadow-md"
                    style={{ background: feature.bg }}
                  >
                    {feature.icon}
                  </div>
                  <h3 className="text-xl font-bold text-foreground mb-3">{feature.title}</h3>
                  <p className="text-muted-foreground leading-relaxed">{feature.desc}</p>
                </motion.div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="py-20">
          <div className="container mx-auto px-6 text-center">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="max-w-2xl mx-auto"
            >
              <h2 className="text-4xl font-extrabold text-foreground mb-4">Ready to transform your classroom?</h2>
              <p className="text-muted-foreground mb-8 text-lg">Join thousands of educators using Quivio to create smarter assessments.</p>
              <Link href="/sign-up">
                <Button
                  size="lg"
                  className="h-13 px-10 text-base font-bold rounded-xl shadow-lg transition-all hover:scale-105"
                  style={{ background: "linear-gradient(135deg, #10b8a6, #34d399)", color: "white", border: "none" }}
                >
                  <Sparkles className="mr-2 h-5 w-5" />
                  Start for Free
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      </main>

      <footer className="bg-white/70 border-t border-gray-100 py-10">
        <div className="container mx-auto px-6 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="h-7 w-7 rounded-lg bg-primary flex items-center justify-center">
              <BookOpen className="h-4 w-4 text-white" />
            </div>
            <span className="font-extrabold uppercase tracking-wide text-foreground">QUIVIO</span>
          </div>
          <p className="text-sm text-muted-foreground">
            © {new Date().getFullYear()} Quivio. Empowering educators worldwide.
          </p>
        </div>
      </footer>
    </div>
  );
}
