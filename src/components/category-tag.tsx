import type { PredictionCategory } from "@/lib/prediction";
import { CATEGORY_META } from "@/lib/constants";

export function CategoryTag({ category }: { category: PredictionCategory }) {
  const meta = CATEGORY_META[category];
  return <span className={`tag ${meta.tagClass}`}>{meta.label}</span>;
}
