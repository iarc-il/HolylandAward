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
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        {/* Header */}
        <div className="text-center space-y-2">
          <h1 className="text-3xl font-bold">Upload ADIF File</h1>
          <p className="text-muted-foreground">
            Upload your ADIF log files to track your Holyland Award progress.
          </p>
        </div>

        {/* Upload Section */}
        <div className="flex flex-col items-center space-y-4 p-6 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
          <div className="text-center space-y-2">
            <p className="text-sm text-gray-600">
              Select an ADIF file (.adif, .txt, .adi) to upload
            </p>
            <Button
              onClick={handleClick}
              disabled={isPending}
              className="min-w-[150px]"
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
            <div className="flex items-center space-x-2 text-blue-600">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
              <span className="text-sm">Processing file...</span>
            </div>
          )}

          {/* Error State */}
          {isError && (
            <div className="w-full p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start space-x-2">
                <div className="text-red-600 font-semibold">Upload Failed</div>
              </div>
              <p className="text-red-700 text-sm mt-1">
                {error?.message || "An error occurred while uploading the file"}
              </p>
            </div>
          )}
        </div>

        {/* Success Results */}
        {uploadResult && (
          <div className="space-y-4">
            <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
              <div className="flex items-center space-x-2">
                <div className="text-green-600 font-semibold">
                  Upload Successful!
                </div>
              </div>
              <p className="text-green-700 text-sm mt-1">
                Processed {uploadResult.total_qsos} new QSO entries for{" "}
                {uploadResult.callsign}
              </p>
            </div>

            {/* QSO Table */}
            <div className="bg-white border rounded-lg overflow-hidden">
              <div className="px-6 py-4 bg-gray-50 border-b">
                <h3 className="text-lg font-semibold">Uploaded QSOs</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Date
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Frequency
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        DX Station
                      </th>
                      <th className="px-4 py-2 text-left text-sm font-medium text-gray-700">
                        Area
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {uploadResult.qsos.map((qso, index) => (
                      <tr key={qso.id || index} className="hover:bg-gray-50">
                        <td className="px-4 py-2 text-sm">{qso.date}</td>
                        <td className="px-4 py-2 text-sm">
                          {qso.freq.toFixed(3)} MHz
                        </td>
                        <td className="px-4 py-2 text-sm font-medium">
                          {qso.dx}
                        </td>
                        <td className="px-4 py-2 text-sm">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
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
