import { PageHeader } from "./PageHeader";
import { GlassCard } from "../ui/GlassCard";
import { EmptyState } from "../feedback/EmptyState";
import { Construction } from "lucide-react";

/** Scaffolding-only marker for modules not yet built in this phase — never a shipped final screen. */
export function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <PageHeader title={title} breadcrumb={[{ label: "GoGetFit Admin" }, { label: title }]} />
      <GlassCard>
        <EmptyState icon={<Construction size={22} />} title={`${title} — under construction`} description="This module is scheduled in a later build phase." />
      </GlassCard>
    </>
  );
}
