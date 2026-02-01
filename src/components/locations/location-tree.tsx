"use client";

import { useCallback, useEffect, useState } from "react";
import { LocationTreeNode } from "./location-tree-node";
import { getLocations, getLocationChildren } from "@/actions/locations";
import { Skeleton } from "@/components/ui/skeleton";
import type { Location } from "@/types/domain";

interface LocationTreeProps {
  selectedId?: string;
  onSelect: (location: Location) => void;
  onAddChild: (parentId: string | null) => void;
}

interface TreeNodeData {
  location: Location;
  counts?: { locations: number; items: number };
  children?: TreeNodeData[];
  loaded: boolean;
}

export function LocationTree({
  selectedId,
  onSelect,
  onAddChild,
}: LocationTreeProps) {
  const [rootNodes, setRootNodes] = useState<TreeNodeData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function loadRootLocations() {
      setLoading(true);
      setError(null);

      const result = await getLocations(null);
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      // Load counts for each root location
      const nodesWithCounts = await Promise.all(
        result.data.map(async (location) => {
          const childResult = await getLocationChildren(location.id);
          return {
            location,
            counts: childResult.success ? childResult.data.counts : undefined,
            loaded: false,
          };
        })
      );

      setRootNodes(nodesWithCounts);
      setLoading(false);
    }

    loadRootLocations();
  }, []);

  const loadChildren = useCallback(async (parentId: string) => {
    const result = await getLocationChildren(parentId);
    if (!result.success) return;

    const childNodes = await Promise.all(
      result.data.children.map(async (location) => {
        const childResult = await getLocationChildren(location.id);
        return {
          location,
          counts: childResult.success ? childResult.data.counts : undefined,
          loaded: false,
        };
      })
    );

    setRootNodes((prev) => updateNodeChildren(prev, parentId, childNodes));
  }, []);

  function updateNodeChildren(
    nodes: TreeNodeData[],
    parentId: string,
    children: TreeNodeData[]
  ): TreeNodeData[] {
    return nodes.map((node) => {
      if (node.location.id === parentId) {
        return { ...node, children, loaded: true };
      }
      if (node.children) {
        return {
          ...node,
          children: updateNodeChildren(node.children, parentId, children),
        };
      }
      return node;
    });
  }

  const renderNode = (node: TreeNodeData, depth: number): React.ReactNode => {
    return (
      <LocationTreeNode
        key={node.location.id}
        location={node.location}
        depth={depth}
        childCounts={node.counts}
        isSelected={selectedId === node.location.id}
        onSelect={onSelect}
        onAddChild={(parentId) => {
          if (!node.loaded && node.counts && node.counts.locations > 0) {
            loadChildren(parentId);
          }
          onAddChild(parentId);
        }}
      >
        {node.loaded && node.children?.map((child) => renderNode(child, depth + 1))}
        {!node.loaded && node.counts && node.counts.locations > 0 && (
          <button
            className="flex items-center gap-2 py-1 text-sm text-muted-foreground hover:text-foreground"
            style={{ paddingLeft: `${(depth + 1) * 16 + 32}px` }}
            onClick={() => loadChildren(node.location.id)}
          >
            Load {node.counts.locations} child location(s)...
          </button>
        )}
      </LocationTreeNode>
    );
  };

  if (loading) {
    return (
      <div className="space-y-2 p-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-8 w-full" />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-md bg-destructive/10 p-4 text-sm text-destructive">
        {error}
      </div>
    );
  }

  if (rootNodes.length === 0) {
    return (
      <div className="rounded-md border border-dashed p-8 text-center">
        <p className="text-muted-foreground">No locations yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Create your first location to get started
        </p>
      </div>
    );
  }

  return <div className="space-y-0.5">{rootNodes.map((node) => renderNode(node, 0))}</div>;
}
