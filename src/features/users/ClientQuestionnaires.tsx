import { useEffect, useState } from "react";
import { ChevronDown } from "lucide-react";
import { GlassCard } from "../../components/ui/GlassCard";
import { StatusBadge } from "../../components/ui/StatusBadge";
import { EmptyState } from "../../components/feedback/EmptyState";
import { ErrorState } from "../../components/feedback/ErrorState";
import { SkeletonProfile } from "../../components/feedback/Skeleton";
import {
  listUserQuestionnaires,
  type QuestionAnswer,
  type SubmittedQuestionnaire,
} from "../../api/adminUsers";
import { formatDate } from "../../utils/format";
import { dash } from "./clientFormat";
import styles from "./ClientDetailPage.module.css";

export type QuestionnairesState =
  | { status: "loading" }
  | { status: "error" }
  | { status: "ready"; rows: SubmittedQuestionnaire[] };

/**
 * Loads a member's submitted questionnaires. Used by the Client details page,
 * which needs them before the tab is opened (for the tab's count).
 */
export function useClientQuestionnaires(userId: string | undefined) {
  const [state, setState] = useState<QuestionnairesState>({ status: "loading" });
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    if (!userId) return;
    let stale = false;
    setState({ status: "loading" });
    listUserQuestionnaires(userId)
      .then((res) => {
        if (stale) return;
        setState(
          Array.isArray(res?.questionnaires)
            ? { status: "ready", rows: res.questionnaires }
            : { status: "error" },
        );
      })
      .catch(() => !stale && setState({ status: "error" }));
    return () => {
      stale = true;
    };
  }, [userId, attempt]);

  return { state, retry: () => setAttempt((n) => n + 1) };
}

const answerText = (q: QuestionAnswer) => {
  if (q.answer === null || q.answer === "") return "—";
  if (q.type === "slider") return `${q.answer} / 10`;
  return String(q.answer);
};

/** Questions grouped by app section, keeping the fill-flow order. */
const bySection = (questions: QuestionAnswer[]) => {
  const sections: { title: string; questions: QuestionAnswer[] }[] = [];
  for (const q of questions) {
    const last = sections[sections.length - 1];
    if (last && last.title === q.stepTitle) last.questions.push(q);
    else sections.push({ title: q.stepTitle, questions: [q] });
  }
  return sections;
};

/**
 * The questionnaires the member SUBMITTED in the app - one per plan bought -
 * as an accordion, newest first (Questionnaire 1 is the first plan's). Each
 * opens to every question asked and the member's answer.
 */
export function ClientQuestionnaires({
  state,
  onRetry,
}: {
  state: QuestionnairesState;
  onRetry: () => void;
}) {
  // Accordion: one questionnaire open at a time, the latest by default.
  const latestId = state.status === "ready" ? (state.rows[0]?.questionnaireId ?? null) : null;
  const [openId, setOpenId] = useState<string | null>(latestId);
  useEffect(() => setOpenId(latestId), [latestId]);

  if (state.status === "loading")
    return (
      <GlassCard>
        <SkeletonProfile />
      </GlassCard>
    );
  if (state.status === "error")
    return <ErrorState onRetry={onRetry} />;
  if (state.rows.length === 0) {
    return (
      <GlassCard>
        <EmptyState
          title="No questionnaire submitted"
          description="This member has not submitted a questionnaire in the app."
        />
      </GlassCard>
    );
  }

  const total = state.rows.length;
  return (
    <div className={styles.purchases}>
      {state.rows.map((q, i) => {
        // Rows arrive newest first; numbering counts from the first plan bought,
        // so the latest is on top with the highest number.
        const n = total - i;
        const isOpen = openId === q.questionnaireId;
        const panelId = `questionnaire-panel-${q.questionnaireId}`;
        return (
          <GlassCard key={q.questionnaireId} padding="none">
            <button
              type="button"
              className={styles.accordionHead}
              aria-expanded={isOpen}
              aria-controls={panelId}
              onClick={() => setOpenId(isOpen ? null : q.questionnaireId)}
            >
              <div className={styles.accordionTitle}>
                <p className={styles.planName}>
                  Questionnaire {n}
                  {i === 0 && total > 1 && <span className={styles.latestTag}>Latest</span>}
                </p>
                <span className="text-caption">
                  {[
                    `Plan ${n}: ${dash(q.plan?.name ?? null)}`,
                    q.coach?.name ? `Coach ${q.coach.name}` : null,
                    q.coach?.level ?? null,
                    q.enrollment?.enrollDate
                      ? `Enrolled ${formatDate(q.enrollment.enrollDate)}`
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")}
                </span>
              </div>
              <div className={styles.questionnaireMeta}>
                {/* The record's own status, as stored. */}
                <StatusBadge
                  label={q.status === "submitted" ? "Submitted" : "Draft"}
                  tone={q.status === "submitted" ? "success" : "neutral"}
                />
                <span className="text-caption">
                  {q.submittedAt ? formatDate(q.submittedAt) : "—"}
                </span>
                <ChevronDown
                  size={18}
                  className={isOpen ? `${styles.chevron} ${styles.chevronOpen}` : styles.chevron}
                  aria-hidden
                />
              </div>
            </button>
            {isOpen && (
              <div id={panelId} className={styles.accordionBody}>
                {bySection(q.questions).map((section) => (
                  <section key={section.title} className={styles.qaSection}>
                    <p className={styles.qaSectionTitle}>{section.title}</p>
                    <dl className={styles.qaList}>
                      {section.questions.map((item) => (
                        <div key={item.key} className={styles.qaRow}>
                          <dt className={styles.qaQuestion}>{item.question}</dt>
                          <dd
                            className={
                              item.answer === null
                                ? `${styles.qaAnswer} ${styles.qaEmpty}`
                                : styles.qaAnswer
                            }
                          >
                            {answerText(item)}
                          </dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                ))}
              </div>
            )}
          </GlassCard>
        );
      })}
    </div>
  );
}
