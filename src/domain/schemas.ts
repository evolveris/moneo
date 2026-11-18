import { z } from "zod";
import { DEFAULT_LIMITS } from "@/config/limits";
import { rowProblemList } from "./derived";
import {
  CategorySchema,
  MoodSchema,
  MotivationSchema,
  OutcomeSchema,
} from "./lists";

export const PenceSchema = z.number().int().brand<"Pence">();

export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must look like 2026-03-31")
  .refine((value) => {
    const [y = 0, m = 0, d = 0] = value.split("-").map(Number);
    const date = new Date(Date.UTC(y, m - 1, d));
    return (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    );
  }, "Not a real date");

// A transaction has either no context or a complete one (D-044).
export const ContextSchema = z.object({
  mood: MoodSchema,
  motivation: MotivationSchema,
  outcome: OutcomeSchema.optional(),
  note: z.string().max(DEFAULT_LIMITS.noteMaxLength).optional(),
});

export const OriginalSchema = z.object({
  date: DateSchema,
  amountPence: PenceSchema,
  description: z.string(),
});

export const SourceTypeSchema = z.enum(["csv", "pdf", "receipt"]);

const transactionDescription = z.string().trim().min(1, "Description is empty");

// Income is money coming in, so it is never negative. A zero amount is allowed:
// empty rows do come from bank CSV files and they change nothing.
function rejectNegativeIncome(
  value: { amountPence: number | null; category: string | null },
  ctx: z.RefinementCtx,
) {
  if (
    value.category === "Income" &&
    value.amountPence !== null &&
    value.amountPence < 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["amountPence"],
      message: "Income cannot be negative",
    });
  }
}

export const TransactionSchema = z
  .object({
    id: z.string().min(1),
    visitorId: z.string().min(1),
    date: DateSchema,
    amountPence: PenceSchema,
    description: transactionDescription,
    category: CategorySchema,
    categorySource: z.enum(["ai", "user"]),
    merchantName: z.string().min(1).optional(),
    context: ContextSchema.optional(),
    original: OriginalSchema,
    // The balance printed on the bank row, when the file has one. Used with the
    // original values to match duplicates (D-035).
    runningBalancePence: PenceSchema.optional(),
    importId: z.string().min(1),
    sourceType: SourceTypeSchema,
    createdAt: z.iso.datetime(),
  })
  .superRefine(rejectNegativeIncome);

export const RowStateSchema = z.enum([
  "valid",
  "needs-fix",
  "duplicate",
  "dropped",
]);

// Why a review row cannot be saved yet. The screen turns each code into text.
export const ProblemSchema = z.enum([
  "invalid-date",
  "invalid-amount",
  "empty-description",
  "no-category",
  "negative-income",
  "not-gbp",
]);

// A row under review may still be broken, so date, amount and category can be
// null here. A row in the `valid` state must have none of those gaps; the
// reasons for a broken row are in `problems`.
export const ReviewRowSchema = z
  .object({
    date: DateSchema.nullable(),
    amountPence: PenceSchema.nullable(),
    description: z.string(),
    category: CategorySchema.nullable(),
    categorySource: z.enum(["ai", "user"]).optional(),
    merchantName: z.string().min(1).optional(),
    context: ContextSchema.optional(),
    original: OriginalSchema.optional(),
    sourceType: SourceTypeSchema,
    rowState: RowStateSchema,
    problems: z.array(ProblemSchema),
    // The stored transaction this row looks like, when rowState is "duplicate".
    duplicateOf: z.string().min(1).optional(),
    // For a duplicate row: true when the user chose to save it anyway.
    includeDuplicate: z.boolean().optional(),
    runningBalance: PenceSchema.optional(),
  })
  .superRefine((row, ctx) => {
    if (row.rowState === "valid" && rowProblemList(row).length > 0) {
      ctx.addIssue({
        code: "custom",
        path: ["rowState"],
        message: "A row with problems cannot be valid",
      });
    }
  });

export const ImportSummarySchema = z.object({
  rowCount: z.number().int().nonnegative(),
  dateRange: z.object({ from: DateSchema, to: DateSchema }).nullable(),
  moneyInPence: PenceSchema,
  moneyOutPence: PenceSchema,
  netPence: PenceSchema,
  // How many rows are in each state, counting every row in the import.
  rowCountByState: z.object({
    valid: z.number().int().nonnegative(),
    "needs-fix": z.number().int().nonnegative(),
    duplicate: z.number().int().nonnegative(),
    dropped: z.number().int().nonnegative(),
  }),
});

export const BalanceInputSchema = z.object({
  openingBalancePence: PenceSchema.optional(),
  closingBalancePence: PenceSchema.optional(),
});

export const BalanceCheckSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not-given") }),
  z.object({ status: z.literal("ok") }),
  z.object({
    status: z.literal("mismatch"),
    expectedClosingPence: PenceSchema,
    differencePence: PenceSchema,
  }),
]);

export type Context = z.infer<typeof ContextSchema>;
export type Transaction = z.infer<typeof TransactionSchema>;
export type ReviewRow = z.infer<typeof ReviewRowSchema>;
export type Problem = z.infer<typeof ProblemSchema>;
export type RowState = z.infer<typeof RowStateSchema>;
export type ImportSummary = z.infer<typeof ImportSummarySchema>;
export type BalanceInput = z.infer<typeof BalanceInputSchema>;
export type BalanceCheck = z.infer<typeof BalanceCheckSchema>;
