// New-People Alerts (Epic 3, Feature 3.4) — SERVER ONLY.
//
// Karen saves a search (a profile type or a place she wants more of) and sees when matching
// people arrive. Pull-based in the MVP: the "new since you last looked" count is computed
// on demand against the live pool — no background job or push delivery yet (that's the
// upside layer). The saved criteria reuse the exact People-Search matcher, so an alert and
// a manual search always agree.

import { countNewCandidates } from './search';
import { isDbConfigured, demoAlerts } from './demo';
import { type PrismaClient } from '../generated/prisma/client';

export interface AlertView {
  id: string;
  label: string;
  keyword: string | null;
  place: string | null;
  newCount: number; // matching candidates since lastViewedAt (or creation)
}

export async function createAlert(
  prisma: PrismaClient,
  input: { organizationId: string; label: string; keyword?: string | null; place?: string | null },
) {
  return prisma.alert.create({
    data: {
      organizationId: input.organizationId,
      label: input.label,
      keyword: input.keyword?.trim() || null,
      place: input.place?.trim() || null,
    },
  });
}

export async function deleteAlert(prisma: PrismaClient, id: string, organizationId: string) {
  await prisma.alert.deleteMany({ where: { id, organizationId } });
}

/** Saved alerts with a live "new since last looked" count for each. */
export async function listAlerts(
  prisma: PrismaClient,
  organizationId: string,
): Promise<AlertView[]> {
  if (!isDbConfigured()) return demoAlerts();

  const alerts = await prisma.alert.findMany({
    where: { organizationId },
    orderBy: { createdAt: 'desc' },
  });

  return Promise.all(
    alerts.map(async (a) => ({
      id: a.id,
      label: a.label,
      keyword: a.keyword,
      place: a.place,
      newCount: await countNewCandidates(prisma, {
        query: a.keyword,
        place: a.place,
        since: a.lastViewedAt ?? a.createdAt,
      }),
    })),
  );
}

/** Reset an alert's "new" baseline — called when Karen opens it. */
export async function markAlertViewed(prisma: PrismaClient, id: string, organizationId: string) {
  await prisma.alert.updateMany({
    where: { id, organizationId },
    data: { lastViewedAt: new Date() },
  });
}
