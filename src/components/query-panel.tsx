import { DataTable } from "@/components/data-table";

export async function QueryPanel({
  title,
  load,
}: {
  title: string;
  load: () => Promise<Record<string, unknown>[]>;
}) {
  try {
    const rows = await load();
    return (
      <section className="panel">
        <h2>{title}</h2>
        <DataTable rows={rows} />
      </section>
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "The portal database could not be read.";
    return (
      <section className="alert">
        <h2>{title}</h2>
        <p>{message}</p>
      </section>
    );
  }
}
