import { Screen } from "@/components/screen";

export default async function StudiesPage({
  searchParams,
}: {
  searchParams: Promise<{ study?: string; studyRowId?: string; leaf?: string }>;
}) {
  const params = await searchParams;
  const leaf = params.leaf === "manifests" ? "manifests" : "runs";
  return <Screen leaf={leaf} study={params.study ?? params.studyRowId} />;
}
