// Every limit in one place (SPEC D-008). Per-visitor overrides are applied by
// getLimits in src/domain/limits.ts.
export const DEFAULT_LIMITS = {
  noteMaxLength: 200,
  undoWindowMs: 10_000,
  maxFileSizeBytes: 5 * 1024 * 1024,
  maxPdfPages: 10,
  maxRows: 5_000,
  aiUploadsPerHour: 5,
}

export type Limits = typeof DEFAULT_LIMITS
