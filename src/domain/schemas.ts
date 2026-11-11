import { z } from "zod"
import { DEFAULT_LIMITS } from "@/config/limits"
import {
  CategorySchema,
  MoodSchema,
  MotivationSchema,
  OutcomeSchema,
} from "./lists"

export const PenceSchema = z.number().int().brand<"Pence">()

export const DateSchema = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "Date must look like 2026-03-31")
  .refine((value) => {
    const [y = 0, m = 0, d = 0] = value.split("-").map(Number)
    const date = new Date(Date.UTC(y, m - 1, d))
    return (
      date.getUTCFullYear() === y &&
      date.getUTCMonth() === m - 1 &&
      date.getUTCDate() === d
    )
  }, "Not a real date")

// A transaction has either no context or a complete one (D-044).
export const ContextSchema = z.object({
  mood: MoodSchema,
  motivation: MotivationSchema,
  outcome: OutcomeSchema.optional(),
  note: z.string().max(DEFAULT_LIMITS.noteMaxLength).optional(),
})

export const OriginalSchema = z.object({
  date: DateSchema,
  amountPence: PenceSchema,
  description: z.string(),
})

export const SourceTypeSchema = z.enum(["csv", "pdf", "receipt"])

const description = z.string().trim().min(1, "Description is empty")

// Rules that tie the amount to the category: not zero, and Income is never
// negative.
function checkAmount(
  value: { amountPence: number | null; category: string | null },
  ctx: z.RefinementCtx,
) {
  if (value.amountPence === 0) {
    ctx.addIssue({
      code: "custom",
      path: ["amountPence"],
      message: "Amount is zero",
    })
  }
  if (
    value.category === "Income" &&
    value.amountPence !== null &&
    value.amountPence < 0
  ) {
    ctx.addIssue({
      code: "custom",
      path: ["amountPence"],
      message: "Income cannot be negative",
    })
  }
}

export const TransactionSchema = z
  .object({
    id: z.string().min(1),
    visitorId: z.string().min(1),
    date: DateSchema,
    amountPence: PenceSchema,
    description,
    category: CategorySchema,
    categorySource: z.enum(["ai", "user"]),
    merchantName: z.string().min(1).optional(),
    context: ContextSchema.optional(),
    original: OriginalSchema,
    importId: z.string().min(1),
    sourceType: SourceTypeSchema,
    createdAt: z.iso.datetime(),
  })
  .superRefine(checkAmount)

export const RowStateSchema = z.enum([
  "valid",
  "needs-fix",
  "duplicate",
  "dropped",
])

// A row under review may still be broken, so date, amount and category can be
// null here. The reasons are in `problems`.
export const ReviewRowSchema = z.object({
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
  problems: z.array(z.string()),
  duplicateOf: z.string().min(1).optional(),
  include: z.boolean().optional(),
  runningBalance: PenceSchema.optional(),
})

export const ImportSummarySchema = z.object({
  rowCount: z.number().int().nonnegative(),
  dateRange: z.object({ from: DateSchema, to: DateSchema }).nullable(),
  moneyInPence: PenceSchema,
  moneyOutPence: PenceSchema,
  netPence: PenceSchema,
  counts: z.object({
    valid: z.number().int().nonnegative(),
    "needs-fix": z.number().int().nonnegative(),
    duplicate: z.number().int().nonnegative(),
    dropped: z.number().int().nonnegative(),
  }),
})

export const BalanceInputSchema = z.object({
  openingBalancePence: PenceSchema.optional(),
  closingBalancePence: PenceSchema.optional(),
})

export const BalanceCheckSchema = z.discriminatedUnion("status", [
  z.object({ status: z.literal("not-given") }),
  z.object({ status: z.literal("ok") }),
  z.object({
    status: z.literal("mismatch"),
    expectedClosingPence: PenceSchema,
    differencePence: PenceSchema,
  }),
])

export type Context = z.infer<typeof ContextSchema>
export type Transaction = z.infer<typeof TransactionSchema>
export type ReviewRow = z.infer<typeof ReviewRowSchema>
export type RowState = z.infer<typeof RowStateSchema>
export type ImportSummary = z.infer<typeof ImportSummarySchema>
export type BalanceInput = z.infer<typeof BalanceInputSchema>
export type BalanceCheck = z.infer<typeof BalanceCheckSchema>
