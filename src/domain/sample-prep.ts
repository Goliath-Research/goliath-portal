/**
 * Request body for portal.sp_request_study_start, matching
 * GoliathOmics workflow_engine/sql_pg/enqueue_sample_prep_test_start.sql.
 * The portal queues intent. It does not drain the queue or call the gateway.
 */
export type SamplePrepInput = {
  studyRowId: number;
  projectPath: string;
  workflowVersionId: number;
  samplesJson: string;
  sampleId: string;
  sampleDir: string;
  fastqPrefix: string;
  fastqStorageJson: string;
  sampleStorageJson: string;
  pipelineProfile: string;
  pipelineProcedure: string;
  createdBy: string;
};

export type SamplePrepRequest = {
  studyRowId: number;
  stage: "sample_prep";
  workflowVersionId: number;
  request: Record<string, unknown>;
  pipelineProfile: string | null;
  pipelineProcedure: string | null;
  createdBy: string;
};

export function buildSamplePrepRequest(input: SamplePrepInput): SamplePrepRequest {
  if (!Number.isInteger(input.studyRowId) || input.studyRowId <= 0) {
    throw new Error("Enter a published study.");
  }
  const projectPath = input.projectPath.trim();
  if (!projectPath) {
    throw new Error("Enter the project file.");
  }
  if (!Number.isInteger(input.workflowVersionId) || input.workflowVersionId < 0) {
    throw new Error("Workflow version must be 0, or a version number.");
  }

  let samples: unknown;
  const rawSamples = input.samplesJson.trim();
  if (rawSamples && rawSamples !== "[]") {
    samples = JSON.parse(rawSamples) as unknown;
    if (!Array.isArray(samples) || samples.length === 0) {
      throw new Error("Samples must be a non-empty list.");
    }
  } else {
    const sampleId = input.sampleId.trim();
    if (!sampleId) {
      throw new Error("Enter a sample, or a list of samples.");
    }
    const one: Record<string, string> = { sampleId };
    if (input.sampleDir.trim()) one.sampleDir = input.sampleDir.trim();
    if (input.fastqPrefix.trim()) one.fastqPrefix = input.fastqPrefix.trim();
    samples = [one];
  }

  let fastqStorage: unknown;
  try {
    fastqStorage = JSON.parse(input.fastqStorageJson) as unknown;
  } catch {
    throw new Error("FASTQ storage must be JSON.");
  }
  if (fastqStorage === null || typeof fastqStorage !== "object" || Array.isArray(fastqStorage)) {
    throw new Error("FASTQ storage must be a JSON object.");
  }

  const request: Record<string, unknown> = {
    projectPath,
    workflow_version_id: input.workflowVersionId,
    samples,
    fastqStorage,
  };

  const sampleStorage = input.sampleStorageJson.trim();
  if (sampleStorage && sampleStorage.toLowerCase() !== "null") {
    request.sampleStorage = JSON.parse(sampleStorage) as unknown;
  }

  const pipelineProfile = input.pipelineProfile.trim() || null;
  const pipelineProcedure = input.pipelineProcedure.trim() || null;
  if (pipelineProfile) request.pipelineProfile = pipelineProfile;
  if (pipelineProcedure) request.pipelineProcedure = pipelineProcedure;

  return {
    studyRowId: input.studyRowId,
    stage: "sample_prep",
    workflowVersionId: input.workflowVersionId,
    request,
    pipelineProfile,
    pipelineProcedure,
    createdBy: input.createdBy.trim() || "goliath-portal",
  };
}
