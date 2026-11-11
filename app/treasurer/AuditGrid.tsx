"use client";
import { useMemo, useRef, useState } from "react";
import type { ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import { AllCommunityModule, themeQuartz } from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import StatusChip from "@/components/StatusChip";

type Claim = {
  id: string;
  memberName: string;
  receipt: { vendor: string; total: number; category: string; date: string | null };
  rule: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  payoutBatchId?: string;
};

const modules = [AllCommunityModule];

// Every color points at the CSS variables from globals.css,
// so the grid switches with the light/dark toggle automatically.
const gridTheme = themeQuartz.withParams({
  backgroundColor: "var(--card)",
  chromeBackgroundColor: "var(--card)",
  foregroundColor: "var(--ink)",
  headerBackgroundColor: "var(--card)",
  headerTextColor: "var(--muted)",
  headerFontSize: 12,
  headerFontWeight: 600,
  borderColor: "var(--line)",
  rowHoverColor: "var(--soft)",
  accentColor: "var(--brand)",
  inputBackgroundColor: "var(--page)",
  fontFamily: "inherit",
  fontSize: 13,
  spacing: 9,
  wrapperBorder: true,
  wrapperBorderRadius: 14,
  columnBorder: false,
  headerColumnBorder: false,
});

function StatusCell(p: ICellRendererParams<Claim>) {
  return (
    <span className="inline-flex h-full items-center">
      <StatusChip status={p.value as string} />
    </span>
  );
}

const money = (p: ValueFormatterParams<Claim, number>) =>
  p.value == null ? "" : `$${p.value.toFixed(2)}`;

export default function AuditGrid({ claims }: { claims: Claim[] }) {
  const gridRef = useRef<AgGridReact<Claim>>(null);
  const [search, setSearch] = useState("");

  const colDefs = useMemo<ColDef<Claim>[]>(
    () => [
      { headerName: "Member", field: "memberName", minWidth: 110 },
      { headerName: "Vendor", field: "receipt.vendor", minWidth: 150 },
      { headerName: "Amount", field: "receipt.total", filter: "agNumberColumnFilter", valueFormatter: money, cellClass: "tabular-nums font-semibold", minWidth: 110 },
      {
        headerName: "Category",
        field: "receipt.category",
        valueFormatter: (p) => (p.value ? p.value[0].toUpperCase() + p.value.slice(1) : ""),
        minWidth: 120,
      },
      { headerName: "Rule applied", field: "rule", flex: 2, minWidth: 260, wrapText: true, autoHeight: true },
      {
        headerName: "Decided by",
        valueGetter: (p) =>
          p.data?.reviewedAt ? "Treasurer" : p.data?.status === "pending_review" ? "Waiting" : "Rules",
        minWidth: 120,
      },
      { headerName: "Status", field: "status", cellRenderer: StatusCell, minWidth: 150 },
      {
        headerName: "Submitted",
        field: "createdAt",
        sort: "desc",
        valueFormatter: (p) =>
          p.value ? new Date(p.value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "",
        minWidth: 150,
      },
      { headerName: "PayPal payout ID", field: "payoutBatchId", minWidth: 170, cellClass: "text-muted" },
    ],
    []
  );

  const defaultColDef = useMemo<ColDef<Claim>>(
    () => ({ flex: 1, sortable: true, filter: true, resizable: true }),
    []
  );

  function exportCsv() {
    gridRef.current?.api.exportDataAsCsv({
      fileName: `pockit-audit-${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }

  return (
    <AgGridProvider modules={modules}>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Audit log</h2>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <svg
              width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor"
              strokeWidth="2" strokeLinecap="round" aria-hidden="true"
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims"
              aria-label="Search claims"
              className="h-11 w-full rounded-xl border border-line bg-card pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            onClick={exportCsv}
            className="h-11 whitespace-nowrap rounded-xl border border-line bg-card px-4 text-sm font-semibold text-brand hover:bg-soft transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Export CSV
          </button>
        </div>
      </div>
      <AgGridReact<Claim>
        ref={gridRef}
        theme={gridTheme}
        rowData={claims}
        columnDefs={colDefs}
        defaultColDef={defaultColDef}
        quickFilterText={search}
        getRowId={(p) => p.data.id}
        domLayout="autoHeight"
        pagination
        paginationPageSize={10}
        paginationPageSizeSelector={[10, 25, 50]}
        overlayNoRowsTemplate="No claims yet. Submitted receipts will appear here."
      />
    </AgGridProvider>
  );
}