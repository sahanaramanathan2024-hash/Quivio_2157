import { pgTable, text, serial, timestamp, integer, real, boolean } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { attemptsTable } from "./attempts";
import { questionsTable } from "./questions";

export const answersTable = pgTable("answers", {
  id: serial("id").primaryKey(),
  attemptId: integer("attempt_id").notNull().references(() => attemptsTable.id, { onDelete: "cascade" }),
  questionId: integer("question_id").notNull().references(() => questionsTable.id, { onDelete: "cascade" }),
  userAnswer: text("user_answer").notNull(),
  isCorrect: boolean("is_correct"),
  pointsEarned: real("points_earned"),
  aiFeedback: text("ai_feedback"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertAnswerSchema = createInsertSchema(answersTable).omit({ id: true, createdAt: true });
export type InsertAnswer = z.infer<typeof insertAnswerSchema>;
export type Answer = typeof answersTable.$inferSelect;
