import cors from "cors";
import express from "express";
import type { Express } from "express";
import { leadRouter } from "./routes/lead.routes.js";

export const app: Express = express();

app.use(cors());
app.use(express.json());

app.get("/health", (_request, response) => {
  response.json({ success: true, message: "Lead Management CRM API is running." });
});

app.use("/api/leads", leadRouter);

app.use((_request, response) => {
  response.status(404).json({ success: false, message: "Route not found." });
});
