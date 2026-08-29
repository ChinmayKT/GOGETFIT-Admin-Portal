import type { FeatureFlag } from "../../types/system";

export const MOCK_FEATURE_FLAGS: FeatureFlag[] = [
  { id: "flag_new_dashboard", name: "New Dashboard", description: "The redesigned analytics-first dashboard home screen.", environment: "All", enabled: true },
  { id: "flag_visual_stats_v2", name: "Visual Stats V2", description: "Upgraded charting and trend visualizations across reports.", environment: "All", enabled: true },
  { id: "flag_health_data", name: "Health Data", description: "Wearable and health-app data sync for client progress tracking.", environment: "All", enabled: true },
  { id: "flag_macro_calculator", name: "New Macro Calculator", description: "Reworked macro calculator with adjustable activity multipliers.", environment: "Beta users only", enabled: false },
  { id: "flag_coach_assignment_v2", name: "Coach Assignment V2", description: "Smarter auto-matching between clients and coaches by specialization.", environment: "Beta users only", enabled: false },
  { id: "flag_dark_mode_scheduling", name: "Dark Mode Scheduling", description: "Automatically switch theme based on time of day.", environment: "Beta users only", enabled: false },
  { id: "flag_push_composer_v2", name: "Push Notification Composer V2", description: "Rich media and audience-segment targeting in the notification composer.", environment: "Beta users only", enabled: false },
  { id: "flag_media_bulk_upload", name: "Media Library Bulk Upload", description: "Upload and tag multiple media assets in a single batch.", environment: "All", enabled: true },
  { id: "flag_referral_v2", name: "Referral Program V2", description: "Tiered referral rewards with milestone bonuses.", environment: "Beta users only", enabled: false },
];
