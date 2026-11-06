import { queueSamplePrep } from "@/app/actions";

export default async function SamplePrepPage({
  searchParams,
}: {
  searchParams: Promise<{ queued?: string; error?: string }>;
}) {
  const params = await searchParams;
  return (
    <div className="desk">
      <div>
        <p className="kicker">Studies</p>
        <h1>Sample prep</h1>
        <p>Queue a sample prep run. It starts when an operator drains the queue.</p>
      </div>
      {params.error ? <p className="alert">{params.error}</p> : null}
      {params.queued ? (
        <p className="alert ok">
          Queued request {params.queued}. Drain with methyl-study-start drain-requests.
        </p>
      ) : null}
      <form action={queueSamplePrep} className="stack">
        <Field name="studyRowId" label="Study" type="number" required />
        <Field
          name="projectPath"
          label="Project file"
          required
          placeholder="/work/projects/my-study/configs/project.json"
        />
        <Field
          name="workflowVersionId"
          label="Workflow version"
          type="number"
          defaultValue="0"
          placeholder="0 uses the active workflow"
        />
        <Field name="sampleId" label="Sample" placeholder="S1" />
        <Field name="fastqPrefix" label="FASTQ prefix" placeholder="S1/" />
        <Field name="sampleDir" label="Sample folder" />
        <label>
          Samples
          <textarea
            name="samplesJson"
            rows={3}
            placeholder='[{"sampleId":"S1","fastqPrefix":"S1/"}]'
            className="mt-1 w-full rounded border border-stone-300 px-2 py-1 font-mono text-xs"
          />
        </label>
        <label>
          FASTQ storage
          <textarea
            name="fastqStorageJson"
            required
            rows={2}
            defaultValue='{"type":"file","basePath":"/data/fastqs"}'
            className="mt-1 w-full rounded border border-stone-300 px-2 py-1 font-mono text-xs"
          />
        </label>
        <Field name="sampleStorageJson" label="Sample storage" />
        <Field name="pipelineProfile" label="Pipeline profile" />
        <Field name="pipelineProcedure" label="Pipeline procedure" />
        <button type="submit">Enqueue</button>
      </form>
    </div>
  );
}

function Field({
  name,
  label,
  type = "text",
  required,
  placeholder,
  defaultValue,
}: {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
  placeholder?: string;
  defaultValue?: string;
}) {
  return (
    <label>
      {label}
      <input
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        defaultValue={defaultValue}
        className="mt-1 w-full rounded border border-stone-300 px-2 py-1"
      />
    </label>
  );
}
