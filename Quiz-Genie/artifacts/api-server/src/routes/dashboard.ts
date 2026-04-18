import { Router, type IRouter } from "express";
import { eq, count, avg, countDistinct, sql } from "drizzle-orm";
import { db, quizzesTable, attemptsTable, answersTable, questionsTable } from "@workspace/db";
import { GetQuizPerformanceParams } from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";

const router: IRouter = Router();

router.get("/dashboard/stats", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const [totalQuizzesRow] = await db.select({ count: count() }).from(quizzesTable);
  const [totalAttemptsRow] = await db.select({ count: count() }).from(attemptsTable).where(eq(attemptsTable.userId, userId));
  const [avgScoreRow] = await db.select({ avg: avg(attemptsTable.percentage) }).from(attemptsTable).where(eq(attemptsTable.userId, userId));
  const [publishedRow] = await db.select({ count: count() }).from(quizzesTable).where(eq(quizzesTable.status, "published"));
  const [completedRow] = await db.select({ count: count() }).from(attemptsTable).where(eq(attemptsTable.status, "completed"));
  const [activeStudentsRow] = await db.select({ count: countDistinct(attemptsTable.userId) }).from(attemptsTable);

  res.json({
    totalQuizzes: totalQuizzesRow.count,
    totalAttempts: totalAttemptsRow.count,
    averageScore: parseFloat((avgScoreRow.avg ?? "0").toString()),
    publishedQuizzes: publishedRow.count,
    completedAttempts: completedRow.count,
    activeStudents: activeStudentsRow.count,
  });
});

router.get("/dashboard/recent-activity", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;

  const recentAttempts = await db
    .select({
      id: attemptsTable.id,
      status: attemptsTable.status,
      startedAt: attemptsTable.startedAt,
      completedAt: attemptsTable.completedAt,
      percentage: attemptsTable.percentage,
      quizTitle: quizzesTable.title,
    })
    .from(attemptsTable)
    .leftJoin(quizzesTable, eq(attemptsTable.quizId, quizzesTable.id))
    .where(eq(attemptsTable.userId, userId))
    .orderBy(sql`${attemptsTable.startedAt} DESC`)
    .limit(10);

  const recentQuizzes = await db
    .select({
      id: quizzesTable.id,
      title: quizzesTable.title,
      topic: quizzesTable.topic,
      createdAt: quizzesTable.createdAt,
    })
    .from(quizzesTable)
    .orderBy(sql`${quizzesTable.createdAt} DESC`)
    .limit(5);

  const activityItems = [
    ...recentAttempts.map(a => ({
      id: a.id,
      type: a.status === "completed" ? "quiz_completed" as const : "quiz_attempted" as const,
      title: a.quizTitle ?? "Quiz",
      subtitle: a.status === "completed" ? `Scored ${(a.percentage ?? 0).toFixed(1)}%` : "In progress",
      timestamp: a.completedAt ?? a.startedAt,
      score: a.percentage ?? null,
    })),
    ...recentQuizzes.map(q => ({
      id: q.id + 10000,
      type: "quiz_created" as const,
      title: q.title,
      subtitle: `Topic: ${q.topic}`,
      timestamp: q.createdAt,
      score: null,
    })),
  ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()).slice(0, 10);

  res.json(activityItems);
});

router.get("/dashboard/quiz-performance/:quizId", requireAuth, async (req, res): Promise<void> => {
  const params = GetQuizPerformanceParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, params.data.quizId));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const attempts = await db.select().from(attemptsTable)
    .where(eq(attemptsTable.quizId, params.data.quizId));

  const completedAttempts = attempts.filter(a => a.status === "completed");
  const totalAttempts = completedAttempts.length;
  const avgScore = totalAttempts > 0 ? completedAttempts.reduce((s, a) => s + (a.score ?? 0), 0) / totalAttempts : 0;
  const avgPct = totalAttempts > 0 ? completedAttempts.reduce((s, a) => s + (a.percentage ?? 0), 0) / totalAttempts : 0;
  const passRate = totalAttempts > 0 ? completedAttempts.filter(a => (a.percentage ?? 0) >= 60).length / totalAttempts * 100 : 0;

  const questions = await db.select().from(questionsTable).where(eq(questionsTable.quizId, quiz.id));
  const attemptIds = completedAttempts.map(a => a.id);

  const questionStats = await Promise.all(questions.map(async (q) => {
    if (attemptIds.length === 0) {
      return { questionId: q.id, questionText: q.questionText, correctRate: 0, totalAnswers: 0 };
    }
    const answers = await db.select().from(answersTable)
      .where(eq(answersTable.questionId, q.id));
    const relevant = answers.filter(a => attemptIds.includes(a.attemptId));
    const correctCount = relevant.filter(a => a.isCorrect).length;
    return {
      questionId: q.id,
      questionText: q.questionText,
      correctRate: relevant.length > 0 ? (correctCount / relevant.length) * 100 : 0,
      totalAnswers: relevant.length,
    };
  }));

  res.json({
    quizId: quiz.id,
    quizTitle: quiz.title,
    totalAttempts,
    averageScore: avgScore,
    averagePercentage: avgPct,
    passRate,
    questionStats,
  });
});

export default router;
