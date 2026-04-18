import {
  useGetDashboardStats,
  getGetDashboardStatsQueryKey,
  useGetRecentActivity,
  getGetRecentActivityQueryKey,
  useListAttempts,
  getListAttemptsQueryKey,
} from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Skeleton } from "@/components/ui/skeleton";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { BookOpen, Users, CheckCircle2, TrendingUp, Activity, ChevronRight, Trophy, Clock } from "lucide-react";
import { motion } from "framer-motion";
import { format } from "date-fns";

function ScoreRing({ percentage, size = 100 }: { percentage: number; size?: number }) {
  const radius = (size - 12) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (percentage / 100) * circumference;
  const isGood = percentage >= 60;

  return (
    <svg width={size} height={size} className="rotate-[-90deg]">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="#e5e7eb"
        strokeWidth={10}
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke={isGood ? "#10b8a6" : "#f97316"}
        strokeWidth={10}
        strokeDasharray={circumference}
        strokeDashoffset={strokeDashoffset}
        strokeLinecap="round"
        style={{ transition: "stroke-dashoffset 0.8s ease" }}
      />
    </svg>
  );
}

export default function Dashboard() {
  const { data: stats, isLoading } = useGetDashboardStats({
    query: { queryKey: getGetDashboardStatsQueryKey() },
  });

  const { data: attempts, isLoading: isAttemptsLoading } = useListAttempts({
    query: { queryKey: getListAttemptsQueryKey() },
  });

  const recentCompleted = attempts
    ?.filter((a) => a.status === "completed" && a.percentage !== null && a.percentage !== undefined)
    .slice(0, 5) ?? [];

  const avgScore = stats?.averageScore ?? 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8">
        <div>
          <h1 className="text-3xl font-extrabold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground mt-1">Your academic overview at a glance.</p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            {
              title: "Total Quizzes",
              value: stats?.totalQuizzes ?? 0,
              icon: BookOpen,
              bg: "linear-gradient(135deg, #10b8a6, #0d9488)",
              delay: 0,
            },
            {
              title: "My Attempts",
              value: stats?.totalAttempts ?? 0,
              icon: Activity,
              bg: "linear-gradient(135deg, #f97316, #fb923c)",
              delay: 0.1,
            },
            {
              title: "Completed",
              value: stats?.completedAttempts ?? 0,
              icon: CheckCircle2,
              bg: "linear-gradient(135deg, #a855f7, #6366f1)",
              delay: 0.2,
            },
            {
              title: "Active Students",
              value: stats?.activeStudents ?? 0,
              icon: Users,
              bg: "linear-gradient(135deg, #3b82f6, #60a5fa)",
              delay: 0.3,
            },
          ].map((item) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: item.delay }}
              className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 flex items-center gap-5"
            >
              <div
                className="h-12 w-12 rounded-xl flex items-center justify-center shrink-0 shadow-sm"
                style={{ background: item.bg }}
              >
                <item.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">{item.title}</p>
                {isLoading ? (
                  <Skeleton className="h-7 w-16 mt-1" />
                ) : (
                  <p className="text-2xl font-extrabold text-foreground">{item.value}</p>
                )}
              </div>
            </motion.div>
          ))}
        </div>

        {/* Score + Recent Attempts row */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Average Score ring */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8 flex flex-col items-center justify-center gap-4"
          >
            <p className="text-sm font-bold text-muted-foreground uppercase tracking-wide">Average Score</p>
            <div className="relative flex items-center justify-center">
              <ScoreRing percentage={avgScore} size={120} />
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="text-center">
                  <span className="text-2xl font-extrabold text-foreground">{avgScore.toFixed(0)}%</span>
                </div>
              </div>
            </div>
            <div className="flex items-center gap-2 text-sm">
              <TrendingUp className="h-4 w-4 text-primary" />
              <span className="text-muted-foreground font-medium">
                {avgScore >= 60 ? "Above passing threshold" : "Below passing threshold"}
              </span>
            </div>
          </motion.div>

          {/* Recent attempts */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="lg:col-span-2 bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden"
          >
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-primary" />
                <span className="font-bold text-foreground">Recent Attempts</span>
              </div>
              <Link href="/attempts">
                <Button variant="ghost" size="sm" className="text-primary hover:text-primary/80 font-semibold gap-1">
                  View all <ChevronRight className="h-3.5 w-3.5" />
                </Button>
              </Link>
            </div>

            {isAttemptsLoading ? (
              <div className="p-6 space-y-4">
                {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-xl" />)}
              </div>
            ) : recentCompleted.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12 px-6 text-center">
                <Clock className="h-10 w-10 text-muted-foreground/40 mb-3" />
                <p className="text-muted-foreground text-sm">No completed attempts yet.</p>
                <Link href="/quizzes">
                  <Button size="sm" className="mt-4 rounded-xl" style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}>
                    Take a Quiz
                  </Button>
                </Link>
              </div>
            ) : (
              <div className="divide-y divide-gray-50">
                {recentCompleted.map((attempt) => {
                  const pct = attempt.percentage ?? 0;
                  const isPassed = pct >= 60;
                  return (
                    <Link key={attempt.id} href={`/attempts/${attempt.id}/results`}>
                      <div className="flex items-center gap-4 px-6 py-4 hover:bg-gray-50 transition-colors cursor-pointer group">
                        {/* Score circle */}
                        <div className="relative h-12 w-12 shrink-0">
                          <svg width="48" height="48" className="rotate-[-90deg]">
                            <circle cx="24" cy="24" r="19" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                            <circle
                              cx="24" cy="24" r="19"
                              fill="none"
                              stroke={isPassed ? "#10b8a6" : "#f97316"}
                              strokeWidth="4"
                              strokeDasharray={2 * Math.PI * 19}
                              strokeDashoffset={2 * Math.PI * 19 * (1 - pct / 100)}
                              strokeLinecap="round"
                            />
                          </svg>
                          <span className="absolute inset-0 flex items-center justify-center text-xs font-bold text-foreground">
                            {pct.toFixed(0)}%
                          </span>
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-sm text-foreground truncate">
                            {attempt.quizTitle || `Quiz #${attempt.quizId}`}
                          </p>
                          <p className="text-xs text-muted-foreground mt-0.5">
                            {attempt.completedAt ? format(new Date(attempt.completedAt), "MMM d, yyyy") : ""}
                          </p>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className="text-xs font-bold px-2.5 py-1 rounded-full"
                            style={{
                              background: isPassed ? "#f0faf9" : "#fff7ed",
                              color: isPassed ? "#0d9488" : "#f97316",
                            }}
                          >
                            {isPassed ? "Passed" : "Needs Review"}
                          </span>
                          <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-primary transition-colors" />
                        </div>
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </motion.div>
        </div>

        {/* Quick actions */}
        <div className="grid gap-4 sm:grid-cols-2">
          <Link href="/quizzes/create">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5 cursor-pointer hover:shadow-md transition-shadow group">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f97316, #fbbf24)" }}>
                <BookOpen className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Create a Quiz</p>
                <p className="text-sm text-muted-foreground">Generate AI-powered questions instantly</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
          <Link href="/quizzes">
            <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-6 flex items-center gap-5 cursor-pointer hover:shadow-md transition-shadow group">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b8a6, #34d399)" }}>
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div className="flex-1">
                <p className="font-bold text-foreground">Browse Quizzes</p>
                <p className="text-sm text-muted-foreground">Take a quiz and test your knowledge</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground group-hover:text-primary transition-colors" />
            </div>
          </Link>
        </div>
      </div>
    </AppLayout>
  );
}
