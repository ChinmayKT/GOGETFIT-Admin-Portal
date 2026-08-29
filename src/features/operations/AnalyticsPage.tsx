import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { Input } from "../../components/forms/Input";
import { useToast } from "../../components/feedback/ToastProvider";
import { UsersSection } from "./analytics-sections/UsersSection";
import { CoachesSection } from "./analytics-sections/CoachesSection";
import { PlansSection } from "./analytics-sections/PlansSection";
import { EngagementSection } from "./analytics-sections/EngagementSection";
import { ChallengesSection } from "./analytics-sections/ChallengesSection";
import { RewardsSection } from "./analytics-sections/RewardsSection";
import { CommerceSection } from "./analytics-sections/CommerceSection";
import styles from "./AnalyticsPage.module.css";

const SECTIONS = [
  { key: "users", label: "Users" },
  { key: "coaches", label: "Coaches" },
  { key: "plans", label: "Plans" },
  { key: "engagement", label: "Engagement" },
  { key: "challenges", label: "Challenges" },
  { key: "rewards", label: "Rewards" },
  { key: "commerce", label: "Commerce" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

function defaultFrom(): string {
  const d = new Date();
  d.setDate(d.getDate() - 30);
  return d.toISOString().slice(0, 10);
}

function defaultTo(): string {
  return new Date().toISOString().slice(0, 10);
}

export function AnalyticsPage() {
  const [active, setActive] = useState<SectionKey>("users");
  const [from, setFrom] = useState(defaultFrom());
  const [to, setTo] = useState(defaultTo());
  const { show } = useToast();

  return (
    <>
      <PageHeader
        title="Analytics"
        description="Cross-module insight into users, coaches, plans, engagement, challenges, rewards and commerce — mock data for prototype purposes."
        actions={
          <div className={styles.toolbar}>
            <div className={styles.dateField}>
              <span className={styles.dateLabel}>Date range</span>
              <div className={styles.dateInputs}>
                <Input type="date" value={from} onChange={(e) => setFrom(e.target.value)} aria-label="From date" />
                <span className={styles.dateSep}>to</span>
                <Input type="date" value={to} onChange={(e) => setTo(e.target.value)} aria-label="To date" />
              </div>
            </div>
            <Button
              variant="primary"
              icon={<Download size={15} />}
              onClick={() => show("Report export started — check your downloads shortly", "success")}
            >
              Export
            </Button>
          </div>
        }
      />

      <p className={styles.note}>
        The date range above is a visual affordance for this mock prototype — it isn't wired to refetch data.
      </p>

      <Tabs
        className={styles.tabs}
        tabs={SECTIONS.map((s) => ({ key: s.key, label: s.label }))}
        active={active}
        onChange={(key) => setActive(key as SectionKey)}
      />

      {active === "users" && <UsersSection />}
      {active === "coaches" && <CoachesSection />}
      {active === "plans" && <PlansSection />}
      {active === "engagement" && <EngagementSection />}
      {active === "challenges" && <ChallengesSection />}
      {active === "rewards" && <RewardsSection />}
      {active === "commerce" && <CommerceSection />}
    </>
  );
}
