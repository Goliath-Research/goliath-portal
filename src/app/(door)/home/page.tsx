import { Pane, Workbench } from "@/components/workbench";
import { listOpsInstances, listStaleLeases, listWorkerHealth } from "@/server/screens";

export default async function HomePage({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const status = (await searchParams).status ?? "";
  const [instances, leases, workers] = await Promise.all([
    listOpsInstances(status),
    listStaleLeases(),
    listWorkerHealth(),
  ]);

  return (
    <Workbench
      floor="Home"
      title="Ops board"
      summary={`${instances.rows.length} instances · ${leases.rows.length} expired leases · ${workers.rows.length} workers`}
    >
      <div className="toolbar">
        <a href="/home">Refresh</a>
        <button type="button" disabled>Auto-refresh</button>
        <a href="/studies?leaf=runs&tab=monitor">Open in Study Control</a>
        <button type="button" disabled>Reclaim expired leases</button>
      </div>
      <form action="/home">
        <label>
          Status
          <select name="status" defaultValue={status} aria-label="Status">
            <option value="">Ops-relevant</option>
            <option value="RUNNING">Running</option>
            <option value="FAILED">Failed</option>
            <option value="CREATED">Created</option>
            <option value="COMPLETED">Completed</option>
          </select>
        </label>
        <button type="submit">Refresh</button>
      </form>
      <Pane
        title="Instances"
        rows={instances.rows}
        error={instances.error}
        columns={[
          { key: "instance_id", label: "Instance" },
          { key: "workflow_def_name", label: "Workflow" },
          { key: "version_major", label: "Maj" },
          { key: "version_minor", label: "Min" },
          { key: "status", label: "Status" },
          { key: "study_name", label: "Study" },
          { key: "started_at_utc", label: "Started" },
          { key: "completed_at_utc", label: "Completed" },
        ]}
      />
      <div className="instrument">
        <Pane title="Expired leases" rows={leases.rows} error={leases.error} />
        <Pane title="Worker health" rows={workers.rows} error={workers.error} />
      </div>
    </Workbench>
  );
}
