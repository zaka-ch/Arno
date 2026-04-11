import type { SplitType } from "@/types";

export const SPLIT_LABELS: Record<SplitType, string> = {
  ppl: "Push / Pull / Legs",
  arnold: "Arnold Split",
  upper_lower: "Upper / Lower",
  bro: "Bro Split",
};

export const SPLIT_KEYS: SplitType[] = [
  "ppl",
  "arnold",
  "upper_lower",
  "bro",
];
