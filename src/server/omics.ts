import { queryRows } from "@/server/db";
import {
  buildSamplePrepRequest,
  type SamplePrepInput,
  type SamplePrepRequest,
} from "@/domain/sample-prep";

export type Row = Record<string, unknown>;

/** portal.sp_list_diseases */
export function listDiseases() {
  return queryRows<Row>("SELECT * FROM portal.sp_list_diseases()");
}

/** portal.sp_list_groups_for_disease */
export function listGroupsForDisease(diseaseId: number, customerId: number | null) {
  return queryRows<Row>(
    "SELECT * FROM portal.sp_list_groups_for_disease($1, $2)",
    [diseaseId, customerId],
  );
}

/** portal.sp_list_groups_for_study_enrollment */
export function listGroupsForEnrollment(customerId: number | null) {
  return queryRows<Row>(
    "SELECT * FROM portal.sp_list_groups_for_study_enrollment($1)",
    [customerId],
  );
}

/** portal.sp_list_group_sample_names */
export function listGroupSampleNames(groupId: number) {
  return queryRows<Row>("SELECT * FROM portal.sp_list_group_sample_names($1)", [groupId]);
}

/** portal.sp_list_samples_for_study_enrollment */
export function listSamplesForStudyEnrollment(
  customerId: number | null,
  studyRowId: number | null,
  analyteId: number | null,
) {
  return queryRows<Row>(
    "SELECT * FROM portal.sp_list_samples_for_study_enrollment($1, $2, $3)",
    [customerId, studyRowId, analyteId],
  );
}

/** portal.sp_get_study_process_defaults */
export function getStudyProcessDefaults(studyRowId: number) {
  return queryRows<Row>("SELECT * FROM portal.sp_get_study_process_defaults($1)", [studyRowId]);
}

/** portal.sp_list_analyte_catalog — published, operator-visible */
export function listAnalyteCatalog(includeAdvanced: boolean) {
  return queryRows<Row>("SELECT * FROM portal.sp_list_analyte_catalog($1)", [includeAdvanced]);
}

/** portal.spgetsamplesbycustomer */
export function listSamplesByCustomer(customerId: number) {
  return queryRows<Row>("SELECT * FROM portal.spgetsamplesbycustomer($1)", [customerId]);
}

/** portal.spgetallinstitutionbycustomer */
export function listInstitutionsByCustomer(customerId: number) {
  return queryRows<Row>("SELECT * FROM portal.spgetallinstitutionbycustomer($1)", [customerId]);
}

type PreviewRow = {
  request_json: Record<string, unknown> | null;
  pipeline_profile_id: string | number | null;
  assay_procedure_id: string | number | null;
  site_id: string | number | null;
  storage_profile_id: string | number | null;
};

/**
 * portal.sp_preview_study_start then portal.sp_request_study_start.
 * Same argument order as enqueue_sample_prep_test_start.sql.
 * Returns the queue row. Draining stays on methyl-study-start.
 */
export async function requestSamplePrep(input: SamplePrepInput) {
  const plan = buildSamplePrepRequest(input);
  const versionId = await resolveSamplePrepVersion(plan.workflowVersionId);
  const preview = await queryRows<PreviewRow>(
    "SELECT * FROM portal.sp_preview_study_start($1, $2, $3, $4, $5)",
    [plan.studyRowId, plan.stage, versionId, plan.pipelineProfile, plan.pipelineProcedure],
  );
  const first = preview[0];
  const request = {
    ...(first?.request_json ?? {}),
    ...plan.request,
    workflow_version_id: versionId,
  };
  const queued = await queryRows<Row>(
    `SELECT * FROM portal.sp_request_study_start(
       $1, $2, $3, $4::jsonb, $5, $6, $7, $8, $9, $10
     )`,
    [
      plan.studyRowId,
      plan.stage,
      versionId,
      JSON.stringify(request),
      first?.pipeline_profile_id ?? null,
      first?.assay_procedure_id ?? null,
      first?.site_id ?? null,
      first?.storage_profile_id ?? null,
      plan.createdBy,
      null,
    ],
  );
  return { plan: { ...plan, workflowVersionId: versionId, request } satisfies SamplePrepRequest, queued };
}

async function resolveSamplePrepVersion(requested: number): Promise<number> {
  if (requested > 0) return requested;
  const rows = await queryRows<{ id: string | number }>(
    `SELECT v.id
     FROM wf.workflow_def d
     JOIN wf.workflow_version v ON v.workflow_def_id = d.id
     WHERE d.name = 'SamplePrepPipeline'
       AND v.is_active
       AND v.root_node_id IS NOT NULL
     ORDER BY v.version_major DESC, v.version_minor DESC, v.id DESC
     LIMIT 1`,
  );
  const id = Number(rows[0]?.id);
  if (!Number.isInteger(id) || id <= 0) {
    throw new Error(
      "No active SamplePrepPipeline version. Deploy workflow definitions or pass workflow_version_id.",
    );
  }
  return id;
}
