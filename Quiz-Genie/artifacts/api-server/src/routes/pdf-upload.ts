import { Router, type IRouter, type Request, type Response } from "express";
import multer from "multer";
import { db, quizzesTable, questionsTable } from "@workspace/db";
import { requireAuth } from "../lib/auth";
import { openai } from "@workspace/integrations-openai-ai-server";

const router: IRouter = Router();

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB max
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf") {
      cb(null, true);
    } else {
      cb(new Error("Only PDF files are allowed"));
    }
  },
});

router.post(
  "/quizzes/create-from-pdf",
  requireAuth,
  upload.single("pdf"),
  async (req: Request, res: Response): Promise<void> => {
    const userId = (req as any).userId;

    if (!req.file) {
      res.status(400).json({ error: "No PDF file uploaded" });
      return;
    }

    const title = req.body.title as string;
    const difficulty = (req.body.difficulty as string) || "medium";
    const questionCount = parseInt(req.body.questionCount as string, 10) || 10;
    const duration = parseInt(req.body.duration as string, 10) || 15;
    const questionType = (req.body.questionType as string) || "multiple_choice";

    if (!title) {
      res.status(400).json({ error: "Title is required" });
      return;
    }

    let pdfText = "";
    try {
      const pdfParse = (globalThis as any).require("pdf-parse");
      const parsed = await pdfParse(req.file.buffer);
      pdfText = parsed.text?.trim() ?? "";
    } catch (err) {
      res.status(422).json({ error: "Could not extract text from PDF. Make sure the PDF contains readable text." });
      return;
    }

    if (!pdfText || pdfText.length < 50) {
      res.status(422).json({ error: "PDF appears to have no readable text content. Please upload a text-based PDF." });
      return;
    }

    // Trim PDF text if too long (OpenAI has token limits)
    const trimmedText = pdfText.slice(0, 12000);

    // Create the quiz
    const [quiz] = await db.insert(quizzesTable).values({
      title,
      topic: `PDF: ${req.file.originalname}`,
      description: `Generated from uploaded PDF: ${req.file.originalname}`,
      difficulty: difficulty as any,
      questionCount,
      duration,
      questionType: questionType as any,
      status: "draft",
      createdBy: userId,
    }).returning();

    // Generate questions from PDF content
    const qtLabel =
      questionType === "multiple_choice"
        ? "multiple-choice questions with exactly 4 options each"
        : questionType === "short_answer"
        ? "short-answer questions"
        : `a mix of multiple-choice (with 4 options) and short-answer questions, totaling`;

    const prompt = `You are an expert educator. Based on the following document content, generate exactly ${questionCount} ${qtLabel} at ${difficulty} difficulty level.

DOCUMENT CONTENT:
${trimmedText}

Return ONLY a valid JSON array with no extra text. Each element must match this schema:
- questionText: string (the question)
- questionType: "multiple_choice" | "short_answer"
- options: string[] | null (for multiple_choice: exactly 4 options; for short_answer: null)
- correctAnswer: string (the correct answer; for MC must exactly match one option)
- explanation: string (brief explanation of the correct answer)

Example format:
[
  {
    "questionText": "What is X?",
    "questionType": "multiple_choice",
    "options": ["A", "B", "C", "D"],
    "correctAnswer": "A",
    "explanation": "Because..."
  }
]`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [{ role: "user", content: prompt }],
    });

    const raw = completion.choices[0]?.message?.content ?? "[]";
    let generated: any[] = [];
    try {
      const jsonMatch = raw.match(/\[[\s\S]*\]/);
      generated = JSON.parse(jsonMatch ? jsonMatch[0] : raw);
    } catch {
      generated = [];
    }

    if (generated.length === 0) {
      res.status(500).json({ error: "AI failed to generate questions from the PDF content." });
      return;
    }

    const questionsToInsert = generated.slice(0, questionCount).map((q: any) => ({
      quizId: quiz.id,
      questionText: q.questionText,
      questionType: q.questionType ?? questionType,
      options: q.options ? JSON.stringify(q.options) : null,
      correctAnswer: q.correctAnswer,
      explanation: q.explanation ?? "",
      difficulty: difficulty as any,
    }));

    await db.insert(questionsTable).values(questionsToInsert);
    await db.update(quizzesTable).set({ questionCount: questionsToInsert.length }).returning();

    res.status(201).json({ id: quiz.id, title: quiz.title, questionCount: questionsToInsert.length });
  }
);

export default router;
