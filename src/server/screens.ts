import { queryRows } from "@/server/db";

export type Row = Record<string, unknown>;

export type Grid = {
  rows: Row[];
  error?: string;
};

export async function grid(sql: string, params: unknown[] = []): Promise<Grid> {
  try {
    return { rows: await queryRows<Row>(sql, params) };
  } catch (error) {
    const message = error instanceof Error ? error.message : "The portal database could not be read.";
    return { rows: [], error: message };
  }
}

export function listStudies() {
  return grid("SELECT * FROM portal.sp_list_studies($1)", [false]);
}

export function listOpsInstances(status: string) {
  return grid("SELECT * FROM portal.sp_list_ops_instances($1, $2)", [status || null, 100]);
}

export function listStaleLeases() {
  return grid("SELECT * FROM portal.sp_list_stale_leases($1)", [200]);
}

export function listWorkerHealth() {
  return grid("SELECT * FROM portal.sp_list_worker_health($1)", [null]);
}

export function listStudyInstances(studyId: number) {
  return grid("SELECT * FROM portal.sp_list_study_instances($1, $2, $3)", [studyId, null, 50]);
}

export function listStudyStages(studyId: number) {
  return grid("SELECT * FROM portal.sp_list_study_start_stages($1)", [studyId]);
}

export function studyProgress(studyId: number) {
  return grid("SELECT * FROM portal.sp_get_study_pipeline_progress($1)", [studyId]);
}

export function studyDefaults(studyId: number) {
  return grid("SELECT * FROM portal.sp_get_study_process_defaults($1)", [studyId]);
}

export function studyDocument(name: string, version: string) {
  return grid("SELECT id, name, version, status, study_id FROM portal.sp_get_study($1, $2)", [name, version]);
}

export function listStorageEndpoints() {
  return grid("SELECT * FROM portal.sp_list_storage_endpoints($1)", [false]);
}

export function listStorageProfiles() {
  return grid("SELECT * FROM portal.sp_list_storage_profiles($1)", [false]);
}

export function listCredentials() {
  return grid("SELECT * FROM portal.sp_list_credentials($1)", [false]);
}

export function listWorkflowDefs() {
  return grid("SELECT * FROM portal.sp_list_workflow_defs($1)", [null]);
}

export function listWorkflowVersions(name: string) {
  return grid("SELECT * FROM portal.sp_list_workflow_versions($1, $2)", [null, name]);
}

export function listSites() {
  return grid("SELECT * FROM portal.sp_list_sites($1)", [false]);
}

export function listPipelineProfiles() {
  return grid("SELECT * FROM portal.sp_list_pipeline_profiles($1)", [false]);
}

export function listActions() {
  return grid("SELECT * FROM portal.sp_list_cfg_actions()");
}

export function listReferenceAssets() {
  return grid("SELECT * FROM portal.sp_list_reference_assets($1, $2)", [false, null]);
}

export function listClusters() {
  return grid("SELECT * FROM portal.sp_list_clusters()");
}

export function listWorkerEnrollments() {
  return grid("SELECT * FROM portal.sp_list_worker_enrollments($1)", [null]);
}

export function listSearches(studyId: number | null) {
  return grid("SELECT * FROM portal.sp_list_hyperparam_searches($1, $2)", [null, studyId]);
}

export function listContracts() {
  return grid("SELECT * FROM portal.sp_list_contracts($1)", [true]);
}

export function chosenStudy(studies: Row[], selected: string | undefined): Row | null {
  const id = Number(selected);
  if (!Number.isInteger(id) || id <= 0) return null;
  return studies.find((row) => Number(row.id) === id) ?? null;
}
