import type { ComponentType } from "react";
import type { IconProps } from "@/components/icons";

export type WizardFieldType = "text" | "textarea" | "number" | "select";

export type WizardField = {
  id: string;
  label: string;
  type: WizardFieldType;
  required?: boolean;
  minLength?: number;
  options?: string[];
};

export type WizardSection = {
  icon: ComponentType<IconProps>;
  title: string;
  fields: WizardField[];
};

/**
 * A full per-position application flow. `mapping` says which section-field
 * ids feed the StaffApply columns that already exist in the DB
 * (minecraftName/discord/age/experience/message) — everything (including
 * those same answers) is also stored verbatim in the `answers` JSON column
 * for the staff review UI.
 */
export type WizardConfig = {
  id: string;
  roleTitle: string;
  intro: {
    icon: ComponentType<IconProps>;
    title: string;
    body: string;
  };
  sections: WizardSection[];
  mapping: {
    minecraftName: string;
    discord: string;
    age: string;
    experience: string;
    message: string;
  };
};

export function wizardTotalSteps(config: WizardConfig): number {
  return config.sections.length + 1;
}
