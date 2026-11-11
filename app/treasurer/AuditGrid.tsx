"use client";
import { useMemo, useRef, useState } from "react";
import type { ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import { AllCommunityModule, themeQuartz, colorSchemeDark } from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";

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

const gridTheme = themeQuartz.withPart(colorSchemeDark).withParams({
  backgroundColor: "#000000",
  foregroundColor: "#EDEDED",
  headerBackgroundColor: "#000000",
  headerTextColor: "#8A8A8F",
  headerFontWeight: 500,
  borderColor: "rgba(255,255,255,0.08)",
  rowHoverColor: "rgba(139,156,255,0.06)",
  accentColor: "#8B9CFF",
  fontFamily: "inherit",
  fontSize: 13,
  spacing: 9,
  wrapperBorderRadius: 12,
  columnBorder: false,
  headerColumnBorder: false,
});

const STATUS: Record<string, { label: string; color: string }> = {
  paid: { label: "Paid", color: "#5FD3A0" },
  pending_review: { label: "Needs review", color: "#F2C46D" },
  rejected: { label: "Rejected", color: "#FF7A7A" },
  denied: { label: "Denied", color: "#FF7A7A" },
  payout_failed: { label: "Payout failed", color: "#FF7A7A" },
};

function StatusCell(p: ICellRendererParams<Claim>) {
  const s = STATUS[p.value as string] ?? { label: p.value, color: "#8A8A8F" };
  return (
    <span className="inline-flex items-center gap-2">
      <span className="h-1.5 w-1.5 rounded-full" style={{ background: s.color }} />
      {s.label}
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
      { headerName: "Amount", field: "receipt.total", filter: "agNumberColumnFilter", valueFormatter: money, cellClass: "tabular-nums", minWidth: 110 },
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
      { headerName: "Status", field: "status", cellRenderer: StatusCell, minWidth: 140 },
      {
        headerName: "Submitted",
        field: "createdAt",
        sort: "desc",
        valueFormatter: (p) =>
          p.value ? new Date(p.value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "",
        minWidth: 150,
      },
      { headerName: "PayPal payout ID", field: "payoutBatchId", minWidth: 170, cellClass: "text-zinc-500" },
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
        <h2 className="text-lg font-medium">Audit log</h2>
        <div className="flex gap-2">
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search claims"
            className="w-full sm:w-56 rounded-full border bg-transparent px-4 py-2 text-sm placeholder:text-zinc-500 focus:outline-none focus:border-[#8B9CFF]"
          />
          <button
            onClick={exportCsv}
            className="whitespace-nowrap rounded-full border px-4 py-2 text-sm text-zinc-300 hover:text-white hover:border-white/30 transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#8B9CFF]"
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