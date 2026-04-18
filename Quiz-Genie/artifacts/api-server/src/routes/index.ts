import { Router, type IRouter } from "express";
import healthRouter from "./health";
import quizzesRouter from "./quizzes";
import questionsRouter from "./questions";
import attemptsRouter from "./attempts";
import dashboardRouter from "./dashboard";
import pdfUploadRouter from "./pdf-upload";

const router: IRouter = Router();

router.use(healthRouter);
router.use(quizzesRouter);
router.use(questionsRouter);
router.use(attemptsRouter);
router.use(dashboardRouter);
router.use(pdfUploadRouter);

export default router;
