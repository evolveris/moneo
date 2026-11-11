import { z } from "zod"

// Fixed lists from the SPEC (D-042). No custom values in v1.
export const CATEGORIES = [
  "Groceries",
  "Eating out",
  "Transport",
  "Housing",
  "Bills and utilities",
  "Subscriptions",
  "Shopping",
  "Health and fitness",
  "Other",
  "Income",
  "Transfers",
] as const

export const MOODS = [
  "happy",
  "stressed",
  "bored",
  "sad",
  "anxious",
  "excited",
  "calm",
  "tired",
] as const

export const MOTIVATIONS = [
  "need",
  "planned",
  "habit",
  "impulse",
  "treat",
  "social pressure",
  "deal or sale",
  "social media",
  "unwell",
] as const

export const OUTCOMES = [
  "glad I bought it",
  "regret it",
  "used it",
  "unused",
  "returned",
  "sold",
] as const

export const CategorySchema = z.enum(CATEGORIES)
export const MoodSchema = z.enum(MOODS)
export const MotivationSchema = z.enum(MOTIVATIONS)
export const OutcomeSchema = z.enum(OUTCOMES)

export type Category = z.infer<typeof CategorySchema>
export type Mood = z.infer<typeof MoodSchema>
export type Motivation = z.infer<typeof MotivationSchema>
export type Outcome = z.infer<typeof OutcomeSchema>
