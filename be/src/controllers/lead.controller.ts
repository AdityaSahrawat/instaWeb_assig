import type { Request, Response } from "express";
import type { LeadStatus, Prisma } from "../../generated/prisma/client.js";
import { prisma } from "../prisma/client.js";
import { LEAD_STATUSES } from "../types/lead.types.js";
import type { LeadBody, LeadListQuery, LeadStats } from "../types/lead.types.js";

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function sendError(response: Response, statusCode: number, message: string) {
  return response.status(statusCode).json({ success: false, message });
}

function cleanText(value: unknown): string | undefined {
  return typeof value === "string" ? value.trim() : undefined;
}

function isLeadStatus(value: unknown): value is LeadStatus {
  return typeof value === "string" && LEAD_STATUSES.includes(value as LeadStatus);
}

function fieldLabel(field: string): string {
  return `${field.charAt(0).toUpperCase()}${field.slice(1)}`;
}

function validateCreateLead(body: LeadBody): { valid: true } | { valid: false; message: string } {
  const name = cleanText(body.name);
  const email = cleanText(body.email);
  const phone = cleanText(body.phone);
  const company = cleanText(body.company);

  if (!name) return { valid: false, message: "Name is required." };
  if (!email) return { valid: false, message: "Email is required." };
  if (!phone) return { valid: false, message: "Phone is required." };
  if (!company) return { valid: false, message: "Company is required." };
  if (!emailPattern.test(email)) return { valid: false, message: "Enter a valid email address." };
  if (body.status !== undefined && !isLeadStatus(body.status)) {
    return { valid: false, message: "Status must be NEW, CONTACTED, QUALIFIED, CONVERTED, or LOST." };
  }

  return { valid: true };
}

function validateUpdateLead(body: LeadBody): { valid: true } | { valid: false; message: string } {
  const fields: Array<keyof LeadBody> = ["name", "email", "phone", "company", "status", "notes"];
  const hasUpdate = fields.some((field) => body[field] !== undefined);

  if (!hasUpdate) return { valid: false, message: "Provide at least one field to update." };

  for (const field of ["name", "email", "phone", "company"] as const) {
    if (body[field] !== undefined && !cleanText(body[field])) {
      return { valid: false, message: `${fieldLabel(field)} cannot be empty.` };
    }
  }

  const email = cleanText(body.email);
  if (email !== undefined && !emailPattern.test(email)) {
    return { valid: false, message: "Enter a valid email address." };
  }

  if (body.status !== undefined && !isLeadStatus(body.status)) {
    return { valid: false, message: "Status must be NEW, CONTACTED, QUALIFIED, CONVERTED, or LOST." };
  }

  return { valid: true };
}

function parsePositiveInt(value: string | undefined, fallback: number, max: number): number {
  const parsed = Number(value);
  if (!Number.isInteger(parsed) || parsed < 1) return fallback;
  return Math.min(parsed, max);
}

function buildLeadWhere(query: LeadListQuery): Prisma.LeadWhereInput {
  const where: Prisma.LeadWhereInput = {};
  const search = cleanText(query.search);

  if (search) {
    where.OR = [
      { name: { contains: search, mode: "insensitive" } },
      { email: { contains: search, mode: "insensitive" } },
      { company: { contains: search, mode: "insensitive" } },
    ];
  }

  if (isLeadStatus(query.status)) {
    where.status = query.status;
  }

  return where;
}

export async function createLead(request: Request<object, object, LeadBody>, response: Response) {
  try {
    const validation = validateCreateLead(request.body);
    if (!validation.valid) return sendError(response, 400, validation.message);

    const lead = await prisma.lead.create({
      data: {
        name: cleanText(request.body.name) ?? "",
        email: cleanText(request.body.email) ?? "",
        phone: cleanText(request.body.phone) ?? "",
        company: cleanText(request.body.company) ?? "",
        status: request.body.status ?? "NEW",
        notes: cleanText(request.body.notes) ?? "",
      },
    });

    return response.status(201).json({ success: true, data: lead });
  } catch (error) {
    console.error("Create lead failed:", error);
    return sendError(response, 500, "Unable to create lead. Please try again.");
  }
}

export async function getLeads(
  request: Request<object, object, object, LeadListQuery>,
  response: Response,
) {
  try {
    if (request.query.status && !isLeadStatus(request.query.status)) {
      return sendError(response, 400, "Status must be NEW, CONTACTED, QUALIFIED, CONVERTED, or LOST.");
    }

    const page = parsePositiveInt(request.query.page, 1, 10_000);
    const limit = parsePositiveInt(request.query.limit, 10, 100);
    const where = buildLeadWhere(request.query);
    const [data, total] = await Promise.all([
      prisma.lead.findMany({
        where,
        orderBy: { createdAt: "desc" },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.lead.count({ where }),
    ]);

    return response.json({
      success: true,
      data,
      total,
      page,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    });
  } catch (error) {
    console.error("Get leads failed:", error);
    return sendError(response, 500, "Unable to load leads. Please try again.");
  }
}

export async function getLeadStats(_request: Request, response: Response) {
  try {
    const grouped = await prisma.lead.groupBy({
      by: ["status"],
      _count: { status: true },
    });

    const stats: LeadStats = {
      total: 0,
      new: 0,
      contacted: 0,
      qualified: 0,
      converted: 0,
      lost: 0,
    };

    for (const group of grouped) {
      const count = group._count.status;
      stats.total += count;

      if (group.status === "NEW") stats.new = count;
      if (group.status === "CONTACTED") stats.contacted = count;
      if (group.status === "QUALIFIED") stats.qualified = count;
      if (group.status === "CONVERTED") stats.converted = count;
      if (group.status === "LOST") stats.lost = count;
    }

    return response.json({ success: true, data: stats });
  } catch (error) {
    console.error("Get lead stats failed:", error);
    return sendError(response, 500, "Unable to load lead statistics. Please try again.");
  }
}

export async function updateLead(request: Request<{ id: string }, object, LeadBody>, response: Response) {
  try {
    const validation = validateUpdateLead(request.body);
    if (!validation.valid) return sendError(response, 400, validation.message);

    const data: Prisma.LeadUpdateInput = {};

    const name = cleanText(request.body.name);
    const email = cleanText(request.body.email);
    const phone = cleanText(request.body.phone);
    const company = cleanText(request.body.company);

    if (name !== undefined) data.name = name;
    if (email !== undefined) data.email = email;
    if (phone !== undefined) data.phone = phone;
    if (company !== undefined) data.company = company;
    if (request.body.status !== undefined) data.status = request.body.status;
    if (request.body.notes !== undefined) data.notes = cleanText(request.body.notes) ?? "";

    const lead = await prisma.lead.update({
      where: { id: request.params.id },
      data,
    });

    return response.json({ success: true, data: lead });
  } catch (error) {
    const maybePrismaError = error as { code?: string };
    if (maybePrismaError.code === "P2025") {
      return sendError(response, 404, "Lead not found.");
    }

    console.error("Update lead failed:", error);
    return sendError(response, 500, "Unable to update lead. Please try again.");
  }
}

export async function deleteLead(request: Request<{ id: string }>, response: Response) {
  try {
    await prisma.lead.delete({ where: { id: request.params.id } });
    return response.json({ success: true, message: "Lead deleted successfully." });
  } catch (error) {
    const maybePrismaError = error as { code?: string };
    if (maybePrismaError.code === "P2025") {
      return sendError(response, 404, "Lead not found.");
    }

    console.error("Delete lead failed:", error);
    return sendError(response, 500, "Unable to delete lead. Please try again.");
  }
}
