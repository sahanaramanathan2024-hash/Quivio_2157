import { pgTable, text, serial, timestamp, integer, real } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";
import { quizzesTable } from "./quizzes";

export const attemptsTable = pgTable("attempts", {
  id: serial("id").primaryKey(),
  quizId: integer("quiz_id").notNull().references(() => quizzesTable.id, { onDelete: "cascade" }),
  userId: text("user_id").notNull(),
  score: real("score"),
  maxScore: integer("max_score"),
  percentage: real("percentage"),
  status: text("status").notNull().default("in_progress"),
  feedback: text("feedback"),
  startedAt: timestamp("started_at", { withTimezone: true }).notNull().defaultNow(),
  completedAt: timestamp("completed_at", { withTimezone: true }),
});

export const insertAttemptSchema = createInsertSchema(attemptsTable).omit({ id: true, startedAt: true });
export type InsertAttempt = z.infer<typeof insertAttemptSchema>;
export type Attempt = typeof attemptsTable.$inferSelect;
