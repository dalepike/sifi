"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import {
  ArrowLeft,
  Pencil,
  Trash2,
  Package,
  Box,
  QrCode,
  Copy,
  Printer,
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
import { LocationBreadcrumb } from "@/components/locations/location-breadcrumb";
import { ItemFormDialog } from "@/components/items/item-form-dialog";
import { deleteItem, getItemsInContainer } from "@/actions/items";
import { getItemQRCode } from "@/actions/qr";
import { addToPrintQueue } from "@/lib/print-queue";
import type { ItemWithLocation, Item } from "@/types/domain";

interface ItemDetailViewProps {
  item: ItemWithLocation;
}

export function ItemDetailView({ item: initialItem }: ItemDetailViewProps) {
  const router = useRouter();
  const [item] = useState(initialItem);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [loadingQR, setLoadingQR] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [childCount, setChildCount] = useState<number | null>(null);
  const [copied, setCopied] = useState(false);

  const isContainer = item.type === "container";
  const Icon = isContainer ? Box : Package;

  // Load child count if container
  useState(() => {
    if (isContainer) {
      getItemsInContainer(item.id).then((result) => {
        if (result.success) {
          setChildCount(result.data.length);
        }
      });
    }
  });

  const handleLoadQR = async () => {
    setLoadingQR(true);
    const result = await getItemQRCode(item.id);
    if (result.success) {
      setQrCode(result.data.dataUrl);
    }
    setLoadingQR(false);
  };

  const handleCopyCode = () => {
    navigator.clipboard.writeText(item.humanReadableCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleAddToQueue = () => {
    addToPrintQueue(item.id);
    // Could show a toast here
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

  const canDelete = !isContainer || childCount === 0;

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      {/* Header */}
      <div className="flex items-center gap-2">
        <Link href="/locations">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-4 w-4" />
          </Button>
        </Link>
        <div className="flex-1">
          <LocationBreadcrumb path={item.locationPath} />
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
              onClick={() => setEditDialogOpen(true)}
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

          {/* QR Code Section */}
          <div className="space-y-2">
            <h3 className="text-sm font-medium">QR Code</h3>
            {qrCode ? (
              <div className="flex items-start gap-4">
                <img
                  src={qrCode}
                  alt="QR Code"
                  className="h-32 w-32 rounded-md border"
                />
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    Scan this code to quickly find this item
                  </p>
                  <Button size="sm" variant="outline" onClick={handleAddToQueue}>
                    <Printer className="mr-2 h-4 w-4" />
                    Add to Print Queue
                  </Button>
                </div>
              </div>
            ) : (
              <Button
                variant="outline"
                onClick={handleLoadQR}
                disabled={loadingQR}
              >
                <QrCode className="mr-2 h-4 w-4" />
                {loadingQR ? "Generating..." : "Show QR Code"}
              </Button>
            )}
          </div>

          {/* Container contents */}
          {isContainer && childCount !== null && (
            <div className="space-y-2">
              <h3 className="text-sm font-medium">Contents</h3>
              <p className="text-sm text-muted-foreground">
                {childCount} item{childCount !== 1 && "s"} inside
              </p>
              {childCount > 0 && (
                <Link href={`/locations?container=${item.id}`}>
                  <Button variant="outline" size="sm">
                    View Contents
                  </Button>
                </Link>
              )}
            </div>
          )}

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
    </div>
  );
}
