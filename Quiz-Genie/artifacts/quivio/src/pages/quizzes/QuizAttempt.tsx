import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import {
  useGetQuiz,
  getGetQuizQueryKey,
  useSubmitAttempt,
  useGetAttempt,
  getGetAttemptQueryKey,
} from "@workspace/api-client-react";
import AppLayout from "@/components/layout/AppLayout";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Skeleton } from "@/components/ui/skeleton";
import { AlertCircle, Clock, Send, CheckCircle2 } from "lucide-react";
import { toast } from "sonner";
import { useQueryClient } from "@tanstack/react-query";

const OPTION_LABELS = ["A", "B", "C", "D", "E", "F"];

export default function QuizAttempt({ id: quizIdParam }: { id: string }) {
  const quizId = parseInt(quizIdParam, 10);
  const [, setLocation] = useLocation();
  const searchParams = new URLSearchParams(window.location.search);
  const attemptIdParam = searchParams.get("attemptId");
  const attemptId = attemptIdParam ? parseInt(attemptIdParam, 10) : null;

  const queryClient = useQueryClient();

  const { data: quiz, isLoading: isQuizLoading } = useGetQuiz(quizId, {
    query: { enabled: !!quizId, queryKey: getGetQuizQueryKey(quizId) },
  });

  const { data: attempt, isLoading: isAttemptLoading } = useGetAttempt(attemptId!, {
    query: { enabled: !!attemptId, queryKey: getGetAttemptQueryKey(attemptId!) },
  });

  const submitAttempt = useSubmitAttempt();
  const [answers, setAnswers] = useState<Record<number, string>>({});
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const hasAutoSubmitted = useRef(false);

  useEffect(() => {
    if (quiz && timeLeft === null && attempt?.status === "in_progress") {
      const startedAt = new Date(attempt.startedAt).getTime();
      const durationMs = quiz.duration * 60 * 1000;
      const now = Date.now();
      const remaining = Math.max(0, Math.floor((startedAt + durationMs - now) / 1000));
      setTimeLeft(remaining);
    }
  }, [quiz, attempt, timeLeft]);

  useEffect(() => {
    if (timeLeft === null || timeLeft <= 0 || attempt?.status !== "in_progress") return;
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev === null) return null;
        if (prev <= 1) {
          clearInterval(timer);
          if (!hasAutoSubmitted.current) {
            hasAutoSubmitted.current = true;
            toast.error("Time is up! Submitting your attempt.");
            handleSubmit();
          }
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [timeLeft, attempt?.status]);

  const handleAnswerChange = (questionId: number, value: string) => {
    setAnswers((prev) => ({ ...prev, [questionId]: value }));
  };

  const handleSubmit = async () => {
    if (!attemptId || isSubmitting) return;
    setIsSubmitting(true);

    const formattedAnswers = Object.entries(answers).map(([qId, val]) => ({
      questionId: parseInt(qId, 10),
      userAnswer: val,
    }));

    try {
      await submitAttempt.mutateAsync({ id: attemptId, data: { answers: formattedAnswers } });
      queryClient.invalidateQueries({ queryKey: getGetAttemptQueryKey(attemptId) });
      toast.success("Submitted! Check your results.");
      setLocation(`/attempts/${attemptId}/results`);
    } catch {
      toast.error("Failed to submit attempt. Please try again.");
      setIsSubmitting(false);
    }
  };

  if (!attemptId) {
    setLocation(`/quizzes/${quizId}`);
    return null;
  }

  if (isQuizLoading || isAttemptLoading) {
    return (
      <AppLayout>
        <div className="max-w-3xl mx-auto space-y-6">
          <Skeleton className="h-10 w-1/3" />
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl p-6 shadow-sm">
                <Skeleton className="h-5 w-full mb-4" />
                <div className="space-y-3">
                  {[1, 2, 3, 4].map((j) => <Skeleton key={j} className="h-14 w-full rounded-xl" />)}
                </div>
              </div>
            ))}
          </div>
        </div>
      </AppLayout>
    );
  }

  if (!quiz || !attempt) {
    return (
      <AppLayout>
        <div className="flex flex-col items-center justify-center py-24 text-center">
          <AlertCircle className="h-12 w-12 text-destructive mb-4" />
          <h2 className="text-2xl font-bold">Not Found</h2>
          <p className="text-muted-foreground mt-2 mb-6">Quiz or attempt could not be found.</p>
          <Button onClick={() => setLocation("/quizzes")}>Back to Quizzes</Button>
        </div>
      </AppLayout>
    );
  }

  if (attempt.status === "completed") {
    setLocation(`/attempts/${attemptId}/results`);
    return null;
  }

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, "0")}`;
  };

  const answeredCount = Object.keys(answers).length;
  const totalCount = quiz.questions.length;
  const isUrgent = timeLeft !== null && timeLeft < 60;

  return (
    <AppLayout>
      <div className="max-w-3xl mx-auto flex flex-col gap-6">

        {/* Sticky header */}
        <div className="sticky top-16 z-10 bg-white/95 backdrop-blur rounded-2xl shadow-sm border border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-foreground">{quiz.title}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              <span className="font-semibold text-primary">{answeredCount}</span> of {totalCount} answered
            </p>
          </div>
          <div
            className={`flex items-center gap-2 font-mono text-base font-bold px-4 py-2 rounded-xl border-2 ${
              isUrgent
                ? "text-red-600 border-red-300 bg-red-50 animate-pulse"
                : "text-primary border-primary/30 bg-primary/5"
            }`}
          >
            <Clock className="h-4 w-4" />
            {timeLeft !== null ? formatTime(timeLeft) : "--:--"}
          </div>
        </div>

        {/* Questions panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Panel header */}
          <div
            className="flex items-center gap-3 px-6 py-4 text-white font-bold text-base uppercase tracking-wide"
            style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)" }}
          >
            <CheckCircle2 className="h-5 w-5" />
            Questions:
          </div>

          {/* All questions */}
          <div className="divide-y divide-gray-100">
            {quiz.questions.map((question, qIndex) => {
              let options: string[] = [];
              try {
                if (question.options) options = JSON.parse(question.options);
              } catch {}

              const selectedAnswer = answers[question.id];

              return (
                <div key={question.id} className="p-6">
                  {/* Question label + text */}
                  <div className="flex items-start gap-3 mb-5">
                    <span
                      className="inline-flex items-center justify-center h-7 px-3 rounded-full text-white text-xs font-bold shrink-0 mt-0.5"
                      style={{ background: "#10b8a6" }}
                    >
                      Q{qIndex + 1}
                    </span>
                    <p className="text-base font-semibold text-foreground leading-relaxed">
                      {question.questionText}
                    </p>
                  </div>

                  {/* Options */}
                  {question.questionType === "multiple_choice" ? (
                    <div className="space-y-3">
                      {options.map((opt, i) => {
                        const isSelected = selectedAnswer === opt;
                        return (
                          <button
                            key={i}
                            type="button"
                            onClick={() => handleAnswerChange(question.id, opt)}
                            className={`w-full flex items-center gap-4 px-4 py-3.5 rounded-2xl border-2 text-left transition-all cursor-pointer ${
                              isSelected
                                ? "border-primary bg-primary/8"
                                : "border-gray-200 bg-white hover:border-primary/40 hover:bg-gray-50"
                            }`}
                            style={isSelected ? { background: "rgba(16,184,166,0.08)", borderColor: "#10b8a6" } : {}}
                          >
                            {/* Letter badge */}
                            <div
                              className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-sm font-bold transition-colors ${
                                isSelected
                                  ? "text-white"
                                  : "bg-gray-100 text-gray-500"
                              }`}
                              style={isSelected ? { background: "#10b8a6" } : {}}
                            >
                              {OPTION_LABELS[i]}
                            </div>
                            {/* Option text */}
                            <span
                              className={`flex-1 text-sm font-medium ${
                                isSelected ? "text-foreground font-semibold" : "text-gray-700"
                              }`}
                            >
                              {opt}
                            </span>
                            {/* Checkmark on the right when selected */}
                            {isSelected && (
                              <CheckCircle2
                                className="h-5 w-5 shrink-0"
                                style={{ color: "#10b8a6" }}
                              />
                            )}
                          </button>
                        );
                      })}
                    </div>
                  ) : (
                    <Textarea
                      value={answers[question.id] || ""}
                      onChange={(e) => handleAnswerChange(question.id, e.target.value)}
                      placeholder="Type your answer here..."
                      className="min-h-[100px] resize-y rounded-xl border-2 border-gray-200 focus:border-primary/50 text-sm"
                    />
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Submit */}
        <div className="flex flex-col items-center gap-3 pb-8">
          {answeredCount < totalCount && (
            <p className="text-sm text-muted-foreground">
              {totalCount - answeredCount} question(s) unanswered — you can still submit.
            </p>
          )}
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            size="lg"
            className="px-10 h-13 text-base font-bold rounded-2xl shadow-lg transition-all hover:scale-105 disabled:opacity-60 uppercase tracking-wide"
            style={{ background: "linear-gradient(135deg, #10b8a6, #0d9488)", color: "white", border: "none" }}
          >
            {isSubmitting ? (
              <>
                <div className="h-5 w-5 mr-2 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <Send className="h-5 w-5 mr-2" />
                Submit Quiz
              </>
            )}
          </Button>
        </div>
      </div>
    </AppLayout>
  );
}
