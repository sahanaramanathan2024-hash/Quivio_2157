import { Router, type IRouter } from "express";
import { eq, desc, and } from "drizzle-orm";
import { db, quizzesTable, questionsTable } from "@workspace/db";
import {
  ListQuizzesQueryParams,
  CreateQuizBody,
  GetQuizParams,
  UpdateQuizParams,
  UpdateQuizBody,
  DeleteQuizParams,
  GenerateQuizQuestionsParams,
  GenerateQuizQuestionsBody,
  PublishQuizParams,
} from "@workspace/api-zod";
import { requireAuth } from "../lib/auth";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

router.get("/quizzes", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = ListQuizzesQueryParams.safeParse(req.query);
  const quizzes = await db.select().from(quizzesTable).orderBy(desc(quizzesTable.createdAt));
  const mapped = quizzes.map((q) => ({
    ...q,
    description: q.description ?? null,
  }));
  res.json(mapped);
});

router.post("/quizzes", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const parsed = CreateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [quiz] = await db.insert(quizzesTable).values({
    ...parsed.data,
    createdBy: userId,
    description: parsed.data.description ?? null,
  }).returning();
  res.status(201).json({ ...quiz, description: quiz.description ?? null });
});

router.get("/quizzes/:id", requireAuth, async (req, res): Promise<void> => {
  const params = GetQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, params.data.id));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  const questions = await db.select().from(questionsTable)
    .where(eq(questionsTable.quizId, quiz.id))
    .orderBy(questionsTable.orderIndex);
  res.json({
    ...quiz,
    description: quiz.description ?? null,
    questions: questions.map((q) => ({ ...q, options: q.options ?? null })),
  });
});

router.patch("/quizzes/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = UpdateQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = UpdateQuizBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [quiz] = await db.update(quizzesTable)
    .set({ ...parsed.data, updatedAt: new Date() })
    .where(and(eq(quizzesTable.id, params.data.id), eq(quizzesTable.createdBy, userId)))
    .returning();
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  res.json({ ...quiz, description: quiz.description ?? null });
});

router.delete("/quizzes/:id", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = DeleteQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  await db.delete(quizzesTable).where(and(eq(quizzesTable.id, params.data.id), eq(quizzesTable.createdBy, userId)));
  res.sendStatus(204);
});

router.post("/quizzes/:id/generate", requireAuth, async (req, res): Promise<void> => {
  const params = GenerateQuizQuestionsParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const parsed = GenerateQuizQuestionsBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }
  const [quiz] = await db.select().from(quizzesTable).where(eq(quizzesTable.id, params.data.id));
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }

  const { count, questionType, additionalContext } = parsed.data;
  const qType = questionType === "mixed" ? "a mix of multiple-choice and short-answer" : questionType === "multiple_choice" ? "multiple-choice" : "short-answer";

  const systemPrompt = `You are an expert quiz generator for educational platforms. Generate exactly ${count} ${qType} questions on the topic of "${quiz.topic}" at ${quiz.difficulty} difficulty level.

For MULTIPLE CHOICE questions:
- Provide exactly 4 options as a JSON array of strings
- Make the question text clear and unambiguous
- Provide the exact correct answer text (matching one of the options exactly)
- Provide a brief explanation

For SHORT ANSWER questions:
- Provide a concise expected answer (1-3 words or a short phrase)
- The options field should be null
- Provide a brief explanation

Respond ONLY with a valid JSON array of question objects. Each object must have:
{
  "questionText": "...",
  "questionType": "multiple_choice" or "short_answer",
  "options": ["A", "B", "C", "D"] or null,
  "correctAnswer": "...",
  "explanation": "..."
}`;

  const userPrompt = `Generate ${count} questions${additionalContext ? `. Additional context: ${additionalContext}` : ""}.`;

  const completion = await openai.chat.completions.create({
    model: "gpt-5.2",
    max_completion_tokens: 8192,
    messages: [
      { role: "system", content: systemPrompt },
      { role: "user", content: userPrompt },
    ],
  });

  const rawContent = completion.choices[0]?.message?.content ?? "[]";

  let generatedQuestions: Array<{
    questionText: string;
    questionType: string;
    options: string[] | null;
    correctAnswer: string;
    explanation: string;
  }>;

  try {
    const jsonMatch = rawContent.match(/\[[\s\S]*\]/);
    generatedQuestions = JSON.parse(jsonMatch ? jsonMatch[0] : rawContent);
  } catch {
    res.status(500).json({ error: "Failed to parse AI-generated questions" });
    return;
  }

  await db.delete(questionsTable).where(eq(questionsTable.quizId, quiz.id));

  const inserted = await db.insert(questionsTable).values(
    generatedQuestions.map((q, i) => ({
      quizId: quiz.id,
      questionText: q.questionText,
      questionType: q.questionType,
      options: q.options ? JSON.stringify(q.options) : null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation,
      orderIndex: i,
    }))
  ).returning();

  await db.update(quizzesTable).set({ questionCount: inserted.length, updatedAt: new Date() }).where(eq(quizzesTable.id, quiz.id));

  res.json(inserted.map((q) => ({ ...q, options: q.options ?? null })));
});

router.post("/quizzes/:id/publish", requireAuth, async (req, res): Promise<void> => {
  const userId = (req as any).userId;
  const params = PublishQuizParams.safeParse(req.params);
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }
  const [quiz] = await db.update(quizzesTable)
    .set({ status: "published", updatedAt: new Date() })
    .where(and(eq(quizzesTable.id, params.data.id), eq(quizzesTable.createdBy, userId)))
    .returning();
  if (!quiz) {
    res.status(404).json({ error: "Quiz not found" });
    return;
  }
  res.json({ ...quiz, description: quiz.description ?? null });
});

export default router;
