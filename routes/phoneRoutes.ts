import { Router } from "express";
import { getPhoneNumber, getPhoneNumberNonBlocking, getExecutionLog, getTranscriptByPhoneNumber } from "../controllers/phoneController.ts";

const phoneRouter = Router();

phoneRouter.post("/number", getPhoneNumber);
phoneRouter.post("/number-nonblocking", getPhoneNumberNonBlocking);
phoneRouter.get("/executions/:executionId", getExecutionLog);
phoneRouter.get("/transcript/:phoneNumber", getTranscriptByPhoneNumber);

export default phoneRouter;


