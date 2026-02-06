import { Button } from "@ui/button";
import React, { useRef, useState } from "react";
import useAdifUpload from "@/hooks/useFileUpload";

type QSO = {
  id?: number;
  date: string;
  freq: number;
  dx: string;
  area: string;
};

type UploadResponse = {
  total_qsos: number;
  callsign: string;
  qsos: QSO[];
};

const FileUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploadResult, setUploadResult] = useState<UploadResponse | null>(null);
  const {
    mutate: uploadFile,
    isPending,
    isError,
    error,
    reset,
  } = useAdifUpload();

  const handleClick = () => {
    // Reset mutation state and clear previous results
    reset();
    setUploadResult(null);
    // Check if the ref has a current value and then simulate a click
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get the selected files from the event
    const files = event.target.files;
    if (files) {
      const file = files[0]; // Assuming single file upload
      uploadFile(
        { file },
        {
          onSuccess: (data) => {
            setUploadResult(data);
          },
          onError: (error) => {
            console.error("Upload failed:", error);
          },
        }
      );
    }
    // Reset the input value to allow uploading the same file again
    event.target.value = "";
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
        <div className="flex flex-col items-center space-y-4 p-8 border-2 border-dashed border-accent rounded-xl bg-secondary/30 transition-colors hover:border-primary">
          <div className="text-center space-y-3">
            <p className="text-sm text-muted-foreground">
              Select an ADIF file (.adif, .txt, .adi) to upload
            </p>
            <Button
              onClick={handleClick}
              disabled={isPending}
              className="min-w-[150px]"
              size="lg"
            >
              {isPending ? "Uploading..." : "Choose File"}
            </Button>
          </div>

          <input
            type="file"
            accept=".adif,.txt,.adi"
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
          {isError && (
            <div className="w-full p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
              <div className="flex items-start space-x-2">
                <div className="text-destructive font-semibold">Upload Failed</div>
              </div>
              <p className="text-destructive text-sm mt-1">
                {error?.message || "An error occurred while uploading the file"}
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
                Processed {uploadResult.total_qsos} new QSO entries for{" "}
                <span className="font-semibold">{uploadResult.callsign}</span>
              </p>
            </div>

            {/* QSO Table */}
            <div className="bg-card border border-border rounded-xl overflow-hidden shadow-md">
              <div className="px-6 py-4 bg-secondary border-b border-border">
                <h3 className="text-lg font-semibold">Uploaded QSOs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-secondary/50">
                    <tr>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                        Date
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                        Frequency
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                        DX Station
                      </th>
                      <th className="px-4 py-3 text-left text-sm font-semibold text-foreground">
                        Area
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {uploadResult.qsos.map((qso, index) => (
                      <tr key={qso.id || index} className="hover:bg-accent/10 transition-colors">
                        <td className="px-4 py-3 text-sm">{qso.date}</td>
                        <td className="px-4 py-3 text-sm">
                          {qso.freq.toFixed(3)} MHz
                        </td>
                        <td className="px-4 py-3 text-sm font-medium">
                          {qso.dx}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/30">
                            {qso.area}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUploader;
