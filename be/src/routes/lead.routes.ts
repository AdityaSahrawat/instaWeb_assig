import { Router } from "express";
import type { Router as ExpressRouter } from "express";
import {
  createLead,
  deleteLead,
  getLeads,
  getLeadStats,
  updateLead,
} from "../controllers/lead.controller.js";

export const leadRouter: ExpressRouter = Router();

leadRouter.get("/stats", getLeadStats);
leadRouter.get("/", getLeads);
leadRouter.post("/", createLead);
leadRouter.put("/:id", updateLead);
leadRouter.delete("/:id", deleteLead);
