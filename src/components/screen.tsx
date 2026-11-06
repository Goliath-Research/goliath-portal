import { Pane, StudyForm, Workbench } from "@/components/workbench";
import {
  chosenStudy,
  listActions,
  listClusters,
  listContracts,
  listCredentials,
  listPipelineProfiles,
  listReferenceAssets,
  listSearches,
  listSites,
  listStorageEndpoints,
  listStorageProfiles,
  listStudies,
  listStudyInstances,
  listStudyStages,
  listWorkerEnrollments,
  listWorkerHealth,
  listWorkflowDefs,
  listWorkflowVersions,
  studyDefaults,
  studyDocument,
  studyProgress,
  type Row,
} from "@/server/screens";

export async function Screen({
  leaf,
  study,
  workflow,
}: {
  leaf: string;
  study?: string;
  workflow?: string;
}) {
  const studies = await listStudies();
  const picked = chosenStudy(studies.rows, study);

  switch (leaf) {
    case "overview":
      return (
        <Workbench floor="Studies" title="Overview" summary="Stage progress for the selected study.">
          <StudyForm action="/desk/overview" studies={studies.rows} study={study} />
          <Pane title="Studies" rows={studies.rows} error={studies.error} />
          {picked ? <Progress studyId={Number(picked.id)} /> : <Awaiting />}
        </Workbench>
      );
    case "storage":
      return <Storage />;
    case "lifecycle":
      return (
        <Workbench floor="Studies" title="Study lifecycle" summary="Stages and instances for the selected study.">
          <StudyForm action="/desk/lifecycle" studies={studies.rows} study={study} />
          <Pane title="Studies" rows={studies.rows} error={studies.error} />
          {picked ? <Lifecycle studyId={Number(picked.id)} /> : <Awaiting />}
        </Workbench>
      );
    case "prediction":
      return <Prediction studies={studies.rows} study={study} picked={picked} error={studies.error} />;
    case "runs":
      return (
        <Workbench floor="Studies" title="Runs" summary="Instances, stages, and process defaults for the selected study.">
          <StudyForm action="/studies" studies={studies.rows} study={study} hidden={{ leaf: "runs" }} />
          <Pane title="Studies" rows={studies.rows} error={studies.error} />
          {picked ? <Lifecycle studyId={Number(picked.id)} defaults /> : <Awaiting />}
        </Workbench>
      );
    case "manifests":
      return (
        <Workbench floor="Studies" title="Project manifests" summary="Published studies and the manifest for the one you open.">
          <StudyForm action="/studies" studies={studies.rows} study={study} hidden={{ leaf: "manifests" }} />
          <Pane title="Studies" rows={studies.rows} error={studies.error} />
          {picked ? <Manifest study={picked} /> : <Awaiting />}
        </Workbench>
      );
    case "definitions":
      return <Definitions workflow={workflow} />;
    case "site":
      return <Simple floor="Platform" title="Site" summary="Sites registered for this deployment." load={listSites} pane="Sites" />;
    case "profiles":
      return (
        <Simple
          floor="Platform"
          title="Pipeline profiles"
          summary="Published and draft profile packs."
          load={listPipelineProfiles}
          pane="Profiles"
        />
      );
    case "catalog":
      return (
        <Simple floor="Platform" title="Action catalog" summary="Action definitions available to workflows." load={listActions} pane="Actions" />
      );
    case "storage-admin":
      return <StorageAdmin />;
    case "assets":
      return (
        <Simple
          floor="Platform"
          title="Reference assets"
          summary="Genomes, annotations, and caches."
          load={listReferenceAssets}
          pane="Assets"
        />
      );
    case "workers":
      return <Workers />;
    case "hpo":
      return <Searches title="HPO Monitor" floor="Hyperparameters" summary="Hyperparameter searches across studies." study={null} />;
    case "contracts":
      return (
        <Simple floor="Admin" title="Contracts" summary="Customer contracts and their status." load={listContracts} pane="Contracts" />
      );
    default:
      return (
        <Workbench floor="Portal" title="Module" summary="This entry is not on the portal map.">
          <p className="empty">Choose a leaf from Navigate.</p>
        </Workbench>
      );
  }
}

function Awaiting() {
  return <p className="note">Select a study to open its detail.</p>;
}

async function Progress({ studyId }: { studyId: number }) {
  const progress = await studyProgress(studyId);
  return <Pane title="Stage progress" rows={progress.rows} error={progress.error} />;
}

async function Lifecycle({ studyId, defaults = false }: { studyId: number; defaults?: boolean }) {
  const [stages, instances, process] = await Promise.all([
    listStudyStages(studyId),
    listStudyInstances(studyId),
    defaults ? studyDefaults(studyId) : Promise.resolve(null),
  ]);
  return (
    <>
      <Pane title="Stages" rows={stages.rows} error={stages.error} />
      <Pane title="Instances" rows={instances.rows} error={instances.error} />
      {process ? <Pane title="Process defaults" rows={process.rows} error={process.error} /> : null}
    </>
  );
}

async function Manifest({ study }: { study: Row }) {
  const detail = await studyDocument(String(study.name ?? ""), String(study.version ?? ""));
  return <Pane title="Manifest" rows={detail.rows} error={detail.error} />;
}

async function Storage() {
  const [endpoints, profiles] = await Promise.all([listStorageEndpoints(), listStorageProfiles()]);
  return (
    <Workbench floor="Studies" title="Storage" summary="Published endpoints and profiles an operator can pick for a run.">
      <div className="panes">
        <Pane title="Endpoints" rows={endpoints.rows} error={endpoints.error} />
        <Pane title="Profiles" rows={profiles.rows} error={profiles.error} />
      </div>
    </Workbench>
  );
}

async function StorageAdmin() {
  const [endpoints, credentials] = await Promise.all([listStorageEndpoints(), listCredentials()]);
  return (
    <Workbench floor="Platform" title="Storage & credentials" summary="Endpoints and credentials. Secret values stay off this list.">
      <div className="panes">
        <Pane title="Endpoints" rows={endpoints.rows} error={endpoints.error} />
        <Pane title="Credentials" rows={credentials.rows} error={credentials.error} />
      </div>
    </Workbench>
  );
}

async function Definitions({ workflow }: { workflow?: string }) {
  const defs = await listWorkflowDefs();
  const versions = workflow ? await listWorkflowVersions(workflow) : null;
  return (
    <Workbench floor="Workflows" title="Definitions" summary="Workflow definitions and the versions of the one you open.">
      <form action="/desk/definitions">
        <label>
          Workflow
          <select name="workflow" defaultValue={workflow ?? ""} aria-label="Workflow">
            <option value="">Select a workflow</option>
            {defs.rows.map((row) => (
              <option key={String(row.workflow_def_id)} value={String(row.name)}>
                {String(row.name)}
              </option>
            ))}
          </select>
        </label>
        <button type="submit">Open</button>
      </form>
      <Pane title="Definitions" rows={defs.rows} error={defs.error} />
      {versions ? <Pane title="Versions" rows={versions.rows} error={versions.error} /> : <p className="note">Select a workflow to see its versions.</p>}
    </Workbench>
  );
}

async function Prediction({
  studies,
  study,
  picked,
  error,
}: {
  studies: Row[];
  study?: string;
  picked: Row | null;
  error?: string;
}) {
  return (
    <Workbench floor="Studies" title="Prediction" summary="Hyperparameter searches for the selected study.">
      <StudyForm action="/desk/prediction" studies={studies} study={study} />
      <Pane title="Studies" rows={studies} error={error} />
      {picked ? <Searches title="" floor="" summary="" study={Number(picked.id)} embedded /> : <Awaiting />}
    </Workbench>
  );
}

async function Searches({
  title,
  floor,
  summary,
  study,
  embedded = false,
}: {
  title: string;
  floor: string;
  summary: string;
  study: number | null;
  embedded?: boolean;
}) {
  const searches = await listSearches(study);
  const pane = <Pane title="Searches" rows={searches.rows} error={searches.error} />;
  if (embedded) return pane;
  return (
    <Workbench floor={floor} title={title} summary={summary}>
      {pane}
    </Workbench>
  );
}

async function Workers() {
  const [clusters, enrollments, health] = await Promise.all([
    listClusters(),
    listWorkerEnrollments(),
    listWorkerHealth(),
  ]);
  return (
    <Workbench floor="Platform" title="Clusters & workers" summary="Clusters, enrollments, and worker health.">
      <Pane title="Clusters" rows={clusters.rows} error={clusters.error} />
      <Pane title="Enrollments" rows={enrollments.rows} error={enrollments.error} />
      <Pane title="Health" rows={health.rows} error={health.error} />
    </Workbench>
  );
}

async function Simple({
  floor,
  title,
  summary,
  pane,
  load,
}: {
  floor: string;
  title: string;
  summary: string;
  pane: string;
  load: () => Promise<{ rows: Row[]; error?: string }>;
}) {
  const result = await load();
  return (
    <Workbench floor={floor} title={title} summary={summary}>
      <Pane title={pane} rows={result.rows} error={result.error} />
    </Workbench>
  );
}
