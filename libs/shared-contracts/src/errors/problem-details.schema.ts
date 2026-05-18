import { z } from 'zod';

export const apiValidationFieldErrorSchema = z.object({
  field: z.string(),
  message: z.string(),
  code: z.string().optional(),
});

export const problemDetailsBodySchema = z.object({
  type: z.string().url(),
  title: z.string().min(1),
  status: z.number().int().min(400).max(599),
  detail: z.string().min(1),
  instance: z.string().optional(),
  code: z.string().min(1),
  details: z.array(apiValidationFieldErrorSchema).optional(),
});

export type ProblemDetailsBodySchema = z.infer<typeof problemDetailsBodySchema>;
