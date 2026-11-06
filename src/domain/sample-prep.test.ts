import { describe, expect, it } from "vitest";
import { buildSamplePrepRequest } from "./sample-prep";

const base = {
  studyRowId: 42,
  projectPath: "/work/projects/my-study/configs/project_my-study.json",
  workflowVersionId: 0,
  samplesJson: "",
  sampleId: "S1",
  sampleDir: "",
  fastqPrefix: "S1/",
  fastqStorageJson: '{"type":"file","basePath":"/data/fastqs"}',
  sampleStorageJson: "",
  pipelineProfile: "",
  pipelineProcedure: "",
  createdBy: "goliath-portal",
};

describe("buildSamplePrepRequest", () => {
  it("builds one sample when samples_json is empty", () => {
    const plan = buildSamplePrepRequest(base);
    expect(plan.stage).toBe("sample_prep");
    expect(plan.request.samples).toEqual([{ sampleId: "S1", fastqPrefix: "S1/" }]);
    expect(plan.request.projectPath).toBe(base.projectPath);
  });

  it("keeps an explicit samples array", () => {
    const plan = buildSamplePrepRequest({
      ...base,
      samplesJson: '[{"sampleId":"S9","fastqPrefix":"S9/"}]',
    });
    expect(plan.request.samples).toEqual([{ sampleId: "S9", fastqPrefix: "S9/" }]);
  });

  it("rejects a missing study and a missing manifest", () => {
    expect(() => buildSamplePrepRequest({ ...base, studyRowId: 0 })).toThrow(/published study/);
    expect(() => buildSamplePrepRequest({ ...base, projectPath: "  " })).toThrow(/project file/);
  });
});
