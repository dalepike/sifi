"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Download, FileJson, FileSpreadsheet, Loader2, CheckCircle } from "lucide-react";
import { exportAsJson, exportAsCsv, getExportStats } from "@/actions/export";
import JSZip from "jszip";

interface ExportStats {
  locations: number;
  items: number;
  tags: number;
  activities: number;
  attachments: number;
}

export function ExportSettings() {
  const [stats, setStats] = useState<ExportStats | null>(null);
  const [loadingStats, setLoadingStats] = useState(true);
  const [exportingJson, setExportingJson] = useState(false);
  const [exportingCsv, setExportingCsv] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);

  // Load stats on mount
  useEffect(() => {
    async function loadStats() {
      const result = await getExportStats();
      if (result.success) {
        setStats(result.data);
      }
      setLoadingStats(false);
    }
    loadStats();
  }, []);

  // Get current date for filename
  function getDateString() {
    return new Date().toISOString().split("T")[0];
  }

  // Download helper
  function downloadFile(content: string | Blob, filename: string, type: string) {
    const blob = content instanceof Blob ? content : new Blob([content], { type });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  // Handle JSON export
  async function handleJsonExport() {
    setExportingJson(true);
    setMessage(null);

    try {
      const result = await exportAsJson();

      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      const jsonString = JSON.stringify(result.data, null, 2);
      const filename = `sifi-export-${getDateString()}.json`;
      downloadFile(jsonString, filename, "application/json");

      setMessage({
        type: "success",
        text: `Exported ${result.data.metadata.counts.items} items to ${filename}`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setExportingJson(false);
    }
  }

  // Handle CSV export (creates ZIP with all CSV files)
  async function handleCsvExport() {
    setExportingCsv(true);
    setMessage(null);

    try {
      const result = await exportAsCsv();

      if (!result.success) {
        setMessage({ type: "error", text: result.error });
        return;
      }

      // Create ZIP file
      const zip = new JSZip();
      const folder = zip.folder("sifi-export");

      if (folder) {
        Object.entries(result.data).forEach(([filename, content]) => {
          folder.file(filename, content);
        });
      }

      const zipBlob = await zip.generateAsync({ type: "blob" });
      const filename = `sifi-export-${getDateString()}.zip`;
      downloadFile(zipBlob, filename, "application/zip");

      setMessage({
        type: "success",
        text: `Exported data to ${filename}`,
      });
    } catch (error) {
      setMessage({
        type: "error",
        text: error instanceof Error ? error.message : "Export failed",
      });
    } finally {
      setExportingCsv(false);
    }
  }

  return (
    <div className="space-y-4">
      {/* Stats display */}
      {loadingStats ? (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Loading inventory stats...
        </div>
      ) : stats ? (
        <div className="grid grid-cols-2 gap-2 text-sm sm:grid-cols-3 md:grid-cols-5">
          <div className="rounded-md bg-muted p-2 text-center">
            <div className="font-semibold">{stats.locations}</div>
            <div className="text-muted-foreground">Locations</div>
          </div>
          <div className="rounded-md bg-muted p-2 text-center">
            <div className="font-semibold">{stats.items}</div>
            <div className="text-muted-foreground">Items</div>
          </div>
          <div className="rounded-md bg-muted p-2 text-center">
            <div className="font-semibold">{stats.tags}</div>
            <div className="text-muted-foreground">Tags</div>
          </div>
          <div className="rounded-md bg-muted p-2 text-center">
            <div className="font-semibold">{stats.activities}</div>
            <div className="text-muted-foreground">Activities</div>
          </div>
          <div className="rounded-md bg-muted p-2 text-center">
            <div className="font-semibold">{stats.attachments}</div>
            <div className="text-muted-foreground">Attachments</div>
          </div>
        </div>
      ) : null}

      {/* Export buttons */}
      <div className="flex flex-col gap-3 sm:flex-row">
        <Button
          variant="outline"
          onClick={handleJsonExport}
          disabled={exportingJson || exportingCsv}
          className="flex-1"
        >
          {exportingJson ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileJson className="mr-2 h-4 w-4" />
          )}
          Export as JSON
        </Button>

        <Button
          variant="outline"
          onClick={handleCsvExport}
          disabled={exportingJson || exportingCsv}
          className="flex-1"
        >
          {exportingCsv ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <FileSpreadsheet className="mr-2 h-4 w-4" />
          )}
          Export as CSV
        </Button>
      </div>

      {/* Format descriptions */}
      <div className="space-y-1 text-xs text-muted-foreground">
        <p>
          <strong>JSON:</strong> Complete data backup, suitable for re-importing
        </p>
        <p>
          <strong>CSV:</strong> Spreadsheet-compatible ZIP with separate files for locations, items, tags, and activities
        </p>
      </div>

      {/* Status message */}
      {message && (
        <div
          className={`flex items-center gap-2 rounded-md p-3 text-sm ${
            message.type === "success"
              ? "bg-green-500/10 text-green-600 dark:text-green-400"
              : "bg-red-500/10 text-red-600 dark:text-red-400"
          }`}
        >
          {message.type === "success" && <CheckCircle className="h-4 w-4" />}
          {message.text}
        </div>
      )}
    </div>
  );
}
