import { useState } from "react";
import { Download } from "lucide-react";
import { PageHeader } from "../../components/layout/PageHeader";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { useToast } from "../../components/feedback/ToastProvider";
import { RevenueTrendSection } from "./revenue-sections/RevenueTrendSection";
import { ByPackageSection } from "./revenue-sections/ByPackageSection";
import { ByCoachSection } from "./revenue-sections/ByCoachSection";
import { ByBusinessTypeSection } from "./revenue-sections/ByBusinessTypeSection";
import { ByAcquisitionSection } from "./revenue-sections/ByAcquisitionSection";
import { NewVsRenewalSection } from "./revenue-sections/NewVsRenewalSection";
import { RefundImpactSection } from "./revenue-sections/RefundImpactSection";
import styles from "./RevenueAnalyticsPage.module.css";

const SECTIONS = [
  { key: "trend", label: "Revenue Trend" },
  { key: "package", label: "By Package" },
  { key: "coach", label: "By Coach" },
  { key: "businessType", label: "By Business Type" },
  { key: "acquisition", label: "By Acquisition Source" },
  { key: "newVsRenewal", label: "New vs Renewal" },
  { key: "refunds", label: "Refund Impact" },
] as const;

type SectionKey = (typeof SECTIONS)[number]["key"];

export function RevenueAnalyticsPage() {
  const [active, setActive] = useState<SectionKey>("trend");
  const { show } = useToast();

  return (
    <>
      <PageHeader
        title="Revenue Analytics"
        breadcrumb={[{ label: "Finance" }, { label: "Revenue Analytics" }]}
        description="Deep-dive revenue drill-down — trend, package, coach, business type, acquisition source and refund impact — mock data for prototype purposes."
        actions={
          <div className={styles.toolbar}>
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

      <Tabs
        className={styles.tabs}
        tabs={SECTIONS.map((s) => ({ key: s.key, label: s.label }))}
        active={active}
        onChange={(key) => setActive(key as SectionKey)}
      />

      {active === "trend" && <RevenueTrendSection />}
      {active === "package" && <ByPackageSection />}
      {active === "coach" && <ByCoachSection />}
      {active === "businessType" && <ByBusinessTypeSection />}
      {active === "acquisition" && <ByAcquisitionSection />}
      {active === "newVsRenewal" && <NewVsRenewalSection />}
      {active === "refunds" && <RefundImpactSection />}
    </>
  );
}
