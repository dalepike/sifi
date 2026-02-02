"use client";

import { useState } from "react";
import { Move, Tag, Trash2, Printer, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { batchDeleteItems } from "@/actions/batch-items";
import { addToPrintQueue } from "@/lib/print-queue";
import { BatchMoveDialog } from "./batch-move-dialog";
import { BatchTagDialog } from "./batch-tag-dialog";

interface BatchActionsBarProps {
  selectedIds: string[];
  onClear: () => void;
  onSuccess: () => void;
}

export function BatchActionsBar({
  selectedIds,
  onClear,
  onSuccess,
}: BatchActionsBarProps) {
  const [moveOpen, setMoveOpen] = useState(false);
  const [tagOpen, setTagOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const count = selectedIds.length;

  if (count === 0) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    const result = await batchDeleteItems(selectedIds);
    setDeleting(false);

    if (result.success) {
      setDeleteOpen(false);
      onClear();
      onSuccess();
    } else {
      setError(result.error);
    }
  };

  const handleAddToPrintQueue = () => {
    selectedIds.forEach((id) => addToPrintQueue(id));
    onClear();
  };

  return (
    <>
      <div className="fixed bottom-20 sm:bottom-6 left-1/2 -translate-x-1/2 z-50 animate-in slide-in-from-bottom-4">
        <div className="flex items-center gap-2 rounded-lg border bg-card px-4 py-3 shadow-lg">
          <span className="text-sm font-medium mr-2">
            {count} item{count !== 1 && "s"} selected
          </span>

          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setMoveOpen(true)}
              title="Move items"
            >
              <Move className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Move</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTagOpen(true)}
              title="Add tag"
            >
              <Tag className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Tag</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={handleAddToPrintQueue}
              title="Add to print queue"
            >
              <Printer className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Print</span>
            </Button>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              className="text-destructive hover:text-destructive"
              title="Delete items"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              <span className="hidden sm:inline">Delete</span>
            </Button>
          </div>

          <Button
            variant="ghost"
            size="icon"
            onClick={onClear}
            className="ml-2"
            title="Clear selection"
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      <BatchMoveDialog
        open={moveOpen}
        onOpenChange={setMoveOpen}
        itemIds={selectedIds}
        onSuccess={() => {
          onClear();
          onSuccess();
        }}
      />

      <BatchTagDialog
        open={tagOpen}
        onOpenChange={setTagOpen}
        itemIds={selectedIds}
        onSuccess={() => {
          onClear();
          onSuccess();
        }}
      />

      <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {count} items?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the selected items. Containers with
              items inside cannot be deleted. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          {error && (
            <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? "Deleting..." : `Delete ${count} items`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
