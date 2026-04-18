import { useListAttempts, getListAttemptsQueryKey } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ChevronRight, Trophy, CheckCircle2, XCircle, RotateCcw } from "lucide-react";
import { format } from "date-fns";
import { motion } from "framer-motion";

function ScoreRing({ percentage, size = 56 }: { percentage: number; size?: number }) {
  const radius = (size - 8) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (percentage / 100) * circumference;
  const isGood = percentage >= 60;

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="rotate-[-90deg]">
        <circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke="#e5e7eb" strokeWidth={6} />
        <circle
          cx={size / 2} cy={size / 2} r={radius}
          fill="none"
          stroke={isGood ? "#10b8a6" : "#f97316"}
          strokeWidth={6}
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          strokeLinecap="round"
        />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-extrabold text-foreground">{percentage.toFixed(0)}%</span>
      </div>
    </div>
  );
}

export default function AttemptsList() {
  const { data: attempts, isLoading } = useListAttempts({
    query: { queryKey: getListAttemptsQueryKey() },
  });

  const completed = attempts?.filter((a) => a.status === "completed") ?? [];
  const inProgress = attempts?.filter((a) => a.status !== "completed") ?? [];

  const avgScore = completed.length > 0
    ? completed.reduce((sum, a) => sum + (a.percentage ?? 0), 0) / completed.length
    : 0;
  const passedCount = completed.filter((a) => (a.percentage ?? 0) >= 60).length;

  return (
    <AppLayout>
      <div className="flex flex-col gap-8 max-w-5xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-extrabold text-foreground">My Attempts</h1>
            <p className="text-muted-foreground mt-1">Your quiz history and scores.</p>
          </div>
          <Link href="/quizzes">
            <Button
              className="rounded-xl font-semibold"
              style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}
            >
              <Trophy className="h-4 w-4 mr-2" />
              Take a Quiz
            </Button>
          </Link>
        </div>

        {/* Score summary */}
        {!isLoading && completed.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="grid gap-4 sm:grid-cols-3"
          >
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #10b8a6, #34d399)" }}>
                <Trophy className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Avg Score</p>
                <p className="text-2xl font-extrabold text-foreground">{avgScore.toFixed(1)}%</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #a855f7, #6366f1)" }}>
                <CheckCircle2 className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Passed</p>
                <p className="text-2xl font-extrabold text-foreground">{passedCount} / {completed.length}</p>
              </div>
            </div>
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-4">
              <div className="h-12 w-12 rounded-xl flex items-center justify-center" style={{ background: "linear-gradient(135deg, #f97316, #fbbf24)" }}>
                <RotateCcw className="h-6 w-6 text-white" />
              </div>
              <div>
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">In Progress</p>
                <p className="text-2xl font-extrabold text-foreground">{inProgress.length}</p>
              </div>
            </div>
          </motion.div>
        )}

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5">
                <div className="flex items-center gap-4">
                  <Skeleton className="h-14 w-14 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-5 w-2/3" />
                    <Skeleton className="h-4 w-1/3" />
                  </div>
                  <Skeleton className="h-8 w-24 rounded-xl" />
                </div>
              </div>
            ))}
          </div>
        ) : attempts?.length === 0 ? (
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 flex flex-col items-center justify-center py-20 text-center px-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mb-4">
              <Clock className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-2">No attempts yet</h3>
            <p className="text-muted-foreground max-w-sm mb-6 text-sm">
              You haven't taken any quizzes yet. Find a quiz and test your knowledge!
            </p>
            <Link href="/quizzes">
              <Button className="rounded-xl" style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}>
                Browse Quizzes
              </Button>
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {attempts?.map((attempt, i) => {
              const pct = attempt.percentage ?? 0;
              const isPassed = pct >= 60;
              const isCompleted = attempt.status === "completed";

              return (
                <motion.div
                  key={attempt.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3, delay: i * 0.04 }}
                >
                  <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 flex items-center gap-5 hover:shadow-md transition-shadow">
                    {/* Score ring */}
                    <div className="shrink-0">
                      {isCompleted ? (
                        <ScoreRing percentage={pct} size={56} />
                      ) : (
                        <div className="h-14 w-14 rounded-full border-4 border-gray-200 flex items-center justify-center">
                          <Clock className="h-5 w-5 text-muted-foreground" />
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-foreground truncate text-base">
                        {attempt.quizTitle || `Quiz #${attempt.quizId}`}
                      </p>
                      <div className="flex items-center gap-3 mt-1">
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <Calendar className="h-3 w-3" />
                          {format(new Date(attempt.startedAt), "MMM d, yyyy")}
                        </div>
                        {isCompleted && (
                          <div className="flex items-center gap-1 text-xs font-semibold" style={{ color: isPassed ? "#0d9488" : "#f97316" }}>
                            {isPassed ? <CheckCircle2 className="h-3 w-3" /> : <XCircle className="h-3 w-3" />}
                            {isPassed ? "Passed" : "Needs Review"}
                          </div>
                        )}
                      </div>
                      {isCompleted && attempt.score !== null && attempt.score !== undefined && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Score: <span className="font-bold text-foreground">{attempt.score} / {attempt.maxScore}</span> points
                        </p>
                      )}
                    </div>

                    {/* Action */}
                    {isCompleted ? (
                      <Link href={`/attempts/${attempt.id}/results`}>
                        <Button
                          size="sm"
                          className="rounded-xl font-semibold shrink-0 gap-1.5"
                          style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}
                        >
                          View Results
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    ) : (
                      <Link href={`/quizzes/${attempt.quizId}/attempt?attemptId=${attempt.id}`}>
                        <Button
                          size="sm"
                          className="rounded-xl font-semibold shrink-0 gap-1.5"
                          style={{ background: "linear-gradient(135deg, #f97316, #fb923c)", color: "white", border: "none" }}
                        >
                          Resume
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Button>
                      </Link>
                    )}
                  </div>
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
