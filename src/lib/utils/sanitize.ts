import { z } from 'zod';

/**
 * Validates and sanitizes a JSON string representing transport stops.
 * Expected format: [{ name: string, time: string, feeAmount?: number }]
 */
export function sanitizeStopsJSON(stopsStr: string | null | undefined): string | null {
    if (!stopsStr) return null;

    try {
        const parsed = JSON.parse(stopsStr);
        
        const stopSchema = z.array(z.object({
            name: z.string().trim().max(100),
            time: z.string().trim().max(10), // e.g. "08:30 AM"
            feeAmount: z.number().nonnegative().optional().nullable(),
        }));

        const validated = stopSchema.parse(parsed);
        return JSON.stringify(validated);
    } catch {
        return null;
    }
}

/**
 * Validates and sanitizes a JSON string representing attachments/URLs.
 * Expected format: string[]
 */
export function sanitizeAttachmentsJSON(attachmentsStr: string | null | undefined): string | null {
    if (!attachmentsStr) return null;

    try {
        const parsed = JSON.parse(attachmentsStr);
        
        // Ensure URLs are valid and don't contain javascript: payloads
        const urlSchema = z.array(
            z.string().url().refine(val => val.startsWith('http://') || val.startsWith('https://'), {
                message: "Only http and https protocols are allowed",
            })
        );

        const validated = urlSchema.parse(parsed);
        return JSON.stringify(validated);
    } catch {
        return null;
    }
}
