export type NavNode = {
  id: string;
  label: string;
  href?: string;
  children?: NavNode[];
};

export const NAV: NavNode[] = [
  { id: "home", label: "Home / Ops board", href: "/home" },
  {
    id: "studies",
    label: "Studies",
    children: [
      { id: "overview", label: "Overview", href: "/desk/overview" },
      { id: "cohort", label: "Cohort", href: "/enrollment" },
      { id: "storage", label: "Storage", href: "/desk/storage" },
      { id: "prep", label: "Sample prep", href: "/sample-prep" },
      { id: "lifecycle", label: "Study lifecycle", href: "/desk/lifecycle" },
      { id: "prediction", label: "Prediction", href: "/desk/prediction" },
      { id: "runs", label: "Runs", href: "/studies?leaf=runs" },
      { id: "manifests", label: "Project manifests", href: "/studies?leaf=manifests" },
    ],
  },
  {
    id: "legacy",
    label: "Legacy clinical",
    children: [
      { id: "diseases", label: "Diseases", href: "/clinical" },
      { id: "samples", label: "Samples", href: "/samples" },
      { id: "institutions", label: "Institutions", href: "/institutions" },
    ],
  },
  {
    id: "workflows",
    label: "Workflows",
    children: [{ id: "definitions", label: "Definitions", href: "/desk/definitions" }],
  },
  {
    id: "platform",
    label: "Platform",
    children: [
      { id: "site", label: "Site", href: "/desk/site" },
      { id: "profiles", label: "Pipeline profiles", href: "/desk/profiles" },
      { id: "programs", label: "Domain programs", href: "/desk/programs" },
      { id: "analytes", label: "Analytes", href: "/analytes" },
      { id: "catalog", label: "Action catalog", href: "/desk/catalog" },
      { id: "storage-admin", label: "Storage & credentials", href: "/desk/storage-admin" },
      { id: "assets", label: "Reference assets", href: "/desk/assets" },
      { id: "workers", label: "Clusters & workers", href: "/desk/workers" },
    ],
  },
  {
    id: "hpo",
    label: "Hyperparameters",
    children: [{ id: "hpo-monitor", label: "HPO Monitor", href: "/desk/hpo" }],
  },
  {
    id: "admin",
    label: "Admin",
    children: [{ id: "contracts", label: "Contracts", href: "/desk/contracts" }],
  },
];

export type OpenTab = { id: string; label: string; href: string };

export function tabKey(href: string): string {
  const url = new URL(href, "http://goliath.local");
  if (url.pathname === "/studies") {
    return `/studies?leaf=${url.searchParams.get("leaf") ?? "runs"}`;
  }
  return url.pathname;
}

export function findLeaf(href: string): OpenTab | null {
  const key = tabKey(href);
  const walk = (nodes: NavNode[]): OpenTab | null => {
    for (const node of nodes) {
      if (node.href && tabKey(node.href) === key) {
        return { id: node.id, label: node.label, href: node.href };
      }
      if (node.children) {
        const found = walk(node.children);
        if (found) return found;
      }
    }
    return null;
  };
  return walk(NAV);
}

export function filterNav(nodes: NavNode[], query: string): NavNode[] {
  const q = query.trim().toLowerCase();
  if (!q) return nodes;
  const out: NavNode[] = [];
  for (const node of nodes) {
    const children = node.children ? filterNav(node.children, q) : undefined;
    const self = node.label.toLowerCase().includes(q);
    if (self) out.push(node);
    else if (children && children.length > 0) out.push({ ...node, children });
  }
  return out;
}
