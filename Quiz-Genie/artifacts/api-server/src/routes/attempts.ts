import { Router, type IRouter } from "express";
import { eq, and } from "drizzle-orm";
import { db, attemptsTable, answersTable, questionsTable, quizzesTable } from "@workspace/db";
import {
  CreateAttemptBody,
  GetAttemptParams,
  SubmitAttemptParams,
  SubmitAttemptBody,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/attempts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const attempts = await db
    .select({
      id: attemptsTable.id,
      quizId: attemptsTable.quizId,
      userId: attemptsTable.userId,
      score: attemptsTable.score,
      maxScore: attemptsTable.maxScore,
      percentage: attemptsTable.percentage,
      status: attemptsTable.status,
      feedback: attemptsTable.feedback,
      startedAt: attemptsTable.startedAt,
      completedAt: attemptsTable.completedAt,
      quizTitle: quizzesTable.title,
    })
    .from(attemptsTable)
    .leftJoin(quizzesTable, eq(attemptsTable.quizId, quizzesTable.id))
    .where(eq(attemptsTable.userId, userId))
    .orderBy(attemptsTable.startedAt);
  res.json(attempts.map(a => ({
    ...a,
    score: a.score ?? null,
    maxScore: a.maxScore ?? null,
    percentage: a.percentage ?? null,
    feedback: a.feedback ?? null,
    completedAt: a.completedAt ?? null,
    quizTitle: a.quizTitle ?? null,
  })));
});

router.post("/attempts", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const parsed = CreateAttemptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [attempt] = await db.insert(attemptsTable).values({
    quizId: parsed.data.quizId,
    userId,
    status: "in_progress",
  }).returning();
  res.status(201).json({
    ...attempt,
    score: attempt.score ?? null,
    maxScore: attempt.maxScore ?? null,
    percentage: attempt.percentage ?? null,
    feedback: attempt.feedback ?? null,
    completedAt: attempt.completedAt ?? null,
    quizTitle: null,
  });
});

router.get("/attempts/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = GetAttemptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [attempt] = await db
    .select({
      id: attemptsTable.id,
      quizId: attemptsTable.quizId,
      userId: attemptsTable.userId,
      score: attemptsTable.score,
      maxScore: attemptsTable.maxScore,
      percentage: attemptsTable.percentage,
      status: attemptsTable.status,
      feedback: attemptsTable.feedback,
      startedAt: attemptsTable.startedAt,
      completedAt: attemptsTable.completedAt,
      quizTitle: quizzesTable.title,
    })
    .from(attemptsTable)
    .leftJoin(quizzesTable, eq(attemptsTable.quizId, quizzesTable.id))
    .where(eq(attemptsTable.id, params.data.id));

  if (!attempt) {
    res.status(404).json({ error: "Attempt not found" });
    return;
  }

  const answers = await db
    .select({
      id: answersTable.id,
      attemptId: answersTable.attemptId,
      questionId: answersTable.questionId,
      userAnswer: answersTable.userAnswer,
      isCorrect: answersTable.isCorrect,
      pointsEarned: answersTable.pointsEarned,
      aiFeedback: answersTable.aiFeedback,
      questionText: questionsTable.questionText,
      correctAnswer: questionsTable.correctAnswer,
      explanation: questionsTable.explanation,
    })
    .from(answersTable)
    .leftJoin(questionsTable, eq(answersTable.questionId, questionsTable.id))
    .where(eq(answersTable.attemptId, attempt.id));

  res.json({
    ...attempt,
    score: attempt.score ?? null,
    maxScore: attempt.maxScore ?? null,
    percentage: attempt.percentage ?? null,
    feedback: attempt.feedback ?? null,
    completedAt: attempt.completedAt ?? null,
    quizTitle: attempt.quizTitle ?? null,
    answers: answers.map(a => ({
      ...a,
      isCorrect: a.isCorrect ?? null,
      pointsEarned: a.pointsEarned ?? null,
      aiFeedback: a.aiFeedback ?? null,
      questionText: a.questionText ?? null,
      correctAnswer: a.correctAnswer ?? null,
      explanation: a.explanation ?? null,
    })),
  });
});

router.post("/attempts/:id/submit", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = SubmitAttemptParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = SubmitAttemptBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const [attempt] = await db.select().from(attemptsTable)
    .where(and(eq(attemptsTable.id, params.data.id), eq(attemptsTable.userId, userId)));
  if (!attempt) {
    res.status(404).json({ error: "Attempt not found" });
    return;
  }

  const questions = await db.select().from(questionsTable)
    .where(eq(questionsTable.quizId, attempt.quizId));

  const questionMap = new Map(questions.map(q => [q.id, q]));

  const evaluatedAnswers: Array<{
    questionId: number;
    userAnswer: string;
    isCorrect: boolean;
    pointsEarned: number;
    aiFeedback: string;
  }> = [];

  const mcAnswers = parsed.data.answers.filter(a => {
    const q = questionMap.get(a.questionId);
    return q?.questionType === "multiple_choice";
  });
  const saAnswers = parsed.data.answers.filter(a => {
    const q = questionMap.get(a.questionId);
    return q?.questionType === "short_answer";
  });

  for (const ans of mcAnswers) {
    const q = questionMap.get(ans.questionId);
    if (!q) continue;
    const isCorrect = ans.userAnswer.trim().toLowerCase() === q.correctAnswer.trim().toLowerCase();
    evaluatedAnswers.push({
      questionId: ans.questionId,
      userAnswer: ans.userAnswer,
      isCorrect,
      pointsEarned: isCorrect ? 1 : 0,
      aiFeedback: isCorrect ? "Correct!" : `Incorrect. The correct answer is: ${q.correctAnswer}. ${q.explanation}`,
    });
  }

  if (saAnswers.length > 0) {
    const evalPrompt = saAnswers.map(ans => {
      const q = questionMap.get(ans.questionId);
      return `Question: "${q?.questionText}"\nExpected Answer: "${q?.correctAnswer}"\nStudent Answer: "${ans.userAnswer}"\nExplanation: "${q?.explanation}"`;
    }).join("\n\n---\n\n");

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 4096,
      messages: [
        {
          role: "system",
          content: `You are an expert educational evaluator. For each short-answer question below, evaluate the student's answer and respond with a JSON array where each element has:
{
  "isCorrect": boolean (true if the student's answer is essentially correct),
  "pointsEarned": number (0 to 1, can be partial credit like 0.5),
  "feedback": "Brief, constructive feedback explaining if correct/incorrect and why"
}
Respond ONLY with the JSON array, no other text.`,
        },
        { role: "user", content: evalPrompt },
      ],
    });

    const rawContent = completion.choices[0]?.message?.content ?? "[]";
    let evalResults: Array<{ isCorrect: boolean; pointsEarned: number; feedback: string }> = [];
    try {
      const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
      evalResults = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
    } catch {
      evalResults = saAnswers.map(() => ({ isCorrect: false, pointsEarned: 0, feedback: "Could not evaluate answer." }));
    }

    saAnswers.forEach((ans, i) => {
      const evalResult = evalResults[i] ?? { isCorrect: false, pointsEarned: 0, feedback: "Could not evaluate answer." };
      evaluatedAnswers.push({
        questionId: ans.questionId,
        userAnswer: ans.userAnswer,
        isCorrect: evalResult.isCorrect,
        pointsEarned: evalResult.pointsEarned,
        aiFeedback: evalResult.feedback,
      });
    });
  }

  await db.insert(answersTable).values(
    evaluatedAnswers.map(a => ({
      attemptId: attempt.id,
      questionId: a.questionId,
      userAnswer: a.userAnswer,
      isCorrect: a.isCorrect,
      pointsEarned: a.pointsEarned,
      aiFeedback: a.aiFeedback,
    }))
  );

  const totalScore = evaluatedAnswers.reduce((sum, a) => sum + a.pointsEarned, 0);
  const maxScore = evaluatedAnswers.length;
  const percentage = maxScore > 0 ? (totalScore / maxScore) * 100 : 0;

  const wrongQuestions = evaluatedAnswers
    .filter(a => !a.isCorrect)
    .map(a => {
      const q = questionMap.get(a.questionId);
      return q?.questionText ?? "";
    })
    .filter(Boolean)
    .slice(0, 5);

  const correctQuestions = evaluatedAnswers
    .filter(a => a.isCorrect)
    .map(a => {
      const q = questionMap.get(a.questionId);
      return q?.questionText ?? "";
    })
    .filter(Boolean)
    .slice(0, 5);

  const feedbackPrompt = `A student just completed a quiz and scored ${percentage.toFixed(1)}% (${totalScore} out of ${maxScore} questions correct).

Questions answered correctly (sample): ${correctQuestions.join("; ") || "none"}
Questions answered incorrectly (sample): ${wrongQuestions.join("; ") || "none"}

Generate a personalized quiz result analysis as a JSON object with these exact fields:
{
  "headline": "A short 2-4 word result label (e.g. 'Great Job!', 'Good Effort!', 'Needs Practice')",
  "summary": "One encouraging sentence summarizing their performance",
  "strengths": "One sentence describing what topics/concepts they clearly understand well",
  "improvements": "One sentence describing specific topics or areas they should review",
  "nextSteps": ["step 1", "step 2", "step 3"]
}

Respond ONLY with the JSON object, no extra text.`;

  const feedbackCompletion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 512,
    messages: [{ role: "user", content: feedbackPrompt }],
  });

  const rawFeedback = feedbackCompletion.choices[0]?.message?.content ?? "{}";
  let actionPlan: { headline: string; summary: string; strengths: string; improvements: string; nextSteps: string[] } | null = null;
  try {
    const jsonMatch = rawFeedback.match(/\{[\s\S]*\}/);
    actionPlan = JSON.parse(jsonMatch ? jsonMatch[0] : rawFeedback);
  } catch {
    actionPlan = null;
  }

  const feedback = actionPlan
    ? JSON.stringify(actionPlan)
    : JSON.stringify({
        headline: percentage >= 60 ? "Good Effort!" : "Keep Practicing!",
        summary: `You scored ${percentage.toFixed(0)}% on this quiz.`,
        strengths: "You showed understanding of several key concepts.",
        improvements: "Review the questions you missed to strengthen your knowledge.",
        nextSteps: ["Review incorrect answers", "Re-read your study materials", "Try the quiz again"],
      });

  const [updatedAttempt] = await db.update(attemptsTable).set({
    score: totalScore,
    maxScore,
    percentage,
    status: "completed",
    feedback,
    completedAt: new Date(),
  }).where(eq(attemptsTable.id, attempt.id)).returning();

  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, attempt.quizId));

  const insertedAnswers = await db
    .select({
      id: answersTable.id,
      attemptId: answersTable.attemptId,
      questionId: answersTable.questionId,
      userAnswer: answersTable.userAnswer,
      isCorrect: answersTable.isCorrect,
      pointsEarned: answersTable.pointsEarned,
      aiFeedback: answersTable.aiFeedback,
      questionText: questionsTable.questionText,
      correctAnswer: questionsTable.correctAnswer,
      explanation: questionsTable.explanation,
    })
    .from(answersTable)
    .leftJoin(questionsTable, eq(answersTable.questionId, questionsTable.id))
    .where(eq(answersTable.attemptId, attempt.id));

  res.json({
    id: updatedAttempt.id,
    quizId: updatedAttempt.quizId,
    userId: updatedAttempt.userId,
    score: updatedAttempt.score ?? 0,
    maxScore: updatedAttempt.maxScore ?? 0,
    percentage: updatedAttempt.percentage ?? 0,
    status: updatedAttempt.status,
    feedback: updatedAttempt.feedback ?? "",
    startedAt: updatedAttempt.startedAt,
    completedAt: updatedAttempt.completedAt ?? new Date(),
    quizTitle: quiz?.title ?? null,
    answers: insertedAnswers.map(a => ({
      ...a,
      isCorrect: a.isCorrect ?? null,
      pointsEarned: a.pointsEarned ?? null,
      aiFeedback: a.aiFeedback ?? null,
      questionText: a.questionText ?? null,
      correctAnswer: a.correctAnswer ?? null,
      explanation: a.explanation ?? null,
    })),
  });
});

export default router;
