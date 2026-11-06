import { QueryPanel } from "@/components/query-panel";
import { readCustomerId } from "@/server/customer";
import {
  listGroupSampleNames,
  listGroupsForEnrollment,
  listSamplesForStudyEnrollment,
} from "@/server/omics";

export default async function EnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ studyRowId?: string; groupId?: string }>;
}) {
  const params = await searchParams;
  const customerId = await readCustomerId();
  const studyRowId = Number(params.studyRowId);
  const groupId = Number(params.groupId);
  const study = Number.isInteger(studyRowId) && studyRowId > 0 ? studyRowId : null;
  const group = Number.isInteger(groupId) && groupId > 0 ? groupId : null;

  return (
    <div className="desk">
      <div>
        <p className="kicker">Studies</p>
        <h1>Cohort</h1>
        <p>Samples and group names for a study.</p>
      </div>
      <form action="/enrollment">
        <label>
          Study
          <input name="studyRowId" type="number" min={1} aria-label="Study" />
        </label>
        <label>
          Group
          <input name="groupId" type="number" min={1} className="mt-1 block w-32 rounded border px-2 py-1" />
        </label>
        <button type="submit">Query</button>
      </form>
      <QueryPanel title="Customer groups" load={() => listGroupsForEnrollment(customerId)} />
      {study ? (
        <QueryPanel
          title={`Samples for study ${study}`}
          load={() => listSamplesForStudyEnrollment(customerId, study, null)}
        />
      ) : null}
      {group ? (
        <QueryPanel title={`Names in group ${group}`} load={() => listGroupSampleNames(group)} />
      ) : null}
    </div>
  );
}
