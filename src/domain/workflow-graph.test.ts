import { describe, expect, it } from "vitest";
import { layoutGraph } from "./workflow-graph";

describe("layoutGraph", () => {
  it("walks from the root through parent edges", () => {
    const laid = layoutGraph({
      root_node_key: "root",
      nodes: [
        { node_key: "root", node_type: "SEQUENCE" },
        { node_key: "prep", node_type: "ACTION", action_name: "SamplePrep" },
      ],
      edges: [{ parent_node_key: "root", child_node_key: "prep" }],
    });
    expect(laid.map((node) => node.key)).toEqual(["root", "prep"]);
    expect(laid[1]).toMatchObject({ depth: 1, action: "SamplePrep" });
  });

  it("returns nothing when the document has no nodes", () => {
    expect(layoutGraph({ edges: [] })).toEqual([]);
    expect(layoutGraph(null)).toEqual([]);
  });
});
