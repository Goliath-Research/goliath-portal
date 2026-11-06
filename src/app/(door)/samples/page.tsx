import { QueryPanel } from "@/components/query-panel";
import { readCustomerId } from "@/server/customer";
import { listSamplesByCustomer } from "@/server/omics";

export default async function SamplesPage() {
  const customerId = await readCustomerId();
  return (
    <div className="desk">
      <p className="kicker">Legacy clinical</p>
      <h1>Samples</h1>
      <p>Samples for the customer in the toolbar.</p>
      {customerId ? (
        <QueryPanel title={`Customer ${customerId}`} load={() => listSamplesByCustomer(customerId)} />
      ) : (
        <p className="note">Set a customer in the toolbar.</p>
      )}
    </div>
  );
}
