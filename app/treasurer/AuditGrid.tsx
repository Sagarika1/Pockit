"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import type { ColDef, ICellRendererParams, ValueFormatterParams } from "ag-grid-community";
import { AllCommunityModule, themeQuartz } from "ag-grid-community";
import { AgGridProvider, AgGridReact } from "ag-grid-react";
import StatusChip from "@/components/StatusChip";

type Claim = {
  id: string;
  memberName: string;
  memberEmail?: string;
  receipt: { vendor: string; total: number; category: string; date: string | null };
  rule: string;
  status: string;
  createdAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  payoutBatchId?: string;
  payAmount?: number;
  imageId?: string;
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

function VendorCell(p: ICellRendererParams<Claim>) {
  const r = p.data?.receipt;
  if (!r) return null;
  return (
    <div className="py-0.5 leading-tight">
      <div className="font-medium">{r.vendor}</div>
      <div className="text-xs capitalize text-muted">{r.category}</div>
    </div>
  );
}

const money = (p: ValueFormatterParams<Claim, number>) => (p.value == null ? "–" : `$${p.value.toFixed(2)}`);

const decidedBy = (c?: Claim) => (c?.reviewedAt ? "Treasurer" : c?.status === "pending_review" ? "Pending" : "Automatic");

/** How wide is the box the grid lives in? Used to drop less important columns instead of scrolling sideways. */
function useWidth() {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(1200);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return { ref, width };
}

export default function AuditGrid({ claims }: { claims: Claim[] }) {
  const gridRef = useRef<AgGridReact<Claim>>(null);
  const [search, setSearch] = useState("");
  const { ref, width } = useWidth();

  // 0 = everything, 1 = hide "Decided by", 2 = also hide member, 3 = also hide date
  const level = width < 560 ? 3 : width < 760 ? 2 : width < 940 ? 1 : 0;

  const colDefs = useMemo<ColDef<Claim>[]>(
    () => [
      {
        colId: "when",
        headerName: "Date",
        field: "createdAt",
        sort: "desc",
        flex: 1,
        minWidth: 110,
        hide: level >= 3,
        valueFormatter: (p) =>
          p.value ? new Date(p.value).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }) : "",
      },
      { colId: "member", headerName: "Member", field: "memberName", flex: 1, minWidth: 100, hide: level >= 2 },
      { colId: "vendor", headerName: "Vendor", valueGetter: (p) => p.data?.receipt.vendor, cellRenderer: VendorCell, flex: 1.3, minWidth: 130, autoHeight: true },
      { colId: "amount", headerName: "Receipt total", field: "receipt.total", filter: "agNumberColumnFilter", valueFormatter: money, cellClass: "tabular-nums font-semibold", flex: 0.7, minWidth: 90 },
      {
        colId: "paid",
        headerName: "Paid",
        valueGetter: (p) => (p.data?.status === "paid" ? (p.data.payAmount ?? p.data.receipt.total) : null),
        valueFormatter: money,
        filter: "agNumberColumnFilter",
        cellClass: "tabular-nums font-semibold",
        flex: 0.7,
        minWidth: 90,
      },
      { colId: "why", headerName: "Why", field: "rule", flex: 2, minWidth: 170, wrapText: true, autoHeight: true },
      { colId: "status", headerName: "Status", field: "status", cellRenderer: StatusCell, flex: 1.2, minWidth: 150 },
      {
        colId: "photo",
        headerName: "Receipt",
        sortable: false,
        filter: false,
        flex: 0.6,
        minWidth: 90,
        cellRenderer: (p: { data?: Claim }) =>
          p.data?.imageId ? (
            <a href={`/api/claims/${p.data.id}/image`} target="_blank" rel="noopener noreferrer" className="font-semibold text-brand hover:underline">
              View
            </a>
          ) : null,
      },
      { colId: "by", headerName: "Decided by", valueGetter: (p) => decidedBy(p.data), flex: 0.9, minWidth: 100, hide: level >= 1 },
      // Not shown on screen, but included when you export the CSV for an audit
      { colId: "category", headerName: "Category", field: "receipt.category", hide: true },
      { colId: "receiptDate", headerName: "Receipt date", field: "receipt.date", hide: true },
      { colId: "paypalEmail", headerName: "PayPal email", field: "memberEmail", hide: true },
      { colId: "reviewedBy", headerName: "Reviewed by", field: "reviewedBy", hide: true },
      { colId: "payout", headerName: "PayPal payment ID", field: "payoutBatchId", hide: true },
    ],
    [level]
  );

  const defaultColDef = useMemo<ColDef<Claim>>(() => ({ sortable: true, filter: true, resizable: true }), []);

  function exportCsv() {
    gridRef.current?.api.exportDataAsCsv({
      allColumns: true,
      fileName: `pockit-audit-${new Date().toISOString().slice(0, 10)}.csv`,
    });
  }

  return (
    <AgGridProvider modules={modules}>
      <div className="mb-4 flex flex-col justify-between gap-3 sm:flex-row sm:items-center">
        <h2 className="text-xl font-semibold">Audit log</h2>
        <div className="flex gap-2">
          <div className="relative w-full sm:w-64">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true" className="absolute left-3.5 top-1/2 -translate-y-1/2 text-muted">
              <circle cx="11" cy="11" r="7" />
              <path d="M20 20l-4-4" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search claims"
              aria-label="Search claims"
              className="h-11 w-full rounded-full border border-line bg-card pl-10 pr-4 text-sm text-ink placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-brand"
            />
          </div>
          <button
            onClick={exportCsv}
            className="h-11 whitespace-nowrap rounded-full border border-line bg-card px-5 text-sm font-semibold text-brand transition-colors hover:bg-soft focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand"
          >
            Export CSV
          </button>
        </div>
      </div>
      <div ref={ref} className="w-full">
        <AgGridReact<Claim>
          ref={gridRef}
          theme={gridTheme}
          rowData={claims}
          columnDefs={colDefs}
          defaultColDef={defaultColDef}
          quickFilterText={search}
          includeHiddenColumnsInQuickFilter
          suppressHorizontalScroll
          getRowId={(p) => p.data.id}
          domLayout="autoHeight"
          pagination
          paginationPageSize={10}
          paginationPageSizeSelector={[10, 25, 50]}
          overlayNoRowsTemplate="No claims yet. Submitted receipts will appear here."
        />
      </div>
    </AgGridProvider>
  );
}
