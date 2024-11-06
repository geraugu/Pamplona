import { Button, Input, Label } from "@/components/ui"; // Reverting to the original import path
import { useState } from "react";

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  label: string;
  accept: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, label, accept }) => {
  const [file, setFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      onFileChange(selectedFile);
    }
  };

  return (
    <div>
      <Label>{label}</Label>
      <Input type="file" accept={accept} onChange={handleFileChange} />
    </div>
  );
};

export default FileUpload;
