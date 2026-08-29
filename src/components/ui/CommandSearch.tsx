import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search } from "lucide-react";
import { searchAll, type SearchResult } from "../../mock/shared/searchIndex";
import styles from "./CommandSearch.module.css";

export function CommandSearch({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    if (!open) setQuery("");
  }, [open]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    if (open) document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open, onClose]);

  if (!open) return null;

  const results = searchAll(query);
  const grouped = results.reduce<Record<string, SearchResult[]>>((acc, r) => {
    (acc[r.group] ??= []).push(r);
    return acc;
  }, {});

  return createPortal(
    <div className={styles.overlay} onMouseDown={onClose}>
      <div className={styles.panel} onMouseDown={(e) => e.stopPropagation()}>
        <div className={styles.inputRow}>
          <Search size={16} className={styles.icon} />
          <input
            autoFocus
            className={styles.input}
            placeholder="Search users, coaches, plans, food, workouts, orders..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <kbd className={styles.kbd}>Esc</kbd>
        </div>
        <div className={styles.results}>
          {query.trim() === "" && <p className={styles.hint}>Start typing to search across the whole portal.</p>}
          {query.trim() !== "" && results.length === 0 && <p className={styles.hint}>No matches for "{query}".</p>}
          {Object.entries(grouped).map(([group, items]) => (
            <div key={group} className={styles.group}>
              <span className={styles.groupLabel}>{group}</span>
              {items.map((item) => (
                <button
                  key={item.id}
                  className={styles.item}
                  onClick={() => {
                    navigate(item.path);
                    onClose();
                  }}
                >
                  <span className={styles.itemTitle}>{item.title}</span>
                  <span className={styles.itemSubtitle}>{item.subtitle}</span>
                </button>
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>,
    document.body,
  );
}
