import { useMemo, useRef, useState } from "react";
import { FileText, Film, ImageIcon, Upload as UploadIcon } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { FilterBar } from "../../components/data-display/FilterBar";
import { SearchInput } from "../../components/data-display/SearchInput";
import { Select } from "../../components/forms/Select";
import { Input } from "../../components/forms/Input";
import { Pagination } from "../../components/data-display/Pagination";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { GlassCard } from "../../components/ui/GlassCard";
import { GlassModal } from "../../components/ui/GlassModal";
import { Field } from "../../components/forms/Field";
import { FileUploader, toUploadedFile, type UploadedFile } from "../../components/media/FileUploader";
import { ErrorState } from "../../components/feedback/ErrorState";
import { EmptyState } from "../../components/feedback/EmptyState";
import { SkeletonCard } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { useCurrentAdmin } from "../../app/providers/AuthProvider";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { listMediaAssets, mediaUploaders, mediaFileTypes, uploadMediaAssets } from "../../mock/content/mediaRepository";
import { nextId } from "../../mock/shared/utils";
import { formatDate } from "../../utils/format";
import type { MediaAsset, MediaCategory, MediaModule } from "../../types/content";
import styles from "./MediaLibraryPage.module.css";

const CATEGORY_TABS: { key: MediaCategory; label: string }[] = [
  { key: "Images", label: "Images" },
  { key: "Videos", label: "Videos" },
  { key: "Documents", label: "Documents" },
];

const MODULES: MediaModule[] = ["Articles", "Banners", "Coaches", "Workouts", "Food", "Challenges", "Transformations", "Products"];

export function MediaLibraryPage() {
  const { show } = useToast();
  const currentAdmin = useCurrentAdmin();

  const [category, setCategory] = useState<MediaCategory>("Images");
  const [query, setQuery] = useState("");
  const [module, setModule] = useState("");
  const [fileType, setFileType] = useState("");
  const [uploadedBy, setUploadedBy] = useState("");
  const [uploadedAfter, setUploadedAfter] = useState("");
  const [page, setPage] = useState(1);
  const [refreshKey, setRefreshKey] = useState(0);
  const pageSize = 12;

  const [uploadOpen, setUploadOpen] = useState(false);
  const [uploadModule, setUploadModule] = useState<MediaModule>("Articles");
  const [uploadFiles, setUploadFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const rawFiles = useRef<Map<string, File>>(new Map());

  const params = useMemo(
    () => ({
      query, category, module: module || undefined, fileType: fileType || undefined,
      uploadedBy: uploadedBy || undefined, uploadedAfter: uploadedAfter || undefined,
      page, pageSize, refreshKey,
    }),
    [query, category, module, fileType, uploadedBy, uploadedAfter, page, refreshKey],
  );
  const { rows, total, loading, error, retry } = usePagedQuery(listMediaAssets, params);

  const uploaderOptions = useMemo(() => mediaUploaders(), [refreshKey]);
  const typeOptions = useMemo(() => mediaFileTypes(), [refreshKey]);

  function handleTabChange(key: string) {
    setCategory(key as MediaCategory);
    setFileType("");
    setPage(1);
  }

  function handleAddUploadFiles(files: File[]) {
    const wrapped = files.map((f) => {
      const uf = toUploadedFile(f, nextId("mediaupload"));
      rawFiles.current.set(uf.id, f);
      return uf;
    });
    setUploadFiles((prev) => [...prev, ...wrapped]);
  }

  function handleRemoveUploadFile(id: string) {
    rawFiles.current.delete(id);
    setUploadFiles((prev) => prev.filter((f) => f.id !== id));
  }

  function closeUploadModal() {
    setUploadOpen(false);
    setUploadFiles([]);
    rawFiles.current.clear();
  }

  async function handleUploadSubmit() {
    const files = uploadFiles.map((f) => rawFiles.current.get(f.id)).filter((f): f is File => Boolean(f));
    if (files.length === 0) {
      show("Add at least one file to upload", "error");
      return;
    }
    setUploading(true);
    try {
      await uploadMediaAssets(files, uploadModule, currentAdmin.name);
      show(`${files.length} file${files.length > 1 ? "s" : ""} uploaded to the media library`);
      closeUploadModal();
      setRefreshKey((k) => k + 1);
    } finally {
      setUploading(false);
    }
  }

  return (
    <>
      <PageHeader
        title="Media Library"
        breadcrumb={[{ label: "Content" }, { label: "Media Library" }]}
        description="A shared asset library across articles, banners, coaches, workouts and more."
        actions={
          <Button variant="primary" icon={<UploadIcon size={15} />} onClick={() => setUploadOpen(true)}>
            Upload
          </Button>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <Tabs tabs={CATEGORY_TABS} active={category} onChange={handleTabChange} />
      </div>

      <FilterBar>
        <SearchInput value={query} onChange={(v) => { setQuery(v); setPage(1); }} placeholder="Search by filename, module, uploader..." />
        <Select
          value={module}
          onChange={(e) => { setModule(e.target.value); setPage(1); }}
          placeholder="Module"
          options={[{ label: "All modules", value: "" }, ...MODULES.map((m) => ({ label: m, value: m }))]}
        />
        <Select
          value={fileType}
          onChange={(e) => { setFileType(e.target.value); setPage(1); }}
          placeholder="Type"
          options={[{ label: "All types", value: "" }, ...typeOptions.map((t) => ({ label: t, value: t }))]}
        />
        <Select
          value={uploadedBy}
          onChange={(e) => { setUploadedBy(e.target.value); setPage(1); }}
          placeholder="Uploaded By"
          options={[{ label: "Anyone", value: "" }, ...uploaderOptions.map((u) => ({ label: u, value: u }))]}
        />
        <Input type="date" value={uploadedAfter} onChange={(e) => { setUploadedAfter(e.target.value); setPage(1); }} title="Uploaded on or after" />
      </FilterBar>

      {loading && (
        <div className={styles.grid}>
          {Array.from({ length: 8 }, (_, i) => <SkeletonCard key={i} />)}
        </div>
      )}

      {!loading && error && (
        <GlassCard><ErrorState onRetry={retry} /></GlassCard>
      )}

      {!loading && !error && rows.length === 0 && (
        <GlassCard>
          <EmptyState title="No assets found" description="Try a different filter, or upload a new asset to the library." />
        </GlassCard>
      )}

      {!loading && !error && rows.length > 0 && (
        <div className={styles.grid}>
          {rows.map((asset) => <AssetCard key={asset.id} asset={asset} />)}
        </div>
      )}

      {!loading && !error && rows.length > 0 && (
        <Pagination page={page} pageSize={pageSize} total={total} onPageChange={setPage} />
      )}

      <GlassModal
        open={uploadOpen}
        onClose={closeUploadModal}
        title="Upload Media"
        footer={
          <>
            <Button variant="ghost" onClick={closeUploadModal}>Cancel</Button>
            <Button variant="primary" loading={uploading} onClick={handleUploadSubmit}>Upload</Button>
          </>
        }
      >
        <Field label="Module" helperText="Which section will these assets be used in?">
          <Select value={uploadModule} onChange={(e) => setUploadModule(e.target.value as MediaModule)} options={MODULES.map((m) => ({ label: m, value: m }))} />
        </Field>
        <div style={{ marginTop: 16 }}>
          <FileUploader
            accept="image/*,video/*,application/pdf"
            acceptLabel="Images, videos, or PDFs"
            multiple
            files={uploadFiles}
            onAdd={handleAddUploadFiles}
            onRemove={handleRemoveUploadFile}
          />
        </div>
      </GlassModal>
    </>
  );
}

function AssetCard({ asset }: { asset: MediaAsset }) {
  return (
    <GlassCard padding="none" className={styles.card}>
      <div className={styles.thumb}>
        {asset.category === "Documents" || !asset.url ? (
          <div className={styles.iconThumb}>
            <FileText size={26} />
          </div>
        ) : asset.category === "Videos" ? (
          <div className={styles.videoThumb}>
            <img src={asset.url} alt={asset.fileName} />
            <Film size={14} className={styles.videoBadge} />
          </div>
        ) : (
          <img src={asset.url} alt={asset.fileName} />
        )}
      </div>
      <div className={styles.body}>
        <p className={styles.fileName} title={asset.fileName}>{asset.fileName}</p>
        <div className={styles.metaRow}>
          <ImageIcon size={11} />
          <span>{asset.dimensions ?? asset.durationLabel ?? asset.category}</span>
          <span>·</span>
          <span>{asset.sizeLabel}</span>
        </div>
        <div className={styles.metaRow}>
          <span>Used in {asset.usageCount} place{asset.usageCount === 1 ? "" : "s"}</span>
        </div>
        <div className={styles.footerRow}>
          <span>{asset.uploadedBy}</span>
          <span>{formatDate(asset.uploadedAt)}</span>
        </div>
      </div>
    </GlassCard>
  );
}
