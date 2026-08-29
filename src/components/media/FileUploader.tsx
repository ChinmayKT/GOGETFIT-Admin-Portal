import { useCallback, useRef, useState } from "react";
import { UploadCloud, X, FileText } from "lucide-react";
import { cn } from "../../utils/cn";
import styles from "./FileUploader.module.css";

export interface UploadedFile {
  id: string;
  name: string;
  sizeLabel: string;
  previewUrl?: string;
  progress: number;
  status: "uploading" | "done" | "error";
}

interface FileUploaderProps {
  accept: string;
  acceptLabel: string;
  multiple?: boolean;
  maxFiles?: number;
  files: UploadedFile[];
  onAdd: (files: File[]) => void;
  onRemove: (id: string) => void;
  hint?: string;
}

function formatSize(bytes: number): string {
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function toUploadedFile(file: File, id: string): UploadedFile {
  const isImage = file.type.startsWith("image/");
  return {
    id,
    name: file.name,
    sizeLabel: formatSize(file.size),
    previewUrl: isImage ? URL.createObjectURL(file) : undefined,
    progress: 100,
    status: "done",
  };
}

export function FileUploader({ accept, acceptLabel, multiple, maxFiles, files, onAdd, onRemove, hint }: FileUploaderProps) {
  const [dragging, setDragging] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = useCallback(
    (list: FileList | null) => {
      if (!list) return;
      const incoming = Array.from(list);
      if (maxFiles && files.length + incoming.length > maxFiles) {
        setWarning(`Only ${maxFiles} file${maxFiles > 1 ? "s" : ""} allowed — remove one before adding more.`);
        return;
      }
      setWarning(null);
      onAdd(incoming);
    },
    [files.length, maxFiles, onAdd],
  );

  return (
    <div>
      <div
        className={cn(styles.dropzone, dragging && styles.dragging)}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          handleFiles(e.dataTransfer.files);
        }}
        onClick={() => inputRef.current?.click()}
        role="button"
        tabIndex={0}
      >
        <UploadCloud size={22} className={styles.icon} />
        <p className={styles.title}>Drag & drop or click to upload</p>
        <p className={styles.subtitle}>{acceptLabel}{hint ? ` · ${hint}` : ""}</p>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multiple}
          className={styles.hiddenInput}
          onChange={(e) => handleFiles(e.target.files)}
        />
      </div>

      {warning && <p className={styles.warning}>{warning}</p>}

      {files.length > 0 && (
        <div className={styles.fileList}>
          {files.map((f) => (
            <div key={f.id} className={styles.fileItem}>
              {f.previewUrl ? (
                <img src={f.previewUrl} alt={f.name} className={styles.thumb} />
              ) : (
                <div className={styles.thumbIcon}>
                  <FileText size={18} />
                </div>
              )}
              <div className={styles.fileInfo}>
                <span className={styles.fileName}>{f.name}</span>
                <span className={styles.fileSize}>{f.sizeLabel}</span>
              </div>
              <button className={styles.removeBtn} onClick={(e) => { e.stopPropagation(); onRemove(f.id); }} aria-label={`Remove ${f.name}`}>
                <X size={14} />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
