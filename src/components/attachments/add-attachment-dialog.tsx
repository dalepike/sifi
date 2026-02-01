"use client";

import { useState, useRef } from "react";
import { Upload, AlertTriangle, X } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { createAttachment } from "@/actions/attachments";

interface AddAttachmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemId: string;
  onSuccess: () => void;
}

const WARNING_SIZE = 5 * 1024 * 1024; // 5MB
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

// Extract filename without extension for default title
function getDefaultTitle(filename: string): string {
  const lastDot = filename.lastIndexOf(".");
  if (lastDot === -1) return filename;
  return filename.substring(0, lastDot);
}

export function AddAttachmentDialog({
  open,
  onOpenChange,
  itemId,
  onSuccess,
}: AddAttachmentDialogProps) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [fileData, setFileData] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetForm = () => {
    setSelectedFile(null);
    setTitle("");
    setFileData(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setError(null);

    // Check file size
    if (file.size > MAX_SIZE) {
      setError(`File is too large (${formatFileSize(file.size)}). Maximum size is 10MB.`);
      return;
    }

    setSelectedFile(file);
    setTitle(getDefaultTitle(file.name));

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setFileData(base64);
    };
    reader.onerror = () => {
      setError("Failed to read file. Please try again.");
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedFile || !fileData) {
      setError("Please select a file");
      return;
    }

    if (!title.trim()) {
      setError("Title is required");
      return;
    }

    setLoading(true);
    setError(null);

    const result = await createAttachment({
      itemId,
      title: title.trim(),
      filename: selectedFile.name,
      mimeType: selectedFile.type || "application/octet-stream",
      data: fileData,
      sizeBytes: selectedFile.size,
    });

    setLoading(false);

    if (!result.success) {
      setError(result.error);
      return;
    }

    resetForm();
    onSuccess();
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      resetForm();
    }
    onOpenChange(open);
  };

  const isLargeFile = selectedFile && selectedFile.size > WARNING_SIZE;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Add Attachment</DialogTitle>
            <DialogDescription>
              Attach a file to this item. Max file size is 10MB.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {error && (
              <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                {error}
              </div>
            )}

            {/* File picker */}
            <div className="grid gap-2">
              <Label>File</Label>
              <input
                ref={fileInputRef}
                type="file"
                className="hidden"
                onChange={handleFileSelect}
              />

              {selectedFile ? (
                <div className="flex items-center gap-2 rounded-md border p-3">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatFileSize(selectedFile.size)}
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => {
                      resetForm();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <Button
                  type="button"
                  variant="outline"
                  className="w-full"
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="mr-2 h-4 w-4" />
                  Choose File
                </Button>
              )}

              {isLargeFile && (
                <div className="flex items-center gap-2 text-xs text-amber-600">
                  <AlertTriangle className="h-3 w-3" />
                  Large file. Consider compressing before upload.
                </div>
              )}
            </div>

            {/* Title input */}
            {selectedFile && (
              <div className="grid gap-2">
                <Label htmlFor="title">Title</Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g., User Manual, Receipt"
                  required
                  autoFocus
                />
                <p className="text-xs text-muted-foreground">
                  A descriptive name for this attachment
                </p>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => handleClose(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedFile || !fileData}>
              {loading ? "Uploading..." : "Add Attachment"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
