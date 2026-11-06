import { cookies } from "next/headers";

export async function readCustomerId(): Promise<number | null> {
  const raw = (await cookies()).get("goliath_customer_id")?.value;
  const id = Number(raw);
  return Number.isInteger(id) && id > 0 ? id : null;
}
