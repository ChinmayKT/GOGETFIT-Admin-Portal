import { useState, type ReactNode } from "react";
import { PageHeader } from "../../components/layout/PageHeader";
import { GlassCard } from "../../components/ui/GlassCard";
import { Tabs } from "../../components/ui/Tabs";
import { Button } from "../../components/ui/Button";
import { Field } from "../../components/forms/Field";
import { Input } from "../../components/forms/Input";
import { Select } from "../../components/forms/Select";
import { useToast } from "../../components/feedback/ToastProvider";
import logoDark from "../../assets/brand/gogetfit-logo-dark.jpeg";

const SECTIONS = [
  { key: "general", label: "General" },
  { key: "brand", label: "Brand" },
  { key: "notifications", label: "Notifications" },
  { key: "calculator", label: "Calculator Rules" },
  { key: "plan", label: "Plan Rules" },
  { key: "challenge", label: "Challenge Rules" },
  { key: "reward", label: "Reward Rules" },
];

const TIMEZONES = ["Asia/Kolkata", "Asia/Dubai", "Europe/London", "America/New_York", "UTC"];
const BMR_FORMULAS = ["Mifflin-St Jeor", "Harris-Benedict", "Katch-McArdle"];
const ACTIVITY_MULTIPLIERS = [
  { label: "Sedentary (1.2)", value: "1.2" },
  { label: "Lightly active (1.375)", value: "1.375" },
  { label: "Moderately active (1.55)", value: "1.55" },
  { label: "Very active (1.725)", value: "1.725" },
  { label: "Extremely active (1.9)", value: "1.9" },
];

interface SectionProps {
  title: string;
  description: string;
  onSave: () => void;
  saving: boolean;
  children: ReactNode;
}

function SettingsSection({ title, description, onSave, saving, children }: SectionProps) {
  return (
    <GlassCard>
      <div style={{ marginBottom: 20 }}>
        <p className="text-title">{title}</p>
        <p className="text-caption">{description}</p>
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: 16, marginBottom: 24 }}>
        {children}
      </div>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <Button variant="primary" loading={saving} onClick={onSave}>
          Save Changes
        </Button>
      </div>
    </GlassCard>
  );
}

export function SettingsPage() {
  const { show } = useToast();
  const [active, setActive] = useState("general");
  const [savingKey, setSavingKey] = useState<string | null>(null);

  const [general, setGeneral] = useState({ appName: "GoGetFit", supportEmail: "support@gogetfit.in", timezone: "Asia/Kolkata" });
  const [notifications, setNotifications] = useState({ defaultSender: "GoGetFit Team", quietStart: "22:00", quietEnd: "07:00" });
  const [calculator, setCalculator] = useState({ formula: "Mifflin-St Jeor", multiplier: "1.55" });
  const [plan, setPlan] = useState({ defaultDuration: "90", graceDays: "7" });
  const [challenge, setChallenge] = useState({ minParticipants: "5", maxParticipants: "1000", submissionWindow: "48" });
  const [reward, setReward] = useState({ pointsPerWorkout: "10", pointsPerReferral: "150" });

  function handleSave(key: string, label: string) {
    setSavingKey(key);
    setTimeout(() => {
      setSavingKey(null);
      show(`${label} settings saved`);
    }, 500);
  }

  return (
    <>
      <PageHeader
        title="Settings"
        breadcrumb={[{ label: "System" }, { label: "Settings" }]}
        description="Portal-wide configuration for branding, notifications and business rules."
      />

      <Tabs tabs={SECTIONS} active={active} onChange={setActive} />

      <div style={{ marginTop: 20 }}>
        {active === "general" && (
          <SettingsSection
            title="General"
            description="Core identity and locale for the admin portal."
            saving={savingKey === "general"}
            onSave={() => handleSave("general", "General")}
          >
            <Field label="App Name" required>
              <Input value={general.appName} onChange={(e) => setGeneral((s) => ({ ...s, appName: e.target.value }))} />
            </Field>
            <Field label="Support Email" required>
              <Input
                type="email"
                value={general.supportEmail}
                onChange={(e) => setGeneral((s) => ({ ...s, supportEmail: e.target.value }))}
              />
            </Field>
            <Field label="Timezone">
              <Select
                value={general.timezone}
                onChange={(e) => setGeneral((s) => ({ ...s, timezone: e.target.value }))}
                options={TIMEZONES.map((tz) => ({ label: tz, value: tz }))}
              />
            </Field>
          </SettingsSection>
        )}

        {active === "brand" && (
          <GlassCard>
            <div style={{ marginBottom: 20 }}>
              <p className="text-title">Brand</p>
              <p className="text-caption">The GoGetFit brand identity. Managed centrally — not editable here.</p>
            </div>
            <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span className="text-caption">Primary Color</span>
                <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                  <div
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: "var(--radius-md)",
                      background: "var(--ggf-orange)",
                      border: "1px solid var(--glass-border)",
                    }}
                  />
                  <div>
                    <div style={{ fontWeight: 600, color: "var(--text-primary)" }}>GoGetFit Orange</div>
                    <div className="text-caption">var(--ggf-orange)</div>
                  </div>
                </div>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
                <span className="text-caption">Logo</span>
                <div
                  style={{
                    padding: 16,
                    borderRadius: "var(--radius-md)",
                    background: "var(--glass-fill)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  <img src={logoDark} alt="GoGetFit logo" style={{ height: 48, display: "block" }} />
                </div>
              </div>
            </div>
          </GlassCard>
        )}

        {active === "notifications" && (
          <SettingsSection
            title="Notifications"
            description="Defaults applied to every outbound notification."
            saving={savingKey === "notifications"}
            onSave={() => handleSave("notifications", "Notifications")}
          >
            <Field label="Default Sender Name">
              <Input
                value={notifications.defaultSender}
                onChange={(e) => setNotifications((s) => ({ ...s, defaultSender: e.target.value }))}
              />
            </Field>
            <Field label="Quiet Hours Start" helperText="No push notifications sent after this time">
              <Input
                type="time"
                value={notifications.quietStart}
                onChange={(e) => setNotifications((s) => ({ ...s, quietStart: e.target.value }))}
              />
            </Field>
            <Field label="Quiet Hours End">
              <Input
                type="time"
                value={notifications.quietEnd}
                onChange={(e) => setNotifications((s) => ({ ...s, quietEnd: e.target.value }))}
              />
            </Field>
          </SettingsSection>
        )}

        {active === "calculator" && (
          <SettingsSection
            title="Calculator Rules"
            description="Formula and defaults used by the BMR / TDEE calculator."
            saving={savingKey === "calculator"}
            onSave={() => handleSave("calculator", "Calculator Rules")}
          >
            <Field label="BMR Formula">
              <Select
                value={calculator.formula}
                onChange={(e) => setCalculator((s) => ({ ...s, formula: e.target.value }))}
                options={BMR_FORMULAS.map((f) => ({ label: f, value: f }))}
              />
            </Field>
            <Field label="Default Activity Multiplier">
              <Select
                value={calculator.multiplier}
                onChange={(e) => setCalculator((s) => ({ ...s, multiplier: e.target.value }))}
                options={ACTIVITY_MULTIPLIERS}
              />
            </Field>
          </SettingsSection>
        )}

        {active === "plan" && (
          <SettingsSection
            title="Plan Rules"
            description="Defaults applied to every new subscription plan."
            saving={savingKey === "plan"}
            onSave={() => handleSave("plan", "Plan Rules")}
          >
            <Field label="Default Duration (days)">
              <Input
                type="number"
                min={1}
                value={plan.defaultDuration}
                onChange={(e) => setPlan((s) => ({ ...s, defaultDuration: e.target.value }))}
              />
            </Field>
            <Field label="Renewal Grace Period (days)" helperText="Days after expiry before access is revoked">
              <Input
                type="number"
                min={0}
                value={plan.graceDays}
                onChange={(e) => setPlan((s) => ({ ...s, graceDays: e.target.value }))}
              />
            </Field>
          </SettingsSection>
        )}

        {active === "challenge" && (
          <SettingsSection
            title="Challenge Rules"
            description="Guardrails applied when a new challenge is created."
            saving={savingKey === "challenge"}
            onSave={() => handleSave("challenge", "Challenge Rules")}
          >
            <Field label="Minimum Participants">
              <Input
                type="number"
                min={1}
                value={challenge.minParticipants}
                onChange={(e) => setChallenge((s) => ({ ...s, minParticipants: e.target.value }))}
              />
            </Field>
            <Field label="Maximum Participants">
              <Input
                type="number"
                min={1}
                value={challenge.maxParticipants}
                onChange={(e) => setChallenge((s) => ({ ...s, maxParticipants: e.target.value }))}
              />
            </Field>
            <Field label="Submission Window (hours)" helperText="Time allowed to submit proof after a challenge ends">
              <Input
                type="number"
                min={1}
                value={challenge.submissionWindow}
                onChange={(e) => setChallenge((s) => ({ ...s, submissionWindow: e.target.value }))}
              />
            </Field>
          </SettingsSection>
        )}

        {active === "reward" && (
          <SettingsSection
            title="Reward Rules"
            description="Point values awarded across the rewards program."
            saving={savingKey === "reward"}
            onSave={() => handleSave("reward", "Reward Rules")}
          >
            <Field label="Points per Workout">
              <Input
                type="number"
                min={0}
                value={reward.pointsPerWorkout}
                onChange={(e) => setReward((s) => ({ ...s, pointsPerWorkout: e.target.value }))}
              />
            </Field>
            <Field label="Points per Referral">
              <Input
                type="number"
                min={0}
                value={reward.pointsPerReferral}
                onChange={(e) => setReward((s) => ({ ...s, pointsPerReferral: e.target.value }))}
              />
            </Field>
          </SettingsSection>
        )}
      </div>
    </>
  );
}
