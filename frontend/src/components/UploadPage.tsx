import { Button } from "@ui/button";

import React, { useRef } from "react";
// const UploadPage = () => (
//   <div className="flex flex-col space-y-4">
//     <h1 className="text-3xl font-bold">Upload ADIF File</h1>
//     <p className="text-muted-foreground">Upload your ADIF log files to track your progress.</p>
//     <Button>Upload File</Button>
//   </div>
// )

// export default UploadPage

import useAdifUpload from "@/hooks/useFileUpload";

const FileUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { mutate: uploadFile, reset } = useAdifUpload();

  const handleClick = () => {
    // Reset mutation state before allowing new upload
    reset();
    // Check if the ref has a current value and then simulate a click
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get the selected files from the event
    const files = event.target.files;
    if (files) {
      const file = files[0]; // Assuming single file upload
      uploadFile({ file });
    }
    // Reset the input value to allow uploading the same file again
    event.target.value = "";
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <div>
        <Button onClick={handleClick}>Upload File</Button>
        <input
          type="file"
          accept=".adif,.txt,.adi"
          ref={fileInputRef}
          onChange={handleFileChange}
          style={{ display: "none" }} // Hide the input element
        />
      </div>
    </div>
  );
};

export default FileUploader;
