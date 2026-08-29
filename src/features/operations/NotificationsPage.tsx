import { useState } from "react";
import { Plus } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { NotificationCampaignsTab } from "./NotificationCampaignsTab";
import { NotificationTemplatesTab } from "./NotificationTemplatesTab";
import { NotificationScheduledTab } from "./NotificationScheduledTab";
import { NotificationSentTab } from "./NotificationSentTab";
import { NotificationFailedTab } from "./NotificationFailedTab";
import { NotificationComposerModal } from "./NotificationComposerModal";

const TABS = [
  { key: "campaigns", label: "Campaigns" },
  { key: "templates", label: "Templates" },
  { key: "scheduled", label: "Scheduled" },
  { key: "sent", label: "Sent" },
  { key: "failed", label: "Failed" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export function NotificationsPage() {
  const [active, setActive] = useState<TabKey>("campaigns");
  const [refreshKey, setRefreshKey] = useState(0);
  const [composerOpen, setComposerOpen] = useState(false);

  function bump() {
    setRefreshKey((k) => k + 1);
  }

  function handleCreated(campaign: { status: string }) {
    setComposerOpen(false);
    bump();
    setActive(campaign.status === "Scheduled" ? "scheduled" : "sent");
  }

  return (
    <>
      <PageHeader
        title="Notifications"
        description="Send push notification campaigns, manage reusable templates, and track delivery across every audience segment."
        actions={
          <Button variant="primary" icon={<Plus size={15} />} onClick={() => setComposerOpen(true)}>
            New Campaign
          </Button>
        }
      />

      <Tabs tabs={TABS.map((t) => ({ key: t.key, label: t.label }))} active={active} onChange={(key) => setActive(key as TabKey)} />

      {active === "campaigns" && <NotificationCampaignsTab refreshKey={refreshKey} />}
      {active === "templates" && <NotificationTemplatesTab />}
      {active === "scheduled" && <NotificationScheduledTab refreshKey={refreshKey} onChanged={bump} />}
      {active === "sent" && <NotificationSentTab refreshKey={refreshKey} />}
      {active === "failed" && <NotificationFailedTab refreshKey={refreshKey} onChanged={bump} />}

      <NotificationComposerModal open={composerOpen} onClose={() => setComposerOpen(false)} onCreated={handleCreated} />
    </>
  );
}
