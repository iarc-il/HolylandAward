import { Button } from "@ui/button";
import React, { useRef, useState, useCallback } from "react";
import useAdifUpload from "@/hooks/useFileUpload";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { useClaimOldCallsign } from "@/api/useCallsignRequests";
import QsoTable, { type Qso } from "./QsoTable";

type UploadResponse = {
  total_qsos: number;
  callsign: string;
  unmatched_callsigns?: { callsign: string; qsos: number }[];
  qsos: Qso[];
};

const MAX_FILE_SIZE_BYTES = 20 * 1024 * 1024;

const FileUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  // Kept so the same file can be uploaded again right after the user links an
  // old callsign, without asking them to pick it a second time.
  const lastFileRef = useRef<File | null>(null);
  const claimOldCallsign = useClaimOldCallsign();
  const {
    mutate: uploadFile,
    isPending,
    isError,
    error,
    reset,
  } = useAdifUpload();

  const handleClick = () => {
    reset();
    setUploadResult(null);
    setFileError(null);
    fileInputRef.current?.click();
  };

  const processFile = useCallback((file: File) => {
    reset();
    setUploadResult(null);
    if (!file.name.toLowerCase().endsWith(".adi")) {
      setFileError("Only .adi files can be uploaded.");
      return;
    }
    if (file.size > MAX_FILE_SIZE_BYTES) {
      setFileError("File is too large. Maximum size is 20MB.");
      return;
    }

    setFileError(null);
    lastFileRef.current = file;
    uploadFile(
      { file },
      {
        onSuccess: (data) => setUploadResult(data),
        onError: (error) => console.error("Upload failed:", error),
      }
    );
  }, [reset, uploadFile]);

  const handleClaimCallsign = (callsign: string) => {
    claimOldCallsign.mutate(callsign, {
      onSuccess: () => {
        toast.success(`${callsign} linked to your account`);
        if (lastFileRef.current) processFile(lastFileRef.current);
      },
      onError: (err) =>
        toast.error(err instanceof Error ? err.message : "Could not link callsign"),
    });
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (files?.[0]) processFile(files[0]);
    event.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) processFile(file);
  };

  return (
    <div className="container mx-auto max-w-5xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="space-y-2">
          <h1 className="text-4xl md:text-5xl font-bold text-foreground">Upload ADIF File</h1>
          <p className="text-muted-foreground text-base">
            Upload your ADIF log files to track your Holyland Award progress.
          </p>
        </div>

        {/* Upload Section */}
        <div
          className={`flex flex-col items-center space-y-4 p-8 border-2 border-dashed rounded-xl transition-colors cursor-pointer
            ${isDragging
              ? "border-primary bg-primary/10 scale-[1.01]"
              : "border-accent bg-secondary/30 hover:border-primary"
            }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={handleClick}
        >
          <div className="text-center space-y-3">
            <div className="flex justify-center">
              <Upload className={`h-10 w-10 ${isDragging ? "text-primary" : "text-muted-foreground"}`} />
            </div>
            <p className="text-base font-medium text-foreground">
              {isDragging ? "Drop your file here" : "Drag & drop your ADIF file here"}
            </p>
            <p className="text-sm text-muted-foreground">
              or click to browse (.adi)
            </p>
            <p className="text-sm text-muted-foreground">
              Maximum file size: 20MB
            </p>
            <Button
              onClick={(e) => { e.stopPropagation(); handleClick(); }}
              disabled={isPending}
              className="min-w-[150px]"
              size="lg"
            >
              {isPending ? "Uploading..." : "Choose File"}
            </Button>
          </div>

          <input
            type="file"
            accept=".adi"
            ref={fileInputRef}
            onChange={handleFileChange}
            style={{ display: "none" }}
          />

          {/* Loading State */}
          {isPending && (
            <div className="flex items-center space-x-2 text-primary">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary"></div>
              <span className="text-sm font-medium">Processing file...</span>
            </div>
          )}

          {/* Error State */}
          {(isError || fileError) && (
            <div className="w-full p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <div className="flex items-start space-x-2">
                <div className="text-destructive font-semibold">Upload Failed</div>
              </div>
              <p className="text-destructive text-sm mt-1">
                {fileError || error?.message || "An error occurred while uploading the file"}
              </p>
            </div>
          )}
        </div>

        {/* Success Results */}
        {uploadResult && (
          <div className="space-y-4">
            <div className="p-5 bg-accent/20 border border-accent rounded-xl shadow-sm">
              <div className="flex items-center space-x-2">
                <div className="text-primary font-semibold text-lg">
                  Upload Successful!
                </div>
              </div>
              <p className="text-foreground text-sm mt-1">
                {uploadResult.total_qsos === 0
                  ? "No new squares found in this file for "
                  : `Added ${uploadResult.total_qsos} new square${uploadResult.total_qsos === 1 ? "" : "s"} for `}
                <span className="font-semibold">{uploadResult.callsign}</span>
              </p>
            </div>

            {(uploadResult.unmatched_callsigns?.length ?? 0) > 0 && (
              <div className="p-5 bg-amber-50 border border-amber-300 rounded-xl text-amber-900">
                <div className="font-semibold">
                  This file also has QSOs from other callsigns
                </div>
                <p className="text-sm mt-1">
                  Your callsign is <span className="font-semibold">{uploadResult.callsign}</span>.
                  If one of these was <span className="font-semibold">your own</span> earlier
                  callsign, link it and its squares will count for you.
                  Only link callsigns that really were yours.
                </p>
                <div className="mt-3 space-y-2">
                  {uploadResult.unmatched_callsigns?.map(({ callsign, qsos }) => (
                    <div
                      key={callsign}
                      className="flex items-center justify-between gap-3 rounded-lg border border-amber-200 bg-white px-3 py-2"
                    >
                      <span className="text-sm">
                        <span className="font-semibold">{callsign}</span>
                        <span className="text-muted-foreground">
                          {" "}— {qsos} QSO{qsos === 1 ? "" : "s"} with squares
                        </span>
                      </span>
                      <Button
                        size="sm"
                        disabled={claimOldCallsign.isPending || isPending}
                        onClick={() => handleClaimCallsign(callsign)}
                      >
                        Yes, it's my old callsign
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <QsoTable
              title="New squares from this file"
              qsos={uploadResult.qsos}
              emptyMessage="No new squares found in this file."
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
