import { DataTable, type Column } from "@/components/data-table";
import type { Row } from "@/server/screens";

const DOC_COLUMNS: Column[] = [
  { key: "name", label: "Name" },
  { key: "version", label: "Version" },
  { key: "status", label: "Status" },
];

export function FrameToolbar({
  refreshHref,
  publishedHref,
  publishedLabel,
  editing,
}: {
  refreshHref: string;
  publishedHref?: string;
  publishedLabel?: string;
  editing?: boolean;
}) {
  return (
    <div className="toolbar">
      <a href={refreshHref}>Refresh</a>
      {publishedHref ? <a href={publishedHref}>{publishedLabel ?? "Published only"}</a> : null}
      {editing ? (
        <>
          <button type="button" disabled>
            New
          </button>
          <button type="button" disabled>
            Save
          </button>
          <button type="button" className="primary" disabled>
            Publish
          </button>
        </>
      ) : (
        <button type="button" disabled>
          Open full
        </button>
      )}
    </div>
  );
}

export function DocumentFrame({
  listTitle,
  rows,
  columns = DOC_COLUMNS,
  baseHref,
  selected,
  jsonText,
  jsonError,
  extra,
}: {
  listTitle: string;
  rows: Row[];
  columns?: Column[];
  baseHref: string;
  selected: Row | null;
  jsonText?: string;
  jsonError?: string;
  extra?: React.ReactNode;
}) {
  return (
    <div className="instrument">
      <section className="panel">
        <h2>{listTitle}</h2>
        <DataTable
          rows={rows}
          columns={columns}
          selectedKey={selected ? String(selected.id ?? selected.name ?? "") : undefined}
          rowHref={(row) => {
            const id = row.id ?? row.name ?? "";
            const join = baseHref.includes("?") ? "&" : "?";
            const version = row.version ? `&version=${encodeURIComponent(String(row.version))}` : "";
            return `${baseHref}${join}doc=${encodeURIComponent(String(id))}${version}`;
          }}
        />
      </section>
      <section className="detail">
        <h2>Detail</h2>
        {selected ? (
          <>
            <dl className="fields">
              <dt>Name</dt>
              <dd>{text(selected.name)}</dd>
              <dt>Version</dt>
              <dd>{text(selected.version)}</dd>
              <dt>Status</dt>
              <dd>{text(selected.status)}</dd>
              <dt>Content hash</dt>
              <dd>{text(selected.content_hash)}</dd>
            </dl>
            <p className="kicker">document_json</p>
            {jsonError ? <p className="note">{jsonError}</p> : <pre className="json-view">{jsonText || ""}</pre>}
            {extra}
          </>
        ) : (
          <p className="note">Select a row to open its document.</p>
        )}
      </section>
    </div>
  );
}

function text(value: unknown): string {
  if (value == null || value === "") return "-";
  return String(value);
}
