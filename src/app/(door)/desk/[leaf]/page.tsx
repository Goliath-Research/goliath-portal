import { Screen } from "@/components/screen";

export default async function DeskPage({
  params,
  searchParams,
}: {
  params: Promise<{ leaf: string }>;
  searchParams: Promise<{ study?: string; workflow?: string }>;
}) {
  const leaf = (await params).leaf;
  const query = await searchParams;
  return <Screen leaf={leaf} study={query.study} workflow={query.workflow} />;
}
