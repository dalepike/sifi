"use client";

import { useCallback, useEffect, useState, useImperativeHandle, forwardRef } from "react";
import { MapPin, Home, Package, QrCode, ArrowRight } from "lucide-react";
import { LocationTreeNode } from "./location-tree-node";
import { getAllLocations } from "@/actions/locations";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { Location } from "@/types/domain";

interface LocationTreeProps {
  selectedId?: string;
  onSelect: (location: Location) => void;
  onAddChild: (parentId: string | null) => void;
}

interface TreeNodeData {
  location: Location;
  counts?: { locations: number; items: number };
  children: TreeNodeData[];
}

export interface LocationTreeRef {
  refresh: () => Promise<void>;
}

export const LocationTree = forwardRef<LocationTreeRef, LocationTreeProps>(
  function LocationTree({ selectedId, onSelect, onAddChild }, ref) {
    const [rootNodes, setRootNodes] = useState<TreeNodeData[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

    // Build tree structure from flat list
    const buildTree = useCallback(
      (
        locations: Location[],
        counts: Record<string, { locations: number; items: number }>
      ): TreeNodeData[] => {
        const locationMap = new Map<string, TreeNodeData>();

        // Create nodes for all locations
        for (const loc of locations) {
          locationMap.set(loc.id, {
            location: loc,
            counts: counts[loc.id],
            children: [],
          });
        }

        // Build tree structure
        const roots: TreeNodeData[] = [];
        for (const loc of locations) {
          const node = locationMap.get(loc.id)!;
          if (loc.parentId && locationMap.has(loc.parentId)) {
            locationMap.get(loc.parentId)!.children.push(node);
          } else {
            roots.push(node);
          }
        }

        // Sort children alphabetically
        const sortNodes = (nodes: TreeNodeData[]) => {
          nodes.sort((a, b) => a.location.name.localeCompare(b.location.name));
          for (const node of nodes) {
            sortNodes(node.children);
          }
        };
        sortNodes(roots);

        return roots;
      },
      []
    );

    const loadAllLocations = useCallback(async () => {
      setLoading(true);
      setError(null);

      const result = await getAllLocations();
      if (!result.success) {
        setError(result.error);
        setLoading(false);
        return;
      }

      const { locations, counts } = result.data;
      const tree = buildTree(locations, counts as unknown as Record<string, { locations: number; items: number }>);
      setRootNodes(tree);

      // Auto-expand root nodes on initial load
      if (expandedIds.size === 0 && tree.length > 0) {
        const rootIds = new Set(tree.map((n) => n.location.id));
        setExpandedIds(rootIds);
      }

      setLoading(false);
    }, [buildTree, expandedIds.size]);

    // Initial load
    useEffect(() => {
      loadAllLocations();
      // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    // Expose refresh method to parent - preserves expanded state
    useImperativeHandle(
      ref,
      () => ({
        refresh: async () => {
          // Don't reset expandedIds - this preserves state
          const result = await getAllLocations();
          if (result.success) {
            const { locations, counts } = result.data;
            const tree = buildTree(locations, counts as unknown as Record<string, { locations: number; items: number }>);
            setRootNodes(tree);
          }
        },
      }),
      [buildTree]
    );

    const toggleExpand = useCallback((id: string) => {
      setExpandedIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
    }, []);

    const renderNode = (node: TreeNodeData, depth: number): React.ReactNode => {
      const isExpanded = expandedIds.has(node.location.id);
      const hasChildren = node.children.length > 0;

      return (
        <LocationTreeNode
          key={node.location.id}
          location={node.location}
          depth={depth}
          childCounts={node.counts}
          isSelected={selectedId === node.location.id}
          isExpanded={isExpanded}
          hasChildren={hasChildren}
          onSelect={onSelect}
          onToggleExpand={() => toggleExpand(node.location.id)}
          onAddChild={onAddChild}
        >
          {isExpanded && node.children.map((child) => renderNode(child, depth + 1))}
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
        <div className="space-y-6 p-4">
          <div className="text-center">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 mb-4">
              <Home className="h-8 w-8 text-primary" />
            </div>
            <h3 className="text-lg font-semibold mb-2">Welcome to SiFi</h3>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Organize your belongings with a simple hierarchy and find anything with QR codes.
            </p>
          </div>

          <div className="space-y-3">
            <Card className="border-dashed">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-blue-500/10 text-blue-500">
                  <MapPin className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">1. Create Locations</p>
                  <p className="text-xs text-muted-foreground">
                    Start with spaces like &quot;Home&quot; or &quot;Office&quot;, then add rooms and spots within them.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <Card className="border-dashed">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-green-500/10 text-green-500">
                  <Package className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">2. Add Items</p>
                  <p className="text-xs text-muted-foreground">
                    Add items to locations. Items can be objects or containers that hold other items.
                  </p>
                </div>
              </CardContent>
            </Card>

            <div className="flex justify-center">
              <ArrowRight className="h-4 w-4 text-muted-foreground rotate-90" />
            </div>

            <Card className="border-dashed">
              <CardContent className="flex items-start gap-3 p-4">
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md bg-purple-500/10 text-purple-500">
                  <QrCode className="h-4 w-4" />
                </div>
                <div className="space-y-1">
                  <p className="text-sm font-medium">3. Print QR Labels</p>
                  <p className="text-xs text-muted-foreground">
                    Generate QR codes for items. Scan later to instantly find where things are stored.
                  </p>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="text-center pt-2">
            <Button onClick={() => onAddChild(null)} size="lg">
              <Home className="h-4 w-4 mr-2" />
              Create Your First Space
            </Button>
          </div>
        </div>
      );
    }

    return <div className="space-y-0.5">{rootNodes.map((node) => renderNode(node, 0))}</div>;
  }
);
