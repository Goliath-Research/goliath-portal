import { DataTable } from "@/components/data-table";
import { Workbench } from "@/components/workbench";
import { readCustomerId } from "@/server/customer";
import { listSamplesByCustomer, type Row } from "@/server/omics";

const COLUMNS = [
  { key: "id", label: "Sample" },
  { key: "age", label: "Age" },
  { key: "height", label: "Height" },
  { key: "weight", label: "Weight" },
  { key: "bmi", label: "BMI" },
  { key: "disease", label: "Disease" },
  { key: "stage", label: "Stage" },
];

export default async function SamplesPage({
  searchParams,
}: {
  searchParams: Promise<{ disease?: string; stage?: string }>;
}) {
  const params = await searchParams;
  const customerId = await readCustomerId();
  const disease = (params.disease ?? "").trim().toLowerCase();
  const stage = (params.stage ?? "").trim().toLowerCase();
  let rows: Row[] = [];
  let error: string | undefined;
  if (customerId) {
    try {
      rows = await listSamplesByCustomer(customerId);
    } catch (caught) {
      error = caught instanceof Error ? caught.message : "The portal database could not be read.";
    }
  }
  const filtered = rows.filter((row) => {
    const rowDisease = String(row.disease ?? "").toLowerCase();
    const rowStage = String(row.stage ?? "").toLowerCase();
    return (!disease || rowDisease.includes(disease)) && (!stage || rowStage.includes(stage));
  });

  return (
    <Workbench floor="Legacy clinical" title="Samples" summary="Samples for the customer in the toolbar. Filter the grid, then create a group from it.">
      <div className="toolbar">
        <a href="/samples">Refresh</a>
        <button type="button" disabled>Create Group from Filtered</button>
      </div>
      {error ? <p className="alert">{error}</p> : null}
      {!customerId ? <p className="note">Set a customer in the toolbar.</p> : null}
      <form action="/samples" className="designer-bar">
        <label>
          Disease
          <input name="disease" defaultValue={params.disease ?? ""} aria-label="Disease" />
        </label>
        <label>
          Stage
          <input name="stage" defaultValue={params.stage ?? ""} aria-label="Stage" />
        </label>
        <button type="submit">Filter</button>
      </form>
      <section className="panel">
        <h2>Samples</h2>
        <DataTable rows={filtered} columns={COLUMNS} />
      </section>
    </Workbench>
  );
}
