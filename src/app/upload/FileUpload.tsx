import { Input } from '../components/ui/input'
import { Label } from '../components/ui/label'

interface FileUploadProps {
  onFileChange: (file: File | null) => void;
  label: string;
  accept: string;
}

const FileUpload: React.FC<FileUploadProps> = ({ onFileChange, label, accept }) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFile = e.target.files[0];
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
