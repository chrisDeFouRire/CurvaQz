import type { Handler } from "hono";
import { ensureSession } from "./session";
import type { WorkerEnv } from "../types/worker";
import { getQuiz } from "../lib/leaderboard";
import { reviveStoredQuizPayload } from "./quiz";

export const handleGetQuiz: Handler<{ Bindings: WorkerEnv }> = async (c) => {
  const quizId = c.req.param("quizId");
  if (!quizId) return c.json({ error: "Missing quiz id" }, 400);

  const sessionResult = await ensureSession(c, { createIfMissing: true, replaceRevoked: false });
  if (sessionResult.type === "error") return sessionResult.response;

  const quiz = await getQuiz(c.env.DB, quizId);
  if (!quiz) {
    return c.json({ error: "Quiz not found" }, 404);
  }

  if (!quiz.payload) {
    return c.json({ error: "Quiz payload unavailable" }, 404);
  }

  const stored = reviveStoredQuizPayload(JSON.parse(quiz.payload));
  if (!stored) {
    console.error("quiz.get.invalid_payload", { quizId });
    return c.json({ error: "Quiz data invalid" }, 500);
  }

  return c.json({
    quizId: stored.quizId,
    sessionId: sessionResult.value.session.id,
    source: stored.source,
    metadata: stored.metadata,
    questions: stored.questions
  });
};
