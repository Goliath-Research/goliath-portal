"use client";

import { useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { leave } from "@/app/actions";
import { CustomerForm } from "@/components/customer-form";
import { filterNav, findLeaf, NAV, tabKey, type NavNode, type OpenTab } from "@/workspace/nav";

const STORE = "goliath-open-tabs";

export function PortalShell({
  email,
  customerId,
  children,
}: {
  email: string;
  customerId: number | null;
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const search = useSearchParams();
  const href = search.size > 0 ? `${pathname}?${search.toString()}` : pathname;
  const [tabs, setTabs] = useState<OpenTab[]>([]);
  const [query, setQuery] = useState("");
  const [openFolders, setOpenFolders] = useState<Record<string, boolean>>({});
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem(STORE);
    let parsed: OpenTab[] = [];
    try {
      parsed = stored ? (JSON.parse(stored) as OpenTab[]) : [];
    } catch {
      parsed = [];
    }
    setTabs(Array.isArray(parsed) ? parsed : []);
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    const current = findLeaf(href);
    if (!current) return;
    setTabs((prev) => (prev.some((tab) => tab.id === current.id) ? prev : [...prev, current]));
  }, [href, hydrated]);

  useEffect(() => {
    if (hydrated) sessionStorage.setItem(STORE, JSON.stringify(tabs));
  }, [tabs, hydrated]);

  const active = findLeaf(href);
  const tree = useMemo(() => filterNav(NAV, query), [query]);
  const searching = query.trim().length > 0;

  function openTab(node: OpenTab) {
    setTabs((prev) => (prev.some((tab) => tab.id === node.id) ? prev : [...prev, node]));
    router.push(node.href);
  }

  function focusTab(tab: OpenTab) {
    router.push(tab.href);
  }

  function closeTab(tab: OpenTab) {
    const remaining = tabs.filter((item) => item.id !== tab.id);
    setTabs(remaining);
    if (active?.id !== tab.id) return;
    const next = remaining.at(-1);
    router.push(next ? next.href : "/home");
    if (!next) {
      const home = findLeaf("/home");
      if (home) setTabs([home]);
    }
  }

  function closeAll() {
    const home = findLeaf("/home");
    setTabs(home ? [home] : []);
    router.push("/home");
  }

  return (
    <div className="portal">
      <header className="portal-bar">
        <div className="brand">
          <span className="mark" aria-hidden />
          <div>
            <p className="brand-name">Goliath</p>
            <p className="brand-sub">Portal</p>
          </div>
        </div>
        <p className="operator">{email}</p>
        <div className="bar-actions">
          <CustomerForm customerId={customerId} returnTo={href} />
          <button type="button" className="ghost" onClick={closeAll}>
            Close all
          </button>
          <form action={leave}>
            <button type="submit" className="ghost">
              Sign out
            </button>
          </form>
        </div>
      </header>
      <div className="portal-body">
        <aside className="navigate">
          <p className="navigate-title">Navigate</p>
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search"
            aria-label="Search navigation"
            className="navigate-search"
          />
          <nav>
            {tree.map((node) => (
              <TreeNode
                key={node.id}
                node={node}
                depth={0}
                activeKey={active ? tabKey(active.href) : ""}
                forceOpen={searching}
                openFolders={openFolders}
                onToggle={(id) => setOpenFolders((prev) => ({ ...prev, [id]: !(prev[id] ?? true) }))}
                onOpen={openTab}
              />
            ))}
          </nav>
        </aside>
        <section className="workspace">
          <div className="tabs" role="tablist">
            {tabs.map((tab) => {
              const selected = active?.id === tab.id;
              return (
                <div key={tab.id} className={selected ? "tab selected" : "tab"} role="tab" aria-selected={selected}>
                  <button type="button" className="tab-label" onClick={() => focusTab(tab)}>
                    {tab.label}
                  </button>
                  <button type="button" className="tab-close" aria-label={`Close ${tab.label}`} onClick={() => closeTab(tab)}>
                    ×
                  </button>
                </div>
              );
            })}
          </div>
          <div className={active?.id === "home" ? "stage stage-home" : "stage"}>{children}</div>
        </section>
      </div>
      <footer className="status">
        <span className="live" />
        <span>Goliath Portal</span>
        <span className="status-gap">Database portal</span>
        <span className="status-gap">{email}</span>
      </footer>
    </div>
  );
}

function TreeNode({
  node,
  depth,
  activeKey,
  forceOpen,
  openFolders,
  onToggle,
  onOpen,
}: {
  node: NavNode;
  depth: number;
  activeKey: string;
  forceOpen: boolean;
  openFolders: Record<string, boolean>;
  onToggle: (id: string) => void;
  onOpen: (tab: OpenTab) => void;
}) {
  const expanded = forceOpen || (openFolders[node.id] ?? true);
  if (node.href) {
    const selected = tabKey(node.href) === activeKey;
    return (
      <button
        type="button"
        className={selected ? "leaf selected" : "leaf"}
        style={{ paddingLeft: 16 + depth * 14 }}
        onClick={() => onOpen({ id: node.id, label: node.label, href: node.href! })}
      >
        {node.label}
      </button>
    );
  }
  return (
    <div>
      <button
        type="button"
        className="folder"
        style={{ paddingLeft: 12 + depth * 14 }}
        onClick={() => onToggle(node.id)}
        aria-expanded={forceOpen || (openFolders[node.id] ?? true)}
      >
        <span className={expanded ? "chev open" : "chev"} />
        {node.label}
      </button>
      {expanded
        ? node.children?.map((child) => (
            <TreeNode
              key={child.id}
              node={child}
              depth={depth + 1}
              activeKey={activeKey}
              forceOpen={forceOpen}
              openFolders={openFolders}
              onToggle={onToggle}
              onOpen={onOpen}
            />
          ))
        : null}
    </div>
  );
}
