import type { ReactNode } from "react";
import { Checkbox } from "../forms/Checkbox";
import { SkeletonTable } from "../feedback/Skeleton";
import { EmptyState } from "../feedback/EmptyState";
import { ErrorState } from "../feedback/ErrorState";
import { GlassDataSurface } from "./GlassDataSurface";
import { cn } from "../../utils/cn";
import styles from "./DataTable.module.css";

export interface Column<T> {
  key: string;
  header: string;
  render?: (row: T) => ReactNode;
  sortable?: boolean;
  width?: string;
  align?: "left" | "right" | "center";
}

interface DataTableProps<T> {
  columns: Column<T>[];
  rows: T[];
  getRowId: (row: T) => string;
  loading?: boolean;
  error?: boolean;
  onRetry?: () => void;
  emptyTitle?: string;
  emptyDescription?: string;
  emptyAction?: ReactNode;
  selectable?: boolean;
  selectedIds?: Set<string>;
  onSelectionChange?: (ids: Set<string>) => void;
  onRowClick?: (row: T) => void;
  sortKey?: string;
  sortDir?: "asc" | "desc";
  onSortChange?: (key: string) => void;
  rowActions?: (row: T) => ReactNode;
}

export function DataTable<T>({
  columns,
  rows,
  getRowId,
  loading,
  error,
  onRetry,
  emptyTitle = "Nothing here yet",
  emptyDescription,
  emptyAction,
  selectable,
  selectedIds,
  onSelectionChange,
  onRowClick,
  sortKey,
  sortDir,
  onSortChange,
  rowActions,
}: DataTableProps<T>) {
  if (loading) {
    return (
      <GlassDataSurface>
        <SkeletonTable columns={columns.length} />
      </GlassDataSurface>
    );
  }

  if (error) {
    return (
      <GlassDataSurface>
        <ErrorState onRetry={onRetry} />
      </GlassDataSurface>
    );
  }

  if (rows.length === 0) {
    return (
      <GlassDataSurface>
        <EmptyState title={emptyTitle} description={emptyDescription} action={emptyAction} />
      </GlassDataSurface>
    );
  }

  const allSelected = selectable && rows.length > 0 && rows.every((r) => selectedIds?.has(getRowId(r)));

  const toggleAll = () => {
    if (!onSelectionChange) return;
    if (allSelected) onSelectionChange(new Set());
    else onSelectionChange(new Set(rows.map(getRowId)));
  };

  const toggleRow = (id: string) => {
    if (!onSelectionChange || !selectedIds) return;
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelectionChange(next);
  };

  return (
    <GlassDataSurface className={styles.surface}>
      <div className={styles.scroll}>
        <table className={styles.table}>
          <thead>
            <tr>
              {selectable && (
                <th className={styles.checkboxCell}>
                  <Checkbox checked={allSelected} onChange={toggleAll} />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={col.key}
                  style={{ width: col.width, textAlign: col.align }}
                  className={cn(col.sortable && styles.sortable)}
                  onClick={() => col.sortable && onSortChange?.(col.key)}
                >
                  {col.header}
                  {col.sortable && sortKey === col.key && (
                    <span className={styles.sortIcon}>{sortDir === "asc" ? "↑" : "↓"}</span>
                  )}
                </th>
              ))}
              {rowActions && <th className={styles.actionsHeader} />}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => {
              const id = getRowId(row);
              return (
                <tr
                  key={id}
                  className={cn(onRowClick && styles.clickable)}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td className={styles.checkboxCell} onClick={(e) => e.stopPropagation()}>
                      <Checkbox checked={selectedIds?.has(id) ?? false} onChange={() => toggleRow(id)} />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={col.key} style={{ textAlign: col.align }}>
                      {col.render ? col.render(row) : String((row as Record<string, unknown>)[col.key] ?? "—")}
                    </td>
                  ))}
                  {rowActions && (
                    <td className={styles.actionsCell} onClick={(e) => e.stopPropagation()}>
                      {rowActions(row)}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </GlassDataSurface>
  );
}
