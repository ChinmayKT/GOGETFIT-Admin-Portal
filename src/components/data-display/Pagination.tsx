import { IconButton } from "../ui/IconButton";
import styles from "./Pagination.module.css";

interface PaginationProps {
  page: number;
  pageSize: number;
  total: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, pageSize, total, onPageChange }: PaginationProps) {
  const totalPages = Math.max(1, Math.ceil(total / pageSize));
  const start = total === 0 ? 0 : (page - 1) * pageSize + 1;
  const end = Math.min(page * pageSize, total);

  return (
    <div className={styles.root}>
      <span className={styles.summary}>
        {start}–{end} of {total}
      </span>
      <div className={styles.controls}>
        <IconButton
          icon={<ChevronLeft />}
          label="Previous page"
          size="sm"
          disabled={page <= 1}
          onClick={() => onPageChange(page - 1)}
        />
        <span className={styles.pageLabel}>
          Page {page} of {totalPages}
        </span>
        <IconButton
          icon={<ChevronRight />}
          label="Next page"
          size="sm"
          disabled={page >= totalPages}
          onClick={() => onPageChange(page + 1)}
        />
      </div>
    </div>
  );
}

function ChevronLeft() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M9 3L5 7L9 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
function ChevronRight() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
      <path d="M5 3L9 7L5 11" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
