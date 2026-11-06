import { redirect } from "next/navigation";

export default async function SoonPage({ params }: { params: Promise<{ leaf: string }> }) {
  redirect(`/desk/${(await params).leaf}`);
}
