export function DataTable({ rows }: { rows: Record<string, unknown>[] }) {
  if (rows.length === 0) {
    return <p className="empty">No rows.</p>;
  }
  const columns = Object.keys(rows[0] ?? {}).filter((column) => column !== "content_hash");
  return (
    <div className="grid-wrap">
      <table>
        <thead>
          <tr>
            {columns.map((column) => (
              <th key={column}>{columnLabel(column)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, index) => (
            <tr key={index}>
              {columns.map((column) => (
                <td key={column}>{formatCell(row[column])}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
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
