import { Pane, Workbench } from "@/components/workbench";
import { readCustomerId } from "@/server/customer";
import { listGroupSampleNames, listGroupsForEnrollment, listSamplesForStudyEnrollment } from "@/server/omics";
import { listStudies } from "@/server/screens";

export default async function EnrollmentPage({
  searchParams,
}: {
  searchParams: Promise<{ study?: string; group?: string }>;
}) {
  const params = await searchParams;
  const customerId = await readCustomerId();
  const studyId = Number(params.study);
  const groupId = Number(params.group);
  const study = Number.isInteger(studyId) && studyId > 0 ? studyId : null;
  const group = Number.isInteger(groupId) && groupId > 0 ? groupId : null;
  const [studies, groups, samples, names] = await Promise.all([
    listStudies(),
    listGroupsForEnrollment(customerId).then((rows) => ({ rows, error: undefined as string | undefined })).catch((error: unknown) => ({
      rows: [],
      error: error instanceof Error ? error.message : "The portal database could not be read.",
    })),
    study ? listSamplesForStudyEnrollment(customerId, study, null).then((rows) => ({ rows, error: undefined })).catch((error: unknown) => ({
      rows: [],
      error: error instanceof Error ? error.message : "The portal database could not be read.",
    })) : Promise.resolve(null),
    group ? listGroupSampleNames(group).then((rows) => ({ rows, error: undefined })).catch((error: unknown) => ({
      rows: [],
      error: error instanceof Error ? error.message : "The portal database could not be read.",
    })) : Promise.resolve(null),
  ]);

  return (
    <Workbench floor="Studies" title="Cohort" summary="Studies, arms, enrolled members, and the clinical groups you can add.">
      <div className="toolbar">
        <a href="/enrollment">Refresh</a>
        <button type="button" disabled>Save group</button>
        <button type="button" disabled>Save members</button>
        <button type="button" disabled>Materialize lists</button>
      </div>
      <form action="/enrollment">
        <label>
          Study
          <select name="study" defaultValue={params.study ?? ""} aria-label="Study">
            <option value="">Select a study</option>
            {studies.rows.map((row) => (
              <option key={String(row.id)} value={String(row.id)}>
                {String(row.name ?? "Study")}
              </option>
            ))}
          </select>
        </label>
        <label>
          Group
          <input name="group" type="number" min={1} defaultValue={params.group ?? ""} aria-label="Group" />
        </label>
        <button type="submit">Open</button>
      </form>
      <div className="instrument">
        <Pane
          title="Studies"
          rows={studies.rows}
          error={studies.error}
          columns={[
            { key: "name", label: "Name" },
            { key: "version", label: "Version" },
            { key: "status", label: "Status" },
          ]}
        />
        <Pane
          title="Arms"
          rows={[]}
          columns={[
            { key: "role", label: "Role" },
            { key: "label", label: "Label" },
            { key: "list_filename", label: "List filename" },
          ]}
        />
      </div>
      <Pane title="Portal clinical groups" rows={groups.rows} error={groups.error} />
      {samples ? <Pane title="Samples for the study" rows={samples.rows} error={samples.error} /> : null}
      {names ? <Pane title="Enrolled members" rows={names.rows} error={names.error} /> : <Pane title="Enrolled members" rows={[]} columns={[{ key: "sample_name", label: "Sample" }, { key: "membership", label: "Membership" }]} />}
    </Workbench>
  );
}
