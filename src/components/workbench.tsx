import { DataTable } from "@/components/data-table";
import type { Row } from "@/server/screens";

export function Workbench({
  floor,
  title,
  summary,
  children,
}: {
  floor: string;
  title: string;
  summary: string;
  children: React.ReactNode;
}) {
  return (
    <div className="desk">
      <p className="kicker">{floor}</p>
      <h1>{title}</h1>
      <p>{summary}</p>
      {children}
    </div>
  );
}

export function Pane({ title, rows, error }: { title: string; rows: Row[]; error?: string }) {
  if (error) {
    return (
      <section className="alert">
        <h2>{title}</h2>
        <p>{error}</p>
      </section>
    );
  }
  return (
    <section className="panel">
      <h2>{title}</h2>
      <DataTable rows={rows} />
    </section>
  );
}

export function StudyForm({
  action,
  studies,
  study,
  hidden,
}: {
  action: string;
  studies: Row[];
  study?: string;
  hidden?: Record<string, string>;
}) {
  return (
    <form action={action}>
      {hidden
        ? Object.entries(hidden).map(([name, value]) => (
            <input key={name} type="hidden" name={name} value={value} />
          ))
        : null}
      <label>
        Study
        <select name="study" defaultValue={study ?? ""} aria-label="Study">
          <option value="">Select a study</option>
          {studies.map((row) => (
            <option key={String(row.id)} value={String(row.id)}>
              {String(row.name ?? "Study")} {row.version ? `· ${String(row.version)}` : ""}
            </option>
          ))}
        </select>
      </label>
      <button type="submit">Open</button>
    </form>
  );
}
