import type { LeadStatus } from "../../generated/prisma/enums.js";

export const LEAD_STATUSES = [
  "NEW",
  "CONTACTED",
  "QUALIFIED",
  "CONVERTED",
  "LOST",
] as const satisfies readonly LeadStatus[];

export interface LeadBody {
  name?: string;
  email?: string;
  phone?: string;
  company?: string;
  status?: LeadStatus;
  notes?: string;
}

export interface LeadListQuery {
  search?: string;
  status?: string;
  page?: string;
  limit?: string;
}

export interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
}
