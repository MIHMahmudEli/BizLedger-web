export interface PrintColumn<T> {
  header: string;
  accessor: (row: T) => string;
  align?: "left" | "right" | "center";
  width?: string;
}

export interface PrintSummaryItem {
  label: string;
  value: string;
}

export interface PrintTotalsRow {
  label: string;
  values: Record<string, string>;
}

export interface PrintReportOptions<T> {
  title: string;
  filters?: string[];
  columns: PrintColumn<T>[];
  rows: T[];
  summary?: PrintSummaryItem[];
  totals?: PrintTotalsRow;
  emptyMessage?: string;
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/**
 * Opens a blank print window synchronously (must be called directly inside a
 * click handler, before any `await`, so browsers don't block it as a popup).
 */
export function openPrintWindow(): Window | null {
  const win = window.open("", "_blank", "width=1024,height=768");
  if (win) {
    win.document.write(
      '<!doctype html><title>Preparing report…</title><body style="font-family:system-ui,sans-serif;padding:40px;color:#6b7280">Preparing report…</body>'
    );
  }
  return win;
}

export function writePrintReport<T>(win: Window, options: PrintReportOptions<T>): void {
  const { title, filters = [], columns, rows, summary = [], totals, emptyMessage = "No records found." } = options;

  const generatedAt = new Date().toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  const headCells = columns
    .map((c) => `<th style="text-align:${c.align ?? "left"}${c.width ? `;width:${c.width}` : ""}">${escapeHtml(c.header)}</th>`)
    .join("");

  const bodyRows = rows
    .map(
      (row) =>
        `<tr>${columns
          .map((c) => `<td style="text-align:${c.align ?? "left"}">${escapeHtml(c.accessor(row))}</td>`)
          .join("")}</tr>`
    )
    .join("");

  const totalsRow = totals
    ? `<tr class="totals-row">${columns
        .map((c, i) =>
          i === 0
            ? `<td style="text-align:${c.align ?? "left"}">${escapeHtml(totals.label)}</td>`
            : `<td style="text-align:${c.align ?? "left"}">${escapeHtml(totals.values[c.header] ?? "")}</td>`
        )
        .join("")}</tr>`
    : "";

  const summaryHtml = summary.length
    ? `<div class="summary">${summary
        .map((s) => `<div class="summary-item"><span class="summary-label">${escapeHtml(s.label)}</span><span class="summary-value">${escapeHtml(s.value)}</span></div>`)
        .join("")}</div>`
    : "";

  const filtersHtml = filters.length
    ? `<p class="filters">Filtered by: ${filters.map(escapeHtml).join(" &middot; ")}</p>`
    : `<p class="filters">All records</p>`;

  const html = `<!doctype html>
<html>
<head>
<meta charset="utf-8" />
<title>${escapeHtml(title)} - BizLedger</title>
<style>
  @page { size: A4 landscape; margin: 14mm 12mm; }
  * { box-sizing: border-box; }
  body {
    font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif;
    color: #111827;
    margin: 0;
    padding: 0;
    font-size: 11px;
  }
  .letterhead {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 12px;
    border-bottom: 2px solid #0f172a;
    margin-bottom: 18px;
  }
  .brand { display: flex; align-items: center; gap: 10px; }
  .brand-mark {
    width: 34px; height: 34px; border-radius: 9px;
    background: #0f172a; color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-weight: 700; font-size: 13px; letter-spacing: 0.5px;
  }
  .brand-name { font-weight: 700; font-size: 15px; line-height: 1.1; }
  .brand-tagline { font-size: 10px; color: #6b7280; }
  .generated { text-align: right; font-size: 10px; color: #6b7280; }
  .title-block { margin-bottom: 14px; }
  h1 { font-size: 18px; margin: 0 0 4px 0; }
  .filters { font-size: 10.5px; color: #6b7280; margin: 0; }
  .summary { display: flex; gap: 10px; margin: 14px 0 18px; flex-wrap: wrap; }
  .summary-item {
    border: 1px solid #e5e7eb; border-radius: 8px; padding: 8px 14px;
    display: flex; flex-direction: column; gap: 2px; min-width: 120px;
  }
  .summary-label { font-size: 9.5px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px; }
  .summary-value { font-size: 14px; font-weight: 700; }
  table { width: 100%; border-collapse: collapse; }
  thead th {
    background: #0f172a; color: #fff;
    padding: 7px 8px; font-size: 10px; text-transform: uppercase; letter-spacing: 0.3px;
    font-weight: 600;
  }
  tbody td {
    padding: 6px 8px; border-bottom: 1px solid #e5e7eb; font-size: 10.5px;
    vertical-align: top;
  }
  tbody tr:nth-child(even) { background: #f8fafc; }
  tbody tr { page-break-inside: avoid; }
  .totals-row td {
    border-top: 2px solid #0f172a; border-bottom: none;
    font-weight: 700; background: #f1f5f9;
  }
  .empty { text-align: center; color: #6b7280; padding: 30px 0; font-size: 12px; }
  footer {
    margin-top: 18px; padding-top: 8px; border-top: 1px solid #e5e7eb;
    font-size: 9.5px; color: #9ca3af; text-align: center;
  }
  @media print {
    .brand-mark { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    thead th { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
    .totals-row td { -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  }
</style>
</head>
<body>
  <div class="letterhead">
    <div class="brand">
      <div class="brand-mark">BL</div>
      <div>
        <div class="brand-name">BizLedger</div>
        <div class="brand-tagline">Business Suite</div>
      </div>
    </div>
    <div class="generated">Generated ${escapeHtml(generatedAt)}</div>
  </div>

  <div class="title-block">
    <h1>${escapeHtml(title)}</h1>
    ${filtersHtml}
  </div>

  ${summaryHtml}

  ${
    rows.length === 0
      ? `<div class="empty">${escapeHtml(emptyMessage)}</div>`
      : `<table>
    <thead><tr>${headCells}</tr></thead>
    <tbody>${bodyRows}${totalsRow}</tbody>
  </table>`
  }

  <footer>BizLedger &middot; Business Management Suite &middot; ${rows.length} record${rows.length === 1 ? "" : "s"}</footer>
</body>
</html>`;

  win.document.open();
  win.document.write(html);
  win.document.close();

  const triggerPrint = () => {
    win.focus();
    win.print();
  };

  if (win.document.readyState === "complete") {
    setTimeout(triggerPrint, 150);
  } else {
    win.addEventListener("load", () => setTimeout(triggerPrint, 150));
  }
}
