"use client";

import { useState } from "react";
import {
  FileText,
  Image,
  File,
  Trash2,
  GripVertical,
  ChevronUp,
  ChevronDown,
  ExternalLink,
} from "lucide-react";
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
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { deleteAttachment, getAttachmentData } from "@/actions/attachments";
import type { AttachmentMeta } from "@/types/domain";

interface AttachmentItemProps {
  attachment: AttachmentMeta;
  onDeleted: () => void;
  onMoveUp?: () => void;
  onMoveDown?: () => void;
  isFirst?: boolean;
  isLast?: boolean;
}

// Get icon based on mime type
function getFileIcon(mimeType: string) {
  if (mimeType === "application/pdf") return FileText;
  if (mimeType.startsWith("image/")) return Image;
  if (mimeType.startsWith("text/")) return FileText;
  if (
    mimeType.includes("msword") ||
    mimeType.includes("openxmlformats-officedocument")
  ) {
    return FileText;
  }
  return File;
}

// Format file size for display
function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentItem({
  attachment,
  onDeleted,
  onMoveUp,
  onMoveDown,
  isFirst,
  isLast,
}: AttachmentItemProps) {
  const [deleting, setDeleting] = useState(false);
  const [opening, setOpening] = useState(false);

  const Icon = getFileIcon(attachment.mimeType);

  const handleOpen = async () => {
    setOpening(true);
    try {
      const result = await getAttachmentData(attachment.id);
      if (result.success) {
        // Create data URL and open in new tab
        const dataUrl = result.data.data;
        window.open(dataUrl, "_blank");
      }
    } catch (error) {
      console.error("Failed to open attachment:", error);
    } finally {
      setOpening(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    const result = await deleteAttachment(attachment.id);
    setDeleting(false);

    if (result.success) {
      onDeleted();
    }
  };

  return (
    <div className="flex items-center gap-2 rounded-lg border p-3 hover:bg-accent/50 transition-colors">
      {/* Drag handle placeholder - for future drag-and-drop */}
      <div className="shrink-0 text-muted-foreground/50 hidden sm:block">
        <GripVertical className="h-4 w-4" />
      </div>

      {/* File icon */}
      <Icon className="h-5 w-5 shrink-0 text-muted-foreground" />

      {/* Content - clickable to open */}
      <button
        onClick={handleOpen}
        disabled={opening}
        className="flex-1 min-w-0 text-left group"
      >
        <div className="flex items-center gap-2">
          <span className="font-medium truncate group-hover:underline">
            {attachment.title}
          </span>
          <ExternalLink className="h-3 w-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span className="truncate">{attachment.filename}</span>
          <span className="shrink-0">({formatFileSize(attachment.sizeBytes)})</span>
        </div>
      </button>

      {/* Reorder buttons (mobile-friendly) */}
      <div className="flex flex-col gap-0.5 sm:hidden">
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveUp}
          disabled={isFirst}
        >
          <ChevronUp className="h-3 w-3" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-6 w-6"
          onClick={onMoveDown}
          disabled={isLast}
        >
          <ChevronDown className="h-3 w-3" />
        </Button>
      </div>

      {/* Desktop reorder buttons */}
      <div className="hidden sm:flex gap-0.5">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onMoveUp}
          disabled={isFirst}
          title="Move up"
        >
          <ChevronUp className="h-4 w-4" />
        </Button>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onMoveDown}
          disabled={isLast}
          title="Move down"
        >
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Delete button */}
      <AlertDialog>
        <AlertDialogTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 shrink-0 text-muted-foreground hover:text-destructive"
            title="Delete attachment"
          >
            <Trash2 className="h-4 w-4" />
          </Button>
        </AlertDialogTrigger>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Attachment</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{attachment.title}&quot;? This
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
  );
}
