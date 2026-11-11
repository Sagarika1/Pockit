import { z } from "zod";

export const CATEGORIES = [
  "meals",
  "rideshare",
  "registration",
  "hotel",
  "flight",
  "other",
] as const;

export const ReceiptSchema = z.object({
  vendor: z.string(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).nullable(),
  total: z.number().nonnegative(),
  currency: z.string().length(3),
  category: z.enum(CATEGORIES),
  contains_alcohol: z.boolean(),
  line_items: z.array(
    z.object({
      description: z.string(),
      amount: z.number(),
    })
  ),
  needs_review: z.boolean(),
  review_reason: z.string().nullable(),
});

export type ParsedReceipt = z.infer<typeof ReceiptSchema>;