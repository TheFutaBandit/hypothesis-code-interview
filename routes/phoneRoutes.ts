import { Router } from "express";
import { getPhoneNumber, getExecutionLog } from "../controllers/phoneController.ts";

const phoneRouter = Router();

phoneRouter.post("/number", getPhoneNumber);
phoneRouter.get("/executions/:executionId/log", getExecutionLog);

export default phoneRouter;


