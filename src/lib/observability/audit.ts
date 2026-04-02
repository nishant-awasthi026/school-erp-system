import db from '@/lib/db';

/**
 * Fire-and-forget audit logger.
 * Call from every mutation API route. Does NOT block the response.
 */
export function logAudit(params: {
  actorId: string;
  actorRole: string;
  tenantId?: string;
  action: string;        // CREATE | UPDATE | DELETE | SUSPEND | LOGIN | LOGOUT
  entity: string;        // e.g. 'Student', 'School', 'Payment'
  entityId?: string;
  before?: Record<string, unknown> | null;
  after?: Record<string, unknown> | null;
  ip?: string;
}) {
  // Non-blocking — do not await
  db.activityLog
    .create({
      data: {
        action: `${params.action}:${params.entity}${params.entityId ? `:${params.entityId}` : ''}`,
        performedBy: params.actorId,
        targetId: params.entityId,
        targetType: params.entity,
        metadata: JSON.stringify({
          actorRole: params.actorRole,
          before: params.before,
          after: params.after,
          ip: params.ip,
        }),
        schoolId: params.tenantId || '',
      },
    })
    .catch((err) => {
      // Audit log failure must never break the main request
      console.error('[audit] Failed to write audit log:', err);
    });
}
