export type Column = { key: string; label: string };

export function DataTable({
  rows,
  columns,
  rowHref,
  rowKey,
  selectedKey,
}: {
  rows: Record<string, unknown>[];
  columns?: Column[];
  rowHref?: (row: Record<string, unknown>) => string;
  rowKey?: (row: Record<string, unknown>, index: number) => string;
  selectedKey?: string;
}) {
  const resolved = resolveColumns(rows, columns);
  if (resolved.length === 0) {
    return <p className="empty">No rows.</p>;
  }
  return (
    <div className="grid-wrap">
      <table>
        <thead>
          <tr>
            {resolved.map((column) => (
              <th key={column.key}>{column.label}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr>
              <td colSpan={resolved.length} className="empty">
                No rows.
              </td>
            </tr>
          ) : (
            rows.map((row, index) => {
              const href = rowHref?.(row);
              const key = rowKey ? rowKey(row, index) : String(row.id ?? row.name ?? index);
              const selected = selectedKey != null && selectedKey !== "" && selectedKey === key;
              return (
                <tr key={key} className={selected ? "selected" : undefined}>
                  {resolved.map((column, columnIndex) => (
                    <td key={column.key}>
                      {href && columnIndex === 0 ? <a href={href}>{formatCell(row[column.key])}</a> : formatCell(row[column.key])}
                    </td>
                  ))}
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
}

function resolveColumns(rows: Record<string, unknown>[], columns?: Column[]): Column[] {
  if (!columns) {
    return Object.keys(rows[0] ?? {})
      .filter((key) => key !== "content_hash")
      .map((key) => ({ key, label: columnLabel(key) }));
  }
  const known = new Set(columns.map((column) => column.key));
  const extra = Object.keys(rows[0] ?? {})
    .filter((key) => !known.has(key) && key !== "content_hash" && key !== "document_json")
    .map((key) => ({ key, label: columnLabel(key) }));
  return [...columns, ...extra];
}

const COLUMN_LABELS: Record<string, string> = {
  study_row_id: "Study",
  portal_sample_id: "Sample",
  analyte_id: "Analyte",
  default_analyte_id: "Analyte",
  default_pipeline_profile_id: "Profile",
  default_assay_procedure_id: "Procedure",
};

function columnLabel(column: string): string {
  if (COLUMN_LABELS[column]) return COLUMN_LABELS[column];
  const words = column.replace(/_id$/, "").split("_").filter(Boolean);
  return words.map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}

function formatCell(value: unknown): string {
  if (value == null) return "";
  if (typeof value === "object") {
    const text = JSON.stringify(value);
    return text.length > 160 ? `${text.slice(0, 157)}...` : text;
  }
  const text = String(value);
  return text.length > 160 ? `${text.slice(0, 157)}...` : text;
}
