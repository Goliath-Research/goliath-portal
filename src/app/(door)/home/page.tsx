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
      <Pane title="Instances" rows={instances.rows} error={instances.error} />
      <Pane title="Expired leases" rows={leases.rows} error={leases.error} />
      <Pane title="Workers" rows={workers.rows} error={workers.error} />
    </Workbench>
  );
}
