import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { LeaderboardTab } from "./LeaderboardTab";
import { TransactionsTab } from "./TransactionsTab";
import { RewardRulesTab } from "./RewardRulesTab";
import { BadgesTab } from "./BadgesTab";
import { AddRewardModal } from "./AddRewardModal";

const TABS = [
  { key: "leaderboard", label: "Leaderboard" },
  { key: "transactions", label: "Transactions" },
  { key: "rules", label: "Reward Rules" },
  { key: "badges", label: "Badges" },
];

export function RewardsPage() {
  const [tab, setTab] = useState("leaderboard");
  const [addOpen, setAddOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  return (
    <>
      <PageHeader
        title="Rewards"
        breadcrumb={[{ label: "Engagement" }, { label: "Rewards" }]}
        description="Points, leaderboard rank, reward rules and badges across the GoGetFit community."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setAddOpen(true)}>
            Add Rewards
          </Button>
        }
      />

      <div style={{ marginBottom: 20 }}>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />
      </div>

      {tab === "leaderboard" && <LeaderboardTab refreshKey={refreshKey} />}
      {tab === "transactions" && <TransactionsTab refreshKey={refreshKey} />}
      {tab === "rules" && <RewardRulesTab />}
      {tab === "badges" && <BadgesTab />}

      <AddRewardModal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        onAdded={() => {
          setAddOpen(false);
          setRefreshKey((k) => k + 1);
        }}
      />
    </>
  );
}
