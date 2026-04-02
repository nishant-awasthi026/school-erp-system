import { z, ZodSchema } from 'zod';
import { ApiError } from '@/lib/utils/errors';

/**
 * Parse and validate input with Zod. Throws ApiError (422) on validation failure.
 * Use in every API route before touching the database.
 */
export function validate<T>(schema: ZodSchema<T>, data: unknown): T {
  const result = schema.safeParse(data);
  if (!result.success) {
    const details = result.error.flatten().fieldErrors;
    const detailsArray = Object.entries(details).map(([field, msgs]) => ({
      field,
      message: (msgs as string[])?.[0] ?? 'Invalid value',
    }));
    throw new ApiError(422, 'Validation failed', 'VALIDATION_ERROR', detailsArray);
  }
  return result.data;
}

/** Common reusable field schemas */
export const CommonSchemas = {
  id: z.string().uuid('Invalid ID format'),
  intId: z.number().int().positive(),
  phone: z
    .string()
    .regex(/^[6-9]\d{9}$/, 'Invalid Indian mobile number (must start with 6-9 and be 10 digits)')
    .optional(),
  aadhaar: z
    .string()
    .regex(/^\d{12}$/, 'Aadhaar must be exactly 12 digits')
    .optional(),
  email: z.string().email('Invalid email address'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  date: z.string().refine((d) => !isNaN(Date.parse(d)), { message: 'Invalid date format' }),
  pagination: z.object({
    page: z.coerce.number().int().positive().default(1),
    limit: z.coerce.number().int().min(1).max(100).default(20),
  }),
};
