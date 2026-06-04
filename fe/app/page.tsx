"use client";

import { FormEvent, useEffect, useMemo, useState } from "react";

const API_BASE = (process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:4000").replace(/\/$/, "");

const LEAD_STATUSES = ["NEW", "CONTACTED", "QUALIFIED", "CONVERTED", "LOST"] as const;
const STATUS_FILTERS = ["ALL", ...LEAD_STATUSES] as const;

type LeadStatus = (typeof LEAD_STATUSES)[number];
type StatusFilter = (typeof STATUS_FILTERS)[number];

interface Lead {
  id: string;
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
}

interface LeadStats {
  total: number;
  new: number;
  contacted: number;
  qualified: number;
  converted: number;
  lost: number;
}

interface LeadsResponse {
  success: boolean;
  data: Lead[];
  total: number;
  page: number;
  totalPages: number;
  message?: string;
}

interface StatsResponse {
  success: boolean;
  data: LeadStats;
  message?: string;
}

interface MutationResponse {
  success: boolean;
  message?: string;
  data?: Lead;
}

interface LeadFormValues {
  name: string;
  email: string;
  phone: string;
  company: string;
  status: LeadStatus;
  notes: string;
}

const emptyStats: LeadStats = {
  total: 0,
  new: 0,
  contacted: 0,
  qualified: 0,
  converted: 0,
  lost: 0,
};

const emptyForm: LeadFormValues = {
  name: "",
  email: "",
  phone: "",
  company: "",
  status: "NEW",
  notes: "",
};

const statusStyles: Record<LeadStatus, string> = {
  NEW: "bg-sky-50 text-sky-700 ring-sky-200",
  CONTACTED: "bg-amber-50 text-amber-700 ring-amber-200",
  QUALIFIED: "bg-violet-50 text-violet-700 ring-violet-200",
  CONVERTED: "bg-emerald-50 text-emerald-700 ring-emerald-200",
  LOST: "bg-rose-50 text-rose-700 ring-rose-200",
};

const statCards = [
  { label: "Total Leads", key: "total" },
  { label: "New", key: "new" },
  { label: "Contacted", key: "contacted" },
  { label: "Qualified", key: "qualified" },
  { label: "Converted", key: "converted" },
  { label: "Lost", key: "lost" },
] as const;

function readMessage(payload: { message?: string } | undefined, fallback: string) {
  return payload?.message || fallback;
}

function formatDate(value: string) {
  return new Intl.DateTimeFormat("en", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(value));
}

function StatusBadge({ status }: { status: LeadStatus }) {
  return (
    <span className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ring-1 ${statusStyles[status]}`}>
      {status}
    </span>
  );
}

function getInitialForm(lead: Lead | null): LeadFormValues {
  return lead
    ? {
        name: lead.name,
        email: lead.email,
        phone: lead.phone,
        company: lead.company,
        status: lead.status,
        notes: lead.notes ?? "",
      }
    : emptyForm;
}

function LeadModal({
  mode,
  lead,
  onClose,
  onSaved,
}: {
  mode: "create" | "edit";
  lead: Lead | null;
  onClose: () => void;
  onSaved: (message: string) => void;
}) {
  const [form, setForm] = useState<LeadFormValues>(() => getInitialForm(lead));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError("");

    try {
      const endpoint = mode === "create" ? `${API_BASE}/api/leads` : `${API_BASE}/api/leads/${lead?.id}`;
      const response = await fetch(endpoint, {
        method: mode === "create" ? "POST" : "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const payload = (await response.json()) as MutationResponse;

      if (!response.ok || !payload.success) {
        throw new Error(readMessage(payload, "Unable to save lead. Please try again."));
      }

      onSaved(mode === "create" ? "Lead created successfully." : "Lead updated successfully.");
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to save lead. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/55 px-4 py-6">
      <div className="max-h-full w-full max-w-2xl overflow-y-auto rounded-lg bg-white shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-200 px-6 py-5">
          <div>
            <h2 className="text-xl font-semibold text-slate-950">{mode === "create" ? "Add Lead" : "Edit Lead"}</h2>
            <p className="mt-1 text-sm text-slate-500">Capture the details your team needs to follow up.</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="grid h-9 w-9 place-items-center rounded-md text-slate-500 transition hover:bg-slate-100 hover:text-slate-900"
            aria-label="Close modal"
          >
            x
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 px-6 py-6">
          {error ? <div className="rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Name</span>
              <input
                required
                value={form.name}
                onChange={(event) => setForm((current) => ({ ...current, name: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Email</span>
              <input
                required
                type="email"
                value={form.email}
                onChange={(event) => setForm((current) => ({ ...current, email: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Phone</span>
              <input
                required
                value={form.phone}
                onChange={(event) => setForm((current) => ({ ...current, phone: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
            <label className="space-y-2 text-sm font-medium text-slate-700">
              <span>Company</span>
              <input
                required
                value={form.company}
                onChange={(event) => setForm((current) => ({ ...current, company: event.target.value }))}
                className="w-full rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
              />
            </label>
          </div>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Status</span>
            <select
              value={form.status}
              onChange={(event) => setForm((current) => ({ ...current, status: event.target.value as LeadStatus }))}
              className="w-full rounded-md border border-slate-300 bg-white px-3 py-2.5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              {LEAD_STATUSES.map((status) => (
                <option key={status} value={status}>
                  {status}
                </option>
              ))}
            </select>
          </label>

          <label className="block space-y-2 text-sm font-medium text-slate-700">
            <span>Notes</span>
            <textarea
              value={form.notes}
              onChange={(event) => setForm((current) => ({ ...current, notes: event.target.value }))}
              rows={4}
              className="w-full resize-none rounded-md border border-slate-300 px-3 py-2.5 text-slate-950 outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />
          </label>

          <div className="flex flex-col-reverse gap-3 border-t border-slate-200 pt-5 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              disabled={saving}
              className="rounded-md border border-slate-300 px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={saving}
              className="rounded-md bg-teal-700 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-teal-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {saving ? (mode === "create" ? "Creating lead..." : "Updating lead...") : mode === "create" ? "Create Lead" : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function Home() {
  const [leads, setLeads] = useState<Lead[]>([]);
  const [stats, setStats] = useState<LeadStats>(emptyStats);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [activeLead, setActiveLead] = useState<Lead | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [deletingId, setDeletingId] = useState("");
  const [refreshKey, setRefreshKey] = useState(0);
  const limit = 10;

  const rangeText = useMemo(() => {
    if (total === 0) return "0 leads";
    const start = (page - 1) * limit + 1;
    const end = Math.min(page * limit, total);
    return `${start}-${end} of ${total} leads`;
  }, [limit, page, total]);

  useEffect(() => {
    const controller = new AbortController();
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      setError("");

      try {
        const params = new URLSearchParams({
          page: String(page),
          limit: String(limit),
        });

        if (search.trim()) params.set("search", search.trim());
        if (statusFilter !== "ALL") params.set("status", statusFilter);

        const [leadsResponse, statsResponse] = await Promise.all([
          fetch(`${API_BASE}/api/leads?${params.toString()}`, { signal: controller.signal }),
          fetch(`${API_BASE}/api/leads/stats`, { signal: controller.signal }),
        ]);

        const leadsPayload = (await leadsResponse.json()) as LeadsResponse;
        const statsPayload = (await statsResponse.json()) as StatsResponse;

        if (!leadsResponse.ok || !leadsPayload.success) {
          throw new Error(readMessage(leadsPayload, "Unable to load leads."));
        }

        if (!statsResponse.ok || !statsPayload.success) {
          throw new Error(readMessage(statsPayload, "Unable to load lead statistics."));
        }

        setLeads(leadsPayload.data);
        setTotal(leadsPayload.total);
        setTotalPages(leadsPayload.totalPages);
        setStats(statsPayload.data);
      } catch (requestError) {
        if (requestError instanceof DOMException && requestError.name === "AbortError") return;
        setError(requestError instanceof Error ? requestError.message : "Network error. Please check the backend.");
      } finally {
        setLoading(false);
      }
    }, 250);

    return () => {
      window.clearTimeout(timeout);
      controller.abort();
    };
  }, [limit, page, refreshKey, search, statusFilter]);

  function openCreateModal() {
    setModalMode("create");
    setActiveLead(null);
    setModalOpen(true);
  }

  function openEditModal(lead: Lead) {
    setModalMode("edit");
    setActiveLead(lead);
    setModalOpen(true);
  }

  function handleSaved(message: string) {
    setModalOpen(false);
    setNotice(message);
    setRefreshKey((current) => current + 1);
  }

  async function deleteLead(lead: Lead) {
    const confirmed = window.confirm("Are you sure you want to delete this lead?");
    if (!confirmed) return;

    setDeletingId(lead.id);
    setError("");

    try {
      const response = await fetch(`${API_BASE}/api/leads/${lead.id}`, { method: "DELETE" });
      const payload = (await response.json()) as MutationResponse;

      if (!response.ok || !payload.success) {
        throw new Error(readMessage(payload, "Unable to delete lead."));
      }

      setNotice("Lead deleted successfully.");
      setRefreshKey((current) => current + 1);
    } catch (requestError) {
      setError(requestError instanceof Error ? requestError.message : "Unable to delete lead. Please try again.");
    } finally {
      setDeletingId("");
    }
  }

  return (
    <main className="min-h-screen bg-slate-100 text-slate-950">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8">
        <header className="flex flex-col gap-4 border-b border-slate-200 pb-5 md:flex-row md:items-end md:justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-teal-700">Small Business Pipeline</p>
            <h1 className="mt-2 text-3xl font-bold tracking-normal text-slate-950 sm:text-4xl">Lead Management CRM</h1>
          </div>
          <button
            type="button"
            onClick={openCreateModal}
            className="w-full rounded-md bg-teal-700 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-800 sm:w-auto"
          >
            Add Lead
          </button>
        </header>

        <section className="grid gap-3 sm:grid-cols-2 lg:grid-cols-6">
          {statCards.map((card) => (
            <div key={card.key} className="rounded-lg border border-slate-200 bg-white px-4 py-4 shadow-sm">
              <p className="text-sm font-medium text-slate-500">{card.label}</p>
              <p className="mt-2 text-3xl font-bold text-slate-950">{stats[card.key]}</p>
            </div>
          ))}
        </section>

        <section className="rounded-lg border border-slate-200 bg-white shadow-sm">
          <div className="grid gap-3 border-b border-slate-200 p-4 lg:grid-cols-[1fr_220px_auto] lg:items-center">
            <input
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="Search by name, email, or company"
              className="min-h-11 rounded-md border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            />

            <select
              value={statusFilter}
              onChange={(event) => {
                setStatusFilter(event.target.value as StatusFilter);
                setPage(1);
              }}
              className="min-h-11 rounded-md border border-slate-300 bg-white px-3 py-2 text-sm outline-none transition focus:border-teal-600 focus:ring-2 focus:ring-teal-100"
            >
              {STATUS_FILTERS.map((status) => (
                <option key={status} value={status}>
                  {status === "ALL" ? "All statuses" : status}
                </option>
              ))}
            </select>

            <button
              type="button"
              onClick={openCreateModal}
              className="min-h-11 rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-800 transition hover:bg-slate-50"
            >
              Add Lead
            </button>
          </div>

          {notice ? (
            <div className="mx-4 mt-4 rounded-md bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700">{notice}</div>
          ) : null}

          {error ? <div className="mx-4 mt-4 rounded-md bg-rose-50 px-4 py-3 text-sm font-medium text-rose-700">{error}</div> : null}

          <div className="overflow-x-auto">
            <table className="min-w-230 w-full border-collapse text-left text-sm">
              <thead className="bg-slate-50 text-xs font-semibold uppercase tracking-[0.08em] text-slate-500">
                <tr>
                  <th className="px-4 py-3">Name</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Company</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Created Date</th>
                  <th className="px-4 py-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200">
                {loading ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center text-sm font-medium text-slate-500">
                      Loading leads...
                    </td>
                  </tr>
                ) : leads.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-4 py-12 text-center">
                      <div className="mx-auto flex max-w-sm flex-col items-center gap-3">
                        <p className="text-base font-semibold text-slate-900">No leads found</p>
                        <button
                          type="button"
                          onClick={openCreateModal}
                          className="rounded-md bg-teal-700 px-4 py-2 text-sm font-semibold text-white transition hover:bg-teal-800"
                        >
                          Add Lead
                        </button>
                      </div>
                    </td>
                  </tr>
                ) : (
                  leads.map((lead) => (
                    <tr key={lead.id} className="bg-white transition hover:bg-slate-50">
                      <td className="px-4 py-4">
                        <div className="font-semibold text-slate-950">{lead.name}</div>
                        {lead.notes ? <div className="mt-1 max-w-48 truncate text-xs text-slate-500">{lead.notes}</div> : null}
                      </td>
                      <td className="px-4 py-4 text-slate-600">{lead.email}</td>
                      <td className="px-4 py-4 text-slate-600">{lead.phone}</td>
                      <td className="px-4 py-4 text-slate-600">{lead.company}</td>
                      <td className="px-4 py-4">
                        <StatusBadge status={lead.status} />
                      </td>
                      <td className="px-4 py-4 text-slate-600">{formatDate(lead.createdAt)}</td>
                      <td className="px-4 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            type="button"
                            onClick={() => openEditModal(lead)}
                            className="rounded-md border border-slate-300 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:bg-slate-100"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void deleteLead(lead)}
                            disabled={deletingId === lead.id}
                            className="rounded-md border border-rose-200 px-3 py-2 text-xs font-semibold text-rose-700 transition hover:bg-rose-50 disabled:cursor-not-allowed disabled:opacity-60"
                          >
                            {deletingId === lead.id ? "Deleting..." : "Delete"}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          <div className="flex flex-col gap-3 border-t border-slate-200 px-4 py-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-medium text-slate-500">{rangeText}</p>
            <div className="flex gap-2">
              <button
                type="button"
                disabled={page <= 1 || loading}
                onClick={() => setPage((current) => Math.max(1, current - 1))}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Previous
              </button>
              <button
                type="button"
                disabled={page >= totalPages || loading}
                onClick={() => setPage((current) => Math.min(totalPages, current + 1))}
                className="rounded-md border border-slate-300 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Next
              </button>
            </div>
          </div>
        </section>
      </div>

      {modalOpen ? (
        <LeadModal
          key={`${modalMode}-${activeLead?.id ?? "new"}`}
          mode={modalMode}
          lead={activeLead}
          onClose={() => setModalOpen(false)}
          onSaved={handleSaved}
        />
      ) : null}
    </main>
  );
}
