import { QueryPanel } from "@/components/query-panel";
import { readCustomerId } from "@/server/customer";
import { listInstitutionsByCustomer } from "@/server/omics";

export default async function InstitutionsPage() {
  const customerId = await readCustomerId();
  return (
    <div className="desk">
      <p className="kicker">Legacy clinical</p>
      <h1>Institutions</h1>
      <p>Institutions for the customer in the toolbar.</p>
      {customerId ? (
        <QueryPanel
          title={`Customer ${customerId}`}
          load={() => listInstitutionsByCustomer(customerId)}
        />
      ) : (
        <p className="note">Set a customer in the toolbar.</p>
      )}
    </div>
  );
}
