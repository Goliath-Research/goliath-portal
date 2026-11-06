export type GraphNode = {
  key: string;
  type: string;
  action: string;
  depth: number;
};

/** Indent a workflow spec the way the designer lists it: root, then children. */
export function layoutGraph(value: unknown): GraphNode[] {
  const root = asRecord(value);
  if (!root) return [];
  const nodes = new Map<string, { type: string; action: string }>();
  for (const item of asList(root.nodes)) {
    const row = asRecord(item);
    const key = text(row?.node_key);
    if (!row || !key) continue;
    nodes.set(key, { type: text(row.node_type), action: text(row.action_name) });
  }
  if (nodes.size === 0) return [];

  const children = new Map<string, string[]>();
  const childKeys = new Set<string>();
  for (const item of asList(root.edges)) {
    const row = asRecord(item);
    const parent = text(row?.parent_node_key);
    const child = text(row?.child_node_key);
    if (!row || !parent || !child || !nodes.has(child)) continue;
    const list = children.get(parent) ?? [];
    list.push(child);
    children.set(parent, list);
    childKeys.add(child);
  }

  const rootKey = text(root.root_node_key);
  const starts = rootKey && nodes.has(rootKey)
    ? [rootKey]
    : [...nodes.keys()].filter((key) => !childKeys.has(key));

  const laid: GraphNode[] = [];
  const seen = new Set<string>();
  const walk = (key: string, depth: number) => {
    if (seen.has(key) || depth > 32) return;
    seen.add(key);
    const node = nodes.get(key);
    if (!node) return;
    laid.push({ key, type: node.type, action: node.action, depth });
    for (const child of children.get(key) ?? []) walk(child, depth + 1);
  };
  for (const key of starts) walk(key, 0);
  for (const key of nodes.keys()) walk(key, 0);
  return laid;
}

function asRecord(value: unknown): Record<string, unknown> | null {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  return value as Record<string, unknown>;
}

function asList(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

function text(value: unknown): string {
  return value == null ? "" : String(value);
}
