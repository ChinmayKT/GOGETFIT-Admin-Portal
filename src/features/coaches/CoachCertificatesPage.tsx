import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { FileUploader, type UploadedFile } from "../../components/media/FileUploader";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import { useToast } from "../../components/feedback/ToastProvider";
import { getCoach, addCertificate, removeCertificate } from "../../mock/coaches/repository";
import { formatDate } from "../../utils/format";
import type { Coach } from "../../types/coach";
import styles from "../users/UserFormPage.module.css";

export function CoachCertificatesPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { show } = useToast();
  const [coach, setCoach] = useState<Coach | null>(null);
  const [loading, setLoading] = useState(true);
  const [files, setFiles] = useState<UploadedFile[]>([]);

  useEffect(() => {
    if (!id) return;
    getCoach(id).then((c) => {
      setCoach(c);
      if (c) setFiles(c.certificates.map((cert) => ({ id: cert.id, name: cert.fileName, sizeLabel: formatDate(cert.uploadedAt), progress: 100, status: "done" as const })));
      setLoading(false);
    });
  }, [id]);

  async function handleAdd(list: File[]) {
    if (!id) return;
    for (const file of list) {
      const updated = await addCertificate(id, file.name);
      setCoach(updated);
      setFiles(updated.certificates.map((cert) => ({ id: cert.id, name: cert.fileName, sizeLabel: formatDate(cert.uploadedAt), progress: 100, status: "done" as const })));
    }
    show("Certificate uploaded");
  }

  async function handleRemove(certId: string) {
    if (!id) return;
    const updated = await removeCertificate(id, certId);
    setCoach(updated);
    setFiles(updated.certificates.map((cert) => ({ id: cert.id, name: cert.fileName, sizeLabel: formatDate(cert.uploadedAt), progress: 100, status: "done" as const })));
    show("Certificate removed", "info");
  }

  if (loading) return <GlassCard><SkeletonProfile /></GlassCard>;
  if (!coach) return null;

  return (
    <>
      <button className={styles.backLink} onClick={() => navigate(`/coaches/${id}`)}>
        <ArrowLeft size={14} /> Back to {coach.firstName} {coach.lastName}
      </button>
      <PageHeader
        title="Add Certificate"
        breadcrumb={[{ label: "Coaches", path: "/coaches" }, { label: `${coach.firstName} ${coach.lastName}`, path: `/coaches/${id}` }, { label: "Certificates" }]}
        description="Upload certification documents for this coach. Maximum 2 files."
      />
      <GlassCard>
        <FileUploader
          accept="image/jpeg,image/jpg,image/png,application/pdf"
          acceptLabel="JPG, PNG or PDF"
          multiple
          maxFiles={2}
          files={files}
          onAdd={handleAdd}
          onRemove={handleRemove}
          hint="max 2 files"
        />
      </GlassCard>
    </>
  );
}
