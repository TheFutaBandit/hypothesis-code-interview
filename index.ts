import express from "express";
import cors from "cors";
import healthRoutes from "./routes/phoneRoutes.ts";
import phoneRouter from "./routes/phoneRoutes.ts";

const app = express();

app.use(express.json());
app.use(cors());

app.use("/api/phone", phoneRouter);

app.get("/", (_req, res) => {
  res.send("Voice AI backend is up");
});

const PORT = Number(process.env.PORT) || 3000;

app.listen(PORT, () => {
  // eslint-disable-next-line no-console
  console.log(`Server listening on http://localhost:${PORT}`);
});

export default app;


