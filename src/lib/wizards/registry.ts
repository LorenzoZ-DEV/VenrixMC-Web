import { HELPER_SUPPORTER_WIZARD } from "./helperSupporter";
import { HELPER_SS_WIZARD } from "./helperSS";
import { BUILDER_WIZARD } from "./builder";

export const WIZARD_REGISTRY = {
  "helper-supporter": HELPER_SUPPORTER_WIZARD,
  "helper-ss": HELPER_SS_WIZARD,
  builder: BUILDER_WIZARD,
} as const;

export type WizardId = keyof typeof WIZARD_REGISTRY;
