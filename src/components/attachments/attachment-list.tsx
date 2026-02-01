"use client";

import { useState } from "react";
import { Paperclip, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AttachmentItem } from "./attachment-item";
import { AddAttachmentDialog } from "./add-attachment-dialog";
import { reorderAttachments } from "@/actions/attachments";
import type { AttachmentMeta } from "@/types/domain";

interface AttachmentListProps {
  itemId: string;
  attachments: AttachmentMeta[];
  onAttachmentsChange: () => void;
}

export function AttachmentList({
  itemId,
  attachments,
  onAttachmentsChange,
}: AttachmentListProps) {
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [localAttachments, setLocalAttachments] = useState(attachments);

  // Keep local state in sync with props
  if (attachments !== localAttachments && attachments.length !== localAttachments.length) {
    setLocalAttachments(attachments);
  }

  const handleMoveUp = async (index: number) => {
    if (index === 0) return;

    const newOrder = [...localAttachments];
    const temp = newOrder[index - 1];
    newOrder[index - 1] = newOrder[index]!;
    newOrder[index] = temp!;
    setLocalAttachments(newOrder);

    const orderedIds = newOrder.map((a) => a.id);
    await reorderAttachments({ itemId, orderedIds });
    onAttachmentsChange();
  };

  const handleMoveDown = async (index: number) => {
    if (index === localAttachments.length - 1) return;

    const newOrder = [...localAttachments];
    const temp = newOrder[index];
    newOrder[index] = newOrder[index + 1]!;
    newOrder[index + 1] = temp!;
    setLocalAttachments(newOrder);

    const orderedIds = newOrder.map((a) => a.id);
    await reorderAttachments({ itemId, orderedIds });
    onAttachmentsChange();
  };

  const handleAdded = () => {
    setAddDialogOpen(false);
    onAttachmentsChange();
  };

  const handleDeleted = () => {
    onAttachmentsChange();
  };

  return (
    <div className="space-y-3">
      {/* Section header */}
      <div className="flex items-center justify-between">
        <h3 className="flex items-center gap-2 text-sm font-medium">
          <Paperclip className="h-4 w-4" />
          Attachments
          {localAttachments.length > 0 && (
            <span className="text-muted-foreground">({localAttachments.length})</span>
          )}
        </h3>
        <Button
          variant="outline"
          size="sm"
          onClick={() => setAddDialogOpen(true)}
        >
          <Plus className="mr-1 h-4 w-4" />
          Add
        </Button>
      </div>

      {/* Attachment list */}
      {localAttachments.length === 0 ? (
        <p className="text-sm text-muted-foreground py-4 text-center border rounded-lg">
          No attachments yet.
          <br />
          <span className="text-xs">
            Add documents, receipts, or manuals to this item.
          </span>
        </p>
      ) : (
        <div className="space-y-2">
          {localAttachments.map((attachment, index) => (
            <AttachmentItem
              key={attachment.id}
              attachment={attachment}
              onDeleted={handleDeleted}
              onMoveUp={() => handleMoveUp(index)}
              onMoveDown={() => handleMoveDown(index)}
              isFirst={index === 0}
              isLast={index === localAttachments.length - 1}
            />
          ))}
        </div>
      )}

      {/* Add dialog */}
      <AddAttachmentDialog
        open={addDialogOpen}
        onOpenChange={setAddDialogOpen}
        itemId={itemId}
        onSuccess={handleAdded}
      />
    </div>
  );
}
