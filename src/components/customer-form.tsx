import { setCustomer } from "@/app/actions";

export function CustomerForm({
  customerId,
  returnTo,
}: {
  customerId: number | null;
  returnTo: string;
}) {
  return (
    <form action={setCustomer} className="customer-form">
      <input type="hidden" name="returnTo" value={returnTo} />
      <span>Customer</span>
      <input name="customerId" type="number" min={1} defaultValue={customerId ?? ""} aria-label="Customer" />
      <button type="submit">Set</button>
    </form>
  );
}
