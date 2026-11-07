import { useState } from "react";
import { ImageOff } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Pagination } from "../../components/data-display/Pagination";
import { GlassCard } from "../../components/ui/GlassCard";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonCard } from "../../components/feedback/Skeleton";
import { usePagedQuery } from "../../hooks/usePagedQuery";
import { resolveMediaUrl } from "../../api/media";
import { listTransformations, type CoachTransformation } from "../../api/transformations";
import styles from "./TransformationsPage.module.css";

const PAGE_SIZE = 24;

/** The transformation images coaches submitted, newest first: each image with its title. */
export function TransformationsPage() {
  const [page, setPage] = useState(1);
  const { rows, total, loading, error, retry } = usePagedQuery(listTransformations, { page, pageSize: PAGE_SIZE });

  return (
    <>
      <PageHeader
        title="Transformations"
        breadcrumb={[{ label: "Progress" }, { label: "Transformations" }]}
        description="Transformation images submitted by coaches."
      />

      {loading && (
        <div className={styles.cardGrid}>
          {Array.from({ length: 8 }, (_, i) => (
            <SkeletonCard key={i} />
          ))}
        </div>
      )}

      {!loading && error && (
        <GlassCard>
          <ErrorState description="We couldn't load the transformations." onRetry={retry} />
        </GlassCard>
      )}

      {!loading && !error && rows.length === 0 && (
        <GlassCard>
          <EmptyState
            title="No transformations yet"
            description="Transformation images coaches submit will show up here."
          />
        </GlassCard>
      )}

      {!loading && !error && rows.length > 0 && (
        <>
          <div className={styles.cardGrid}>
            {rows.map((t) => (
              <TransformationTile key={t.id} transformation={t} />
            ))}
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} total={total} onPageChange={setPage} />
        </>
      )}
    </>
  );
}

function TransformationTile({ transformation }: { transformation: CoachTransformation }) {
  const [failed, setFailed] = useState(false);
  const src = resolveMediaUrl(transformation.imageUrl);
  return (
    <GlassCard className={styles.card}>
      <div className={styles.image}>
        {src && !failed ? (
          <img src={src} alt={transformation.title} loading="lazy" onError={() => setFailed(true)} />
        ) : (
          <div className={styles.imageFailed} role="img" aria-label="Image unavailable">
            <ImageOff size={22} aria-hidden="true" />
            <span>Image unavailable</span>
          </div>
        )}
      </div>
      <p className={styles.title}>{transformation.title}</p>
    </GlassCard>
  );
}
