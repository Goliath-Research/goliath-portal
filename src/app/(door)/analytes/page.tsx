import { QueryPanel } from "@/components/query-panel";
import { listAnalyteCatalog } from "@/server/omics";

export default async function AnalytesPage({
  searchParams,
}: {
  searchParams: Promise<{ advanced?: string }>;
}) {
  const includeAdvanced = (await searchParams).advanced === "1";
  return (
    <div className="desk">
      <p className="kicker">Platform</p>
      <h1>Analytes</h1>
      <p>Published analytes in the active cycle.</p>
      <form action="/analytes">
        <input type="hidden" name="advanced" value={includeAdvanced ? "0" : "1"} />
        <button type="submit">{includeAdvanced ? "Hide advanced" : "Include advanced"}</button>
      </form>
      <QueryPanel title="Catalog" load={() => listAnalyteCatalog(includeAdvanced)} />
    </div>
  );
}
