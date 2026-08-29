import type { FeatureFlag } from "../../types/system";
import { MOCK_FEATURE_FLAGS } from "./featureFlagData";
import { delay } from "../shared/utils";

let store: FeatureFlag[] = [...MOCK_FEATURE_FLAGS];

export async function listFeatureFlags() {
  return delay([...store], 300);
}

export async function toggleFeatureFlag(id: string, enabled: boolean) {
  store = store.map((f) => (f.id === id ? { ...f, enabled } : f));
  return delay(store.find((f) => f.id === id)!, 300);
}
