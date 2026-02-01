"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  Box,
  Copy,
  Move,
  ChevronRight,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { ItemBreadcrumb } from "@/components/items/item-breadcrumb";
import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { MoveItemDialog } from "@/components/items/move-item-dialog";
import { ItemQRCode } from "@/components/items/item-qr-code";
import { deleteItem, getItemsInContainer } from "@/actions/items";
import type { ItemWithLocation, Item } from "@/types/domain";

interface ItemDetailViewProps {
  item: ItemWithLocation;
}

export function ItemDetailView({ item: initialItem }: ItemDetailViewProps) {
  const router = useRouter();
  const [item] = useState(initialItem);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [containerContents, setContainerContents] = useState<Item[]>([]);
  const [loadingContents, setLoadingContents] = useState(false);
  const [copied, setCopied] = useState(false);

  const isContainer = item.type === "container";
  const Icon = isContainer ? Box : Package;

  // Load container contents if this is a container
  useEffect(() => {
    if (isContainer) {
      setLoadingContents(true);
      getItemsInContainer(item.id).then((result) => {
        if (result.success) {
          setContainerContents(result.data);
        }
        setLoadingContents(false);
      });
    }
  }, [isContainer, item.id]);

  const reloadItem = () => {
    router.refresh();
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(item.humanReadableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteItem(item.id);
    setDeleting(false);

    if (result.success) {
      router.push("/locations");
    }
  };

  const handleEditSuccess = () => {
    setEditDialogOpen(false);
    router.refresh();
  };

  // Parse photos
  let photos: string[] = [];
  if (item.photos) {
    try {
      photos = JSON.parse(item.photos);
    } catch {
      photos = item.photos ? [item.photos] : [];
    }
  }

  const canDelete = !isContainer || containerContents.length === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header with full path breadcrumb */}
      <div className="flex items-center gap-2">
        <Link href="/locations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1 overflow-x-auto">
          <ItemBreadcrumb
            locationPath={item.locationPath}
            containerPath={item.containerPath}
            currentItemName={item.name}
          />
        </div>
      </div>

      {/* Main Card */}
      <Card>
        <CardHeader className="flex flex-row items-start justify-between space-y-0">
          <div className="space-y-2">
            <CardTitle className="flex items-center gap-2 text-2xl">
              <Icon className="h-6 w-6" />
              {item.name}
            </CardTitle>
            <div className="flex items-center gap-2">
              <Badge variant={isContainer ? "default" : "secondary"}>
                {isContainer ? "Container" : "Object"}
              </Badge>
              <button
                onClick={handleCopyCode}
                className="flex items-center gap-1 rounded bg-muted px-2 py-1 font-mono text-sm hover:bg-muted/80"
                title="Copy code"
              >
                {item.humanReadableCode}
                <Copy className="h-3 w-3" />
              </button>
              {copied && (
                <span className="text-xs text-muted-foreground">Copied!</span>
              )}
            </div>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setMoveDialogOpen(true)}
              title="Move item"
            >
              <Move className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setEditDialogOpen(true)}
              title="Edit item"
            >
              <Pencil className="h-4 w-4" />
            </Button>
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="text-destructive hover:text-destructive"
                  disabled={!canDelete}
                  title={
                    canDelete
                      ? "Delete item"
                      : "Cannot delete: container has items"
                  }
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Delete Item</AlertDialogTitle>
                  <AlertDialogDescription>
                    Are you sure you want to delete &quot;{item.name}&quot;? This
                    action cannot be undone.
                  </AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel>Cancel</AlertDialogCancel>
                  <AlertDialogAction
                    onClick={handleDelete}
                    className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                    disabled={deleting}
                  >
                    {deleting ? "Deleting..." : "Delete"}
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Description */}
          {item.description && (
            <p className="text-muted-foreground">{item.description}</p>
          )}

          {/* Photos */}
          {photos.length > 0 && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Photos</h3>
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((photo, index) => (
                  <div
                    key={index}
                    className="relative aspect-square overflow-hidden rounded-md bg-muted"
                  >
                    <Image
                      src={photo}
                      alt={`${item.name} photo ${index + 1}`}
                      fill
                      className="object-cover"
                    />
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Container Contents - Show immediately for "visibility without opening" */}
          {isContainer && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">
                  Contents ({containerContents.length} item{containerContents.length !== 1 && "s"})
                </h3>
              </div>
              {loadingContents ? (
                <p className="text-sm text-muted-foreground">Loading contents...</p>
              ) : containerContents.length === 0 ? (
                <p className="text-sm text-muted-foreground">This container is empty</p>
              ) : (
                <div className="space-y-1">
                  {containerContents.map((child) => (
                    <Link key={child.id} href={`/items/${child.id}`}>
                      <div className="flex items-center gap-3 rounded-md border p-3 hover:bg-accent transition-colors">
                        {child.type === "container" ? (
                          <Box className="h-5 w-5 text-muted-foreground shrink-0" />
                        ) : (
                          <Package className="h-5 w-5 text-muted-foreground shrink-0" />
                        )}
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{child.name}</p>
                          {child.description && (
                            <p className="text-sm text-muted-foreground truncate">
                              {child.description}
                            </p>
                          )}
                        </div>
                        <Badge variant={child.type === "container" ? "default" : "secondary"} className="shrink-0">
                          {child.type === "container" ? "Container" : "Object"}
                        </Badge>
                        <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
                      </div>
                    </Link>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* QR Code Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">QR Code</h3>
            <ItemQRCode itemId={item.id} humanReadableCode={item.humanReadableCode} />
          </div>

          {/* Metadata */}
          <div className="space-y-1 border-t pt-4 text-xs text-muted-foreground">
            <p>ID: {item.id}</p>
            <p>
              Created:{" "}
              {new Date(item.createdAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </p>
            <p>
              Updated:{" "}
              {new Date(item.updatedAt).toLocaleDateString(undefined, {
                dateStyle: "medium",
              })}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Edit Dialog */}
      <ItemFormDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        item={item}
        onSuccess={handleEditSuccess}
      />

      {/* Move Dialog */}
      <MoveItemDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        itemId={item.id}
        itemName={item.name}
        currentLocationPath={item.locationPath}
        onSuccess={reloadItem}
      />
    </div>
  );
}
