import { Button } from "@ui/button"

import React, { useRef } from 'react';
// const UploadPage = () => (
//   <div className="flex flex-col space-y-4">
//     <h1 className="text-3xl font-bold">Upload ADIF File</h1>
//     <p className="text-muted-foreground">Upload your ADIF log files to track your progress.</p>
//     <Button>Upload File</Button>
//   </div>
// )

// export default UploadPage



const FileUploader = () => {
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleClick = () => {
    // Check if the ref has a current value and then simulate a click
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    // Get the selected files from the event
    const files = event.target.files;
    if (files) {
      console.log('Selected files:', files);
      // You can now process the files here
    }
  };

  return (
    <div>
      <Button onClick={handleClick}>
        Upload File
      </Button>

      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileChange}
        style={{ display: 'none' }} // Hide the input element
      />
    </div>
  );
};

export default FileUploader;