import { Card, CardContent, CardHeader, CardTitle, H2, MutedText } from '@dealos/ui';
import { getMetrics } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function DashboardPage() {
  const data = await getMetrics();
  const metrics = [
    { label: 'Active deals', value: data.activeDeals },
    { label: 'Expired coupons', value: data.expiredCoupons },
    { label: 'Recorded clicks', value: data.clicks },
    { label: 'Products', value: data.products },
  ];
  return (
    <div className="space-y-6">
      <H2>Operations Dashboard</H2>
      <MutedText>
        Current database totals. Clicks include all recorded requests; they are not unique visitors.
      </MutedText>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle>{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value.toLocaleString()}</p>
            </CardContent>
          </Card>
        ))}
      </section>
      <MutedText>
        CTR unavailable: impression tracking is not configured. Review moderation counts are
        unavailable.
      </MutedText>
    </div>
  );
}
