import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { PortalShell } from "@/components/portal-shell";
import { readCustomerId } from "@/server/customer";

export const dynamic = "force-dynamic";

export default async function DoorLayout({ children }: { children: React.ReactNode }) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const customerId = await readCustomerId();

  return (
    <Suspense fallback={<div className="portal-boot">Goliath</div>}>
      <PortalShell email={session.user.email} customerId={customerId}>
        {children}
      </PortalShell>
    </Suspense>
  );
}
