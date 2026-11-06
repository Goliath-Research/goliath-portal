import { DataTable } from "@/components/data-table";
import { DocumentFrame, FrameToolbar } from "@/components/document-frame";
import { Pane, StudyForm, Workbench } from "@/components/workbench";
import { bestTrialCaption } from "@/domain/hpo";
import { layoutGraph } from "@/domain/workflow-graph";
import { readCustomerId } from "@/server/customer";
import { listGroupsForEnrollment } from "@/server/omics";
import {
  chosenStudy,
  documentText,
  getHyperparamSearch,
  getNamed,
  getSite,
  getWorkflowGraph,
  listActions,
  listClusters,
  listContracts,
  listCredentials,
  listDomainPrograms,
  listPipelineProfiles,
  listReferenceAssets,
  listSearches,
  listSites,
  listStorageEndpoints,
  listStorageProfiles,
  listStudies,
  listStudyGroupMembers,
  listStudyGroups,
  listStudyInstances,
  listStudyStages,
  listWorkerEnrollments,
  listWorkerHealth,
  listWorkflowDefs,
  listWorkflowVersions,
  studyDefaults,
  studyDocument,
  studyProgress,
  type Grid,
  type Row,
} from "@/server/screens";

export async function Screen({
  leaf,
  study,
  workflow,
  doc,
  version,
  sheet,
  tab,
  group,
  trial,
}: {
  leaf: string;
  study?: string;
  workflow?: string;
  doc?: string;
  version?: string;
  sheet?: string;
  tab?: string;
  group?: string;
  trial?: string;
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
      return <Runs studies={studies.rows} study={study} picked={picked} error={studies.error} tab={tab} />;
    case "manifests":
      return <Manifests studies={studies} study={study} picked={picked} sheet={sheet} group={group} />;
    case "definitions":
      return <Definitions workflow={workflow} version={version} />;
    case "site":
      return (
        <Catalog
          floor="Platform"
          title="Site"
          summary="Sites, their document, and the assets linked to the one you open."
          listTitle="Sites"
          baseHref="/desk/site"
          load={listSites}
          doc={doc}
          version={version}
          editing
          open={(row) => getSite(Number(row.id))}
        />
      );
    case "profiles":
      return (
        <Catalog
          floor="Platform"
          title="Pipeline profiles"
          summary="Profile packs. The document on the right is read-only."
          listTitle="Pipeline profiles"
          baseHref="/desk/profiles"
          load={listPipelineProfiles}
          doc={doc}
          version={version}
          open={(row) => getNamed("sp_get_pipeline_profile", String(row.name ?? ""), String(row.version ?? ""))}
        />
      );
    case "programs":
      return (
        <Catalog
          floor="Platform"
          title="Domain programs"
          summary="Domain programs, their document, and the linked workflow."
          listTitle="Domain programs"
          baseHref="/desk/programs"
          load={listDomainPrograms}
          doc={doc}
          version={version}
          editing
          open={(row) => getNamed("sp_get_domain_program", String(row.name ?? ""), String(row.version ?? ""))}
        />
      );
    case "catalog":
      return <ActionCatalog />;
    case "storage-admin":
      return <StorageAdmin doc={doc} version={version} sheet={sheet} />;
    case "assets":
      return (
        <Catalog
          floor="Platform"
          title="Reference assets"
          summary="Genomes, annotations, and caches, with the document of the one you open."
          listTitle="Reference assets"
          baseHref="/desk/assets"
          load={listReferenceAssets}
          doc={doc}
          version={version}
          open={(row) => getNamed("sp_get_reference_asset", String(row.name ?? ""), String(row.version ?? ""))}
        />
      );
    case "workers":
      return <Workers sheet={sheet} />;
    case "hpo":
      return <Hpo search={doc} trial={trial} />;
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

async function Manifests({
  studies,
  study,
  picked,
  sheet,
  group,
}: {
  studies: Grid;
  study?: string;
  picked: Row | null;
  sheet?: string;
  group?: string;
}) {
  const enrollment = sheet === "enrollment";
  const detail = picked ? await studyDocument(String(picked.name ?? ""), String(picked.version ?? "")) : null;
  const record = detail?.rows[0] ?? picked;
  const href = (name: string) => `/studies?leaf=manifests&sheet=${name}${study ? `&study=${study}` : ""}`;
  return (
    <Workbench floor="Studies" title="Project manifests" summary="Study identity, then the enrollment arms of the study you open.">
      <div className="sheets">
        <a className={enrollment ? undefined : "on"} href={href("study")}>Study</a>
        <a className={enrollment ? "on" : undefined} href={href("enrollment")}>Enrollment</a>
      </div>
      <div className="instrument">
        <section className="panel">
          <h2>Studies</h2>
          {studies.error ? <p>{studies.error}</p> : (
            <DataTable
              rows={studies.rows}
              columns={[{ key: "display_name", label: "Study" }, { key: "status", label: "Status" }]}
              rowHref={(row) => `/studies?leaf=manifests&sheet=${enrollment ? "enrollment" : "study"}&study=${String(row.id ?? "")}`}
              rowKey={(row) => String(row.id ?? "")}
              selectedKey={study}
            />
          )}
        </section>
        {enrollment ? <Enrollment record={record} group={group} /> : <StudyIdentity record={record} detailError={detail?.error} />}
      </div>
    </Workbench>
  );
}

async function StudyIdentity({ record, detailError }: { record: Row | null; detailError?: string }) {
  const profiles = await listStorageProfiles();
  const name = text(record?.name);
  const folder = text(record?.study_id);
  const profile = text(record?.archive_profile_key);
  const status = text(record?.status) || "ACTIVE";
  const keys = profiles.rows.map((row) => text(row.profile_key || row.key || row.name)).filter(Boolean);
  return (
    <div className="detail">
      <h2>Study</h2>
      {detailError ? <p className="note">{detailError}</p> : null}
      <div className="start-grid">
        <Field label="Study name" value={name} />
        <Field label="Display name" value={text(record?.display_name)} />
        <Field label="Study folder (study_id)" value={folder} />
        <label>
          Storage profile
          <select aria-label="Storage profile" disabled defaultValue={profile}>
            <option value="">{keys.length ? "Select a profile" : "No published profiles"}</option>
            {keys.map((key) => <option key={key} value={key}>{key}</option>)}
            {profile && !keys.includes(profile) ? <option value={profile}>{profile}</option> : null}
          </select>
        </label>
        <label>
          Status
          <select aria-label="Status" disabled defaultValue={status}>
            <option value="ACTIVE">ACTIVE</option>
            <option value="DISABLED">DISABLED</option>
            {status !== "ACTIVE" && status !== "DISABLED" ? <option value={status}>{status}</option> : null}
          </select>
        </label>
      </div>
      <p className="note">Path: {materializedPath(folder, name)}</p>
      <div className="toolbar">
        <button type="button" disabled>New</button>
        <button type="button" className="primary" disabled>Save</button>
        <a href={`/studies?leaf=manifests&sheet=study${record?.id ? `&study=${text(record.id)}` : ""}`}>Refresh</a>
      </div>
    </div>
  );
}

async function Enrollment({ record, group }: { record: Row | null; group?: string }) {
  const studyId = Number(record?.id ?? record?.study_row_id);
  const groupId = Number(group);
  const customerId = await readCustomerId();
  const [groups, members, clinical] = await Promise.all([
    Number.isInteger(studyId) && studyId > 0 ? listStudyGroups(studyId) : Promise.resolve({ rows: [], error: undefined }),
    Number.isInteger(groupId) && groupId > 0 ? listStudyGroupMembers(groupId) : Promise.resolve(null),
    listGroupsForEnrollment(customerId)
      .then((rows) => ({ rows, error: undefined as string | undefined }))
      .catch((error: unknown) => ({ rows: [] as Row[], error: error instanceof Error ? error.message : "The portal database could not be read." })),
  ]);
  const studyQuery = record ? `&study=${String(record.id ?? record.study_row_id ?? "")}` : "";
  return (
    <div className="detail">
      <h2>Enrollment</h2>
      <div className="start-grid">
        <label>
          Role
          <select aria-label="Role" disabled defaultValue="control">
            <option value="control">control</option>
            <option value="disease">disease</option>
          </select>
        </label>
        <Field label="Label" />
        <Field label="List filename" />
      </div>
      <div className="toolbar">
        <button type="button" disabled>Save group</button>
        <a href={`/studies?leaf=manifests&sheet=enrollment${studyQuery}`}>Refresh groups</a>
        <button type="button" disabled>Materialize lists</button>
        <button type="button" disabled>Remove</button>
        <button type="button" disabled>Save members</button>
        <button type="button" disabled>Add group</button>
      </div>
      <section className="panel">
        <h2>Arms</h2>
        {groups.error ? <p>{groups.error}</p> : (
          <DataTable
            rows={groups.rows}
            columns={[
              { key: "role", label: "Role" },
              { key: "label", label: "Label" },
              { key: "list_filename", label: "CSV file" },
              { key: "member_count", label: "Members" },
            ]}
            rowHref={(row) => `/studies?leaf=manifests&sheet=enrollment${studyQuery}&group=${String(row.id ?? "")}`}
            rowKey={(row) => String(row.id ?? "")}
            selectedKey={group}
          />
        )}
      </section>
      {members ? (
        <Pane title="Membership" rows={members.rows} error={members.error} columns={[{ key: "portal_sample_id", label: "Sample" }, { key: "processing_sample_key", label: "Processing key" }]} />
      ) : (
        <Pane title="Membership" rows={[]} columns={[{ key: "portal_sample_id", label: "Sample" }, { key: "processing_sample_key", label: "Processing key" }]} />
      )}
      <Pane title="Clinical groups" rows={clinical.rows} error={clinical.error} columns={[{ key: "group_name", label: "Group" }, { key: "Description", label: "Description" }, { key: "sample_count", label: "Samples" }]} />
    </div>
  );
}

function materializedPath(folder: string, name: string): string {
  const dir = folder.trim() || name.trim();
  if (!dir || !name.trim()) return "-";
  return `/work/projects/${dir}/configs/project_${name.trim()}.json`;
}

function text(value: unknown): string {
  return value == null ? "" : String(value);
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

async function StorageAdmin({ doc, version, sheet }: { doc?: string; version?: string; sheet?: string }) {
  const which = sheet === "credentials" ? "credentials" : "endpoints";
  const endpoints = await listStorageEndpoints();
  const credentials = await listCredentials();
  const rows = which === "credentials" ? credentials.rows : endpoints.rows;
  const error = which === "credentials" ? credentials.error : endpoints.error;
  const selected = pick(rows, doc, version);
  const json = selected && which === "endpoints"
    ? documentText(await getNamed("sp_get_storage_endpoint", String(selected.name ?? ""), String(selected.version ?? "")))
    : { text: selected ? "Secrets are never listed." : "", error: undefined as string | undefined };
  return (
    <Workbench floor="Platform" title="Storage & credentials" summary="Endpoints and credentials. Secret values stay off this list.">
      <div className="sheets">
        <a className={which === "endpoints" ? "on" : undefined} href="/desk/storage-admin?sheet=endpoints">Endpoints</a>
        <a className={which === "credentials" ? "on" : undefined} href="/desk/storage-admin?sheet=credentials">Credentials</a>
      </div>
      {error ? <p className="alert">{error}</p> : null}
      <FrameToolbar refreshHref={`/desk/storage-admin?sheet=${which}`} editing={which === "endpoints"} />
      <DocumentFrame
        listTitle={which === "endpoints" ? "Storage endpoints" : "Credentials"}
        rows={rows}
        baseHref={`/desk/storage-admin?sheet=${which}`}
        selected={selected}
        jsonText={json.text}
        jsonError={json.error}
      />
    </Workbench>
  );
}

async function Catalog({
  floor,
  title,
  summary,
  listTitle,
  baseHref,
  load,
  doc,
  version,
  editing,
  open,
}: {
  floor: string;
  title: string;
  summary: string;
  listTitle: string;
  baseHref: string;
  load: () => Promise<Grid>;
  doc?: string;
  version?: string;
  editing?: boolean;
  open: (row: Row) => Promise<Grid>;
}) {
  const listed = await load();
  const selected = pick(listed.rows, doc, version);
  const json = selected ? documentText(await open(selected)) : { text: "", error: undefined as string | undefined };
  return (
    <Workbench floor={floor} title={title} summary={summary}>
      {listed.error ? <p className="alert">{listed.error}</p> : null}
      <FrameToolbar refreshHref={baseHref} editing={editing} />
      <DocumentFrame
        listTitle={listTitle}
        rows={listed.rows}
        baseHref={baseHref}
        selected={selected}
        jsonText={json.text}
        jsonError={json.error}
      />
    </Workbench>
  );
}

function pick(rows: Row[], doc?: string, version?: string): Row | null {
  if (!doc) return null;
  return (
    rows.find((row) => String(row.id ?? "") === doc || (String(row.name ?? "") === doc && (!version || String(row.version ?? "") === version))) ??
    null
  );
}

async function ActionCatalog() {
  const actions = await listActions();
  return (
    <Workbench floor="Platform" title="Action catalog" summary="Action definitions, implementation, and schema ids.">
      <FrameToolbar refreshHref="/desk/catalog" />
      <Pane
        title="Action definitions"
        rows={actions.rows}
        error={actions.error}
        columns={[
          { key: "name", label: "Action" },
          { key: "version", label: "Version" },
          { key: "status", label: "Status" },
          { key: "implementation", label: "Implementation" },
        ]}
      />
    </Workbench>
  );
}

async function Runs({
  studies,
  study,
  picked,
  error,
  tab,
}: {
  studies: Row[];
  study?: string;
  picked: Row | null;
  error?: string;
  tab?: string;
}) {
  const monitor = tab === "monitor";
  const href = (name: string) => `/studies?leaf=runs&tab=${name}${study ? `&study=${study}` : ""}`;
  return (
    <Workbench floor="Studies" title="Runs" summary="Start assembles a run. Monitor follows its instances and tasks.">
      <div className="sheets">
        <a className={monitor ? undefined : "on"} href={href("start")}>Start</a>
        <a className={monitor ? "on" : undefined} href={href("monitor")}>Monitor</a>
      </div>
      <StudyForm action="/studies" studies={studies} study={study} hidden={{ leaf: "runs", tab: monitor ? "monitor" : "start" }} />
      {monitor ? (
        picked ? <Lifecycle studyId={Number(picked.id)} defaults /> : <Awaiting />
      ) : (
        <StartSheet studiesError={error} studyName={picked ? String(picked.name ?? "") : ""} />
      )}
    </Workbench>
  );
}

function StartSheet({ studiesError, studyName }: { studiesError?: string; studyName: string }) {
  return (
    <div className="detail">
      {studiesError ? <p className="note">{studiesError}</p> : null}
      <div className="start-grid">
        <Field label="Workflow" />
        <Field label="Version" />
        <Field label="Study" value={studyName} />
        <Field label="Disease" />
        <Field label="Group" />
        <Field label="Reference FASTA" />
        <Field label="Pipeline profile" />
        <Field label="Group samples" />
      </div>
      <label>
        FASTQ storage
        <textarea rows={3} defaultValue='{"type":"file","basePath":"/data/fastqs"}' readOnly />
      </label>
      <div className="toolbar">
        <button type="button" disabled>Build context</button>
        <button type="button" className="primary" disabled>Start instance</button>
      </div>
    </div>
  );
}

function Field({ label, value = "" }: { label: string; value?: string }) {
  return (
    <label>
      {label}
      <input readOnly value={value} aria-label={label} />
    </label>
  );
}

async function Definitions({ workflow, version }: { workflow?: string; version?: string }) {
  const defs = await listWorkflowDefs();
  const versions = workflow ? await listWorkflowVersions(workflow) : { rows: [], error: undefined as string | undefined };
  const versionId = Number(version);
  const graph = Number.isInteger(versionId) && versionId > 0 ? await getWorkflowGraph(versionId) : null;
  const spec = graph?.rows[0]?.graph_json ?? graph?.rows[0];
  const nodes = graph && !graph.error ? layoutGraph(spec) : [];
  const picked = versions.rows.find((row) => String(row.workflow_version_id ?? row.id ?? "") === version);
  return (
    <Workbench floor="Workflows" title="Definitions" summary="Load a workflow version and read its graph. Saving a version stays on the designer.">
      <form action="/desk/definitions" className="designer-bar">
        <label>
          Workflow
          <select name="workflow" defaultValue={workflow ?? ""} aria-label="Workflow">
            <option value="">Select a workflow</option>
            {defs.rows.map((row) => (
              <option key={String(row.workflow_def_id ?? row.id ?? row.name)} value={String(row.name)}>
                {String(row.name)}
              </option>
            ))}
          </select>
        </label>
        <label>
          Version
          <select name="version" defaultValue={version ?? ""} aria-label="Version">
            <option value="">Select a version</option>
            {versions.rows.map((row) => {
              const id = String(row.workflow_version_id ?? row.id ?? "");
              return <option key={id || String(row.version)} value={id}>{String(row.version ?? id)}</option>;
            })}
          </select>
        </label>
        <button type="submit">Load</button>
        <button type="button" disabled>New</button>
        <button type="button" disabled>Validate</button>
        <button type="button" disabled>Save as new version</button>
      </form>
      {defs.error ? <p className="alert">{defs.error}</p> : null}
      {versions.error ? <p className="alert">{versions.error}</p> : null}
      <div className="start-grid">
        <Field label="Name" value={text(picked?.name ?? workflow)} />
        <Field label="Description" value={text(picked?.description)} />
        <label className="check">
          <input type="checkbox" disabled />
          Activate on save
        </label>
      </div>
      <div className="toolbar">
        <label>
          Type
          <select aria-label="Type" disabled defaultValue="ACTION">
            {["SEQUENCE", "PARALLEL", "IF", "SWITCH", "REPEAT", "WHILE", "FOREACH", "ACTION"].map((type) => (
              <option key={type} value={type}>{type}</option>
            ))}
          </select>
        </label>
        <label>
          Branch
          <select aria-label="Branch" disabled defaultValue="">
            <option value="">Branch</option>
            <option value="THEN">THEN</option>
            <option value="ELSE">ELSE</option>
            <option value="BODY">BODY</option>
          </select>
        </label>
        <button type="button" disabled>Add child</button>
        <button type="button" disabled>Add sibling</button>
        <button type="button" disabled>Delete</button>
        <button type="button" disabled>Up</button>
        <button type="button" disabled>Down</button>
        <button type="button" disabled>Activate version</button>
      </div>
      <div className="graph" aria-label="Workflow graph">
        {graph?.error ? null : nodes.length === 0 ? <p className="empty">Select a version to load its graph.</p> : nodes.map((node) => (
          <div key={`${node.depth}-${node.key}`} className="graph-node" style={{ paddingLeft: node.depth * 20 }}>
            <span className="graph-type">{node.type}</span>
            <span>{node.key}{node.action ? ` · ${node.action}` : ""}</span>
          </div>
        ))}
      </div>
      <p className="note">{graph?.error ?? "Ready."}</p>
    </Workbench>
  );
}

async function Hpo({ search, trial }: { search?: string; trial?: string }) {
  const searches = await listSearches(null);
  const searchId = Number(search);
  const open = Number.isInteger(searchId) && searchId > 0 ? await getHyperparamSearch(searchId) : null;
  const selected = searches.rows.find((row) => String(row.search_id ?? row.id ?? "") === search);
  const studyId = selected?.study_row_id;
  const trialRow = open?.rows.find((row) => String(row.trial_index ?? "") === trial);
  const overrides = trialRow?.overrides_json;
  const caption = search ? (open?.error ? "Best trial: (select a search)" : bestTrialCaption(open?.rows ?? [])) : "Best trial: (select a search)";
  return (
    <Workbench floor="Hyperparameters" title="HPO Monitor" summary="Searches, the best feasible trial, and the overrides of the trial you open.">
      <div className="toolbar">
        <a href="/desk/hpo">Refresh</a>
        <label className="check">
          <input type="checkbox" disabled />
          Auto-refresh
        </label>
        <select aria-label="Refresh interval" disabled defaultValue="5s">
          <option>3s</option>
          <option>5s</option>
          <option>10s</option>
          <option>30s</option>
        </select>
        <a href={`/studies?leaf=runs&tab=monitor${studyId ? `&study=${String(studyId)}` : ""}`}>Open in Study Control</a>
        <a href={search && trial ? `/desk/hpo?doc=${search}&trial=${trial}#overrides` : "#overrides"}>View overrides</a>
      </div>
      <section className="panel">
        <h2>Searches</h2>
        {searches.error ? <p>{searches.error}</p> : (
          <DataTable
            rows={searches.rows}
            columns={[
              { key: "search_id", label: "Search" },
              { key: "display_name", label: "Name" },
              { key: "status", label: "Status" },
              { key: "trial_count", label: "Trials" },
              { key: "scored_count", label: "Scored" },
              { key: "created_at_utc", label: "Created (UTC)" },
              { key: "created_by", label: "By" },
              { key: "study_row_id", label: "Study" },
            ]}
            rowHref={(row) => `/desk/hpo?doc=${String(row.search_id ?? row.id ?? "")}`}
            rowKey={(row) => String(row.search_id ?? row.id ?? "")}
            selectedKey={search}
          />
        )}
      </section>
      <p className="best">{caption}</p>
      {open?.error ? <p className="alert">{open.error}</p> : (
        <section className="panel">
          <h2>Trials</h2>
          <DataTable
            rows={open?.rows ?? []}
            columns={[
              { key: "trial_index", label: "#" },
              { key: "instance_status", label: "Instance" },
              { key: "trial_status", label: "Trial" },
              { key: "objective", label: "Objective" },
              { key: "feasible", label: "Feasible" },
              { key: "workflow_instance_id", label: "Instance Id" },
              { key: "execution_scope_key", label: "Scope" },
              { key: "overrides_json", label: "Overrides" },
            ]}
            rowHref={search ? (row) => `/desk/hpo?doc=${search}&trial=${String(row.trial_index ?? "")}` : undefined}
            rowKey={(row, index) => String(row.trial_index ?? index)}
            selectedKey={trial}
          />
        </section>
      )}
      <div className="detail" id="overrides">
        <h2>Overrides</h2>
        <pre className="json-view">{overrides == null || overrides === "" ? "Select a trial to view overrides." : typeof overrides === "string" ? overrides : JSON.stringify(overrides, null, 2)}</pre>
      </div>
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

async function Workers({ sheet }: { sheet?: string }) {
  const which = sheet === "fleet" ? "fleet" : sheet === "clusters" ? "clusters" : "workers";
  const [clusters, enrollments, health] = await Promise.all([
    listClusters(),
    listWorkerEnrollments(),
    listWorkerHealth(),
  ]);
  const pane =
    which === "clusters" ? (
      <Pane title="Clusters" rows={clusters.rows} error={clusters.error} columns={[{ key: "cluster_key", label: "Cluster key" }, { key: "name", label: "Name" }, { key: "status", label: "Status" }]} />
    ) : which === "fleet" ? (
      <Pane title="Registered workers" rows={health.rows} error={health.error} />
    ) : (
      <Pane title="Worker enrollments" rows={enrollments.rows} error={enrollments.error} columns={[{ key: "cluster_key", label: "Cluster" }, { key: "public_ip", label: "Public IP" }, { key: "external_worker_key", label: "External worker key" }]} />
    );
  return (
    <Workbench floor="Platform" title="Clusters & workers" summary="Enroll workers, watch the live fleet, and keep clusters.">
      <div className="sheets">
        <a className={which === "workers" ? "on" : undefined} href="/desk/workers?sheet=workers">Workers</a>
        <a className={which === "fleet" ? "on" : undefined} href="/desk/workers?sheet=fleet">Live fleet</a>
        <a className={which === "clusters" ? "on" : undefined} href="/desk/workers?sheet=clusters">Clusters</a>
      </div>
      <div className="toolbar">
        <a href={`/desk/workers?sheet=${which}`}>Refresh</a>
        {which === "workers" ? (
          <>
            <button type="button" disabled>Add / Upsert</button>
            <button type="button" disabled>Revoke</button>
          </>
        ) : null}
        {which === "fleet" ? (
          <>
            <button type="button" disabled>Active</button>
            <button type="button" disabled>Drain</button>
            <button type="button" disabled>Stop</button>
          </>
        ) : null}
        {which === "clusters" ? (
          <>
            <button type="button" disabled>New</button>
            <button type="button" disabled>Save</button>
            <button type="button" disabled>Edit CIDRs</button>
          </>
        ) : null}
      </div>
      {pane}
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
