import { QueryPanel } from "@/components/query-panel";
import { readCustomerId } from "@/server/customer";
import { listDiseases, listGroupsForDisease } from "@/server/omics";

export default async function ClinicalPage({
  searchParams,
}: {
  searchParams: Promise<{ diseaseId?: string }>;
}) {
  const customerId = await readCustomerId();
  const diseaseId = Number((await searchParams).diseaseId);

  return (
    <div className="desk">
      <div>
        <p className="kicker">Legacy clinical</p>
        <h1>Diseases</h1>
        <p>Diseases, and the groups under one disease.</p>
      </div>
      <QueryPanel title="Diseases" load={listDiseases} />
      <form className="flex items-end gap-2" action="/clinical">
        <label>
          Disease
          <input
            name="diseaseId"
            type="number"
            min={1}
            className="mt-1 block w-28 rounded border border-stone-300 px-2 py-1"
          />
        </label>
        <button type="submit">Groups</button>
      </form>
      {Number.isInteger(diseaseId) && diseaseId > 0 ? (
        <QueryPanel
          title={`Groups for disease ${diseaseId}`}
          load={() => listGroupsForDisease(diseaseId, customerId)}
        />
      ) : null}
    </div>
  );
}
