import { useLocation } from "wouter";
import { useGetAttempt, getGetAttemptQueryKey } from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  AlertCircle,
  CheckCircle2,
  XCircle,
  ChevronLeft,
  BrainCircuit,
  TrendingUp,
  Target,
  ListChecks,
  Trophy,
} from "lucide-react";
import { format, differenceInSeconds } from "date-fns";

interface ActionPlan {
  headline: string;
  summary: string;
  strengths: string;
  improvements: string;
  nextSteps: string[];
}

function parseActionPlan(raw: string | null | undefined): ActionPlan | null {
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw);
    if (parsed && typeof parsed === "object" && parsed.headline) return parsed as ActionPlan;
  } catch {}
  return null;
}

export default function AttemptResults({ id: idParam }: { id: string }) {
  const id = parseInt(idParam, 10);
  const [, setLocation] = useLocation();

  const { data: attempt, isLoading } = useGetAttempt(id, {
    query: { enabled: !!id, queryKey: getGetAttemptQueryKey(id) },
  });

  if (isLoading) {
    return (
      <AppLayout>
        <div className="max-w-2xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <Skeleton className="h-64 w-full rounded-2xl" />
          <Skeleton className="h-32 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      </AppLayout>
    );
  }

  if (!attempt) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Attempt Not Found</h2>
          <Button className="mt-6" onClick={() => setLocation("/attempts")}>Back to Attempts</Button>
        </div>
      </AppLayout>
    );
  }

  const pct = attempt.percentage ?? 0;
  const isPassed = pct >= 60;
  const correct = attempt.answers?.filter((a) => a.isCorrect === true).length ?? 0;
  const wrong = attempt.answers?.filter((a) => a.isCorrect === false).length ?? 0;

  let timeTaken = "";
  if (attempt.startedAt && attempt.completedAt) {
    const secs = differenceInSeconds(new Date(attempt.completedAt), new Date(attempt.startedAt));
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    timeTaken = `${m}m ${s}s`;
  }

  const actionPlan = parseActionPlan(attempt.feedback);

  // SVG ring
  const radius = 56;
  const circumference = 2 * Math.PI * radius;
  const dashOffset = circumference - (pct / 100) * circumference;

  return (
    <AppLayout>
      <div className="max-w-2xl mx-auto flex flex-col gap-5">

        {/* Back */}
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" className="rounded-xl" onClick={() => setLocation("/attempts")}>
            <ChevronLeft className="h-5 w-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Your Results</h1>
            <p className="text-sm text-muted-foreground">{attempt.quizTitle || `Quiz #${attempt.quizId}`}</p>
          </div>
        </div>

        {/* ── SCORE CARD ── */}
        <div
          className="rounded-2xl p-8 flex flex-col items-center text-center gap-3"
          style={{ background: "linear-gradient(135deg, #d1faf5 0%, #e0fdf4 60%, #f0fdf4 100%)", border: "1.5px solid #99f6e4" }}
        >
          {/* Ring */}
          <svg width="140" height="140" viewBox="0 0 140 140">
            <circle cx="70" cy="70" r={radius} fill="none" stroke="#ccfbf1" strokeWidth="12" />
            <circle
              cx="70"
              cy="70"
              r={radius}
              fill="none"
              stroke="#10b8a6"
              strokeWidth="12"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={dashOffset}
              transform="rotate(-90 70 70)"
              style={{ transition: "stroke-dashoffset 1s ease" }}
            />
            <foreignObject x="30" y="30" width="80" height="80">
              <div
                style={{
                  width: 80,
                  height: 80,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  background: "#10b8a6",
                }}
              >
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </div>
            </foreignObject>
          </svg>

          <div>
            <p className="text-5xl font-extrabold" style={{ color: "#10b8a6" }}>{pct.toFixed(0)}%</p>
            <p className="text-xl font-bold text-foreground mt-1">
              {actionPlan?.headline ?? (isPassed ? "Great Job!" : "Keep Practicing!")}
            </p>
            <p className="text-sm text-muted-foreground mt-1 max-w-sm mx-auto">
              {actionPlan?.summary ?? (isPassed
                ? "You passed the quiz! Check out your personalized action plan below."
                : "Review the topics you missed and try again to improve your score.")}
            </p>
          </div>

          {attempt.completedAt && (
            <p className="text-xs text-muted-foreground">
              Completed {format(new Date(attempt.completedAt), "MMM d, yyyy · h:mm a")}
              {timeTaken ? ` · ${timeTaken}` : ""}
            </p>
          )}
        </div>

        {/* ── STAT BOXES ── */}
        <div className="grid grid-cols-3 gap-4">
          {/* Correct */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2">
            <div className="h-11 w-11 rounded-full bg-teal-50 flex items-center justify-center">
              <CheckCircle2 className="h-6 w-6 text-teal-500" />
            </div>
            <p className="text-3xl font-extrabold text-teal-500">{correct}</p>
            <p className="text-xs font-semibold text-muted-foreground text-center">Correct Answers</p>
          </div>

          {/* Wrong */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2">
            <div className="h-11 w-11 rounded-full bg-red-50 flex items-center justify-center">
              <XCircle className="h-6 w-6 text-red-400" />
            </div>
            <p className="text-3xl font-extrabold text-red-400">{wrong}</p>
            <p className="text-xs font-semibold text-muted-foreground text-center">Mistakes</p>
          </div>

          {/* Score */}
          <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 flex flex-col items-center gap-2">
            <div className="h-11 w-11 rounded-full bg-amber-50 flex items-center justify-center">
              <Trophy className="h-6 w-6 text-amber-500" />
            </div>
            <p className="text-3xl font-extrabold text-amber-500">
              {attempt.score ?? 0}/{attempt.maxScore ?? 0}
            </p>
            <p className="text-xs font-semibold text-muted-foreground text-center">Total Marks</p>
          </div>
        </div>

        {/* ── ACTION PLAN ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-2">
            <Target className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold text-foreground">Action Plan</h2>
          </div>
          <div className="p-5 space-y-4">

            {/* Strengths */}
            <div
              className="rounded-xl p-4 flex gap-3"
              style={{ background: "#f0fdf9", borderLeft: "4px solid #10b8a6" }}
            >
              <TrendingUp className="h-5 w-5 mt-0.5 shrink-0" style={{ color: "#10b8a6" }} />
              <div>
                <p className="font-bold text-foreground mb-1">Strengths Identified</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {actionPlan?.strengths ?? "You showed solid understanding across several question areas."}
                </p>
              </div>
            </div>

            {/* Improvements */}
            <div
              className="rounded-xl p-4 flex gap-3"
              style={{ background: "#fff7f0", borderLeft: "4px solid #f97316" }}
            >
              <Target className="h-5 w-5 mt-0.5 shrink-0 text-orange-500" />
              <div>
                <p className="font-bold text-foreground mb-1">Areas for Improvement</p>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {actionPlan?.improvements ?? "Review the questions you missed and revisit related study materials."}
                </p>
              </div>
            </div>

            {/* Next Steps */}
            <div
              className="rounded-xl p-4 flex gap-3"
              style={{ background: "#f5f3ff", borderLeft: "4px solid #8b5cf6" }}
            >
              <ListChecks className="h-5 w-5 mt-0.5 shrink-0 text-purple-500" />
              <div>
                <p className="font-bold text-foreground mb-1">Recommended Next Steps</p>
                <ul className="text-sm text-muted-foreground space-y-1 mt-1">
                  {(actionPlan?.nextSteps ?? [
                    "Review the questions you missed in detail",
                    "Re-read your study materials on weak topics",
                    "Try the quiz again to track your improvement",
                  ]).map((step, i) => (
                    <li key={i} className="flex items-start gap-1.5">
                      <span className="shrink-0 mt-0.5">•</span>
                      {step}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* ── QUESTION BREAKDOWN ── */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden">
          <div
            className="flex items-center gap-3 px-6 py-4 text-white font-bold text-sm uppercase tracking-wide"
            style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)" }}
          >
            <CheckCircle2 className="h-5 w-5" />
            Question-by-Question Analysis
          </div>

          <div className="divide-y divide-gray-100">
            {attempt.answers?.map((answer, index) => {
              const isCorrect = answer.isCorrect === true;
              const isWrong = answer.isCorrect === false;

              return (
                <div key={answer.id} className="p-5">
                  {/* Header row */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-flex items-center justify-center h-6 px-2.5 rounded-full text-white text-xs font-bold"
                        style={{ background: "#10b8a6" }}
                      >
                        Q{index + 1}
                      </span>
                      <span className="text-xs text-muted-foreground font-medium">
                        {answer.pointsEarned !== null && answer.pointsEarned !== undefined
                          ? `${answer.pointsEarned} pt(s)`
                          : "Pending"}
                      </span>
                    </div>
                    {isCorrect ? (
                      <span className="flex items-center gap-1 text-teal-600 text-sm font-bold">
                        <CheckCircle2 className="h-4 w-4" /> Correct
                      </span>
                    ) : isWrong ? (
                      <span className="flex items-center gap-1 text-red-500 text-sm font-bold">
                        <XCircle className="h-4 w-4" /> Incorrect
                      </span>
                    ) : null}
                  </div>

                  {/* Question text */}
                  <p className="text-sm font-semibold text-foreground leading-relaxed mb-3">
                    {answer.questionText}
                  </p>

                  {/* Your answer / Correct answer */}
                  <div className="grid md:grid-cols-2 gap-3 mb-3">
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Your Answer</p>
                      <div
                        className={`p-3 rounded-xl border-2 text-sm font-medium ${
                          isCorrect
                            ? "border-teal-300 bg-teal-50 text-teal-800"
                            : isWrong
                            ? "border-red-300 bg-red-50 text-red-800"
                            : "border-gray-200 bg-gray-50 text-gray-700"
                        }`}
                      >
                        {answer.userAnswer || (
                          <span className="italic text-muted-foreground font-normal">No answer given</span>
                        )}
                      </div>
                    </div>
                    <div>
                      <p className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-1.5">Correct Answer</p>
                      <div className="p-3 rounded-xl border-2 border-teal-300 bg-teal-50 text-sm font-medium text-teal-800">
                        {answer.correctAnswer}
                      </div>
                    </div>
                  </div>

                  {/* AI Explanation */}
                  {(answer.aiFeedback || answer.explanation) && (
                    <div className="p-3 rounded-xl flex gap-2.5" style={{ background: "#f0faf9", border: "1px solid #a7f3d0" }}>
                      <BrainCircuit className="h-4 w-4 text-primary mt-0.5 shrink-0" />
                      <p className="text-sm leading-relaxed text-gray-700">
                        {answer.aiFeedback || answer.explanation}
                      </p>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-4 pb-8 justify-center">
          <Button
            variant="outline"
            className="rounded-xl font-semibold"
            onClick={() => setLocation("/quizzes")}
          >
            Browse Quizzes
          </Button>
          <Button
            className="rounded-xl font-semibold"
            style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}
            onClick={() => setLocation("/dashboard")}
          >
            Back to Dashboard
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
