import { Card, CardContent, CardHeader, CardTitle, H2, MutedText } from '@dealos/ui';

const metrics = [
  { label: 'Active Deals', value: '1,284' },
  { label: 'Expired Coupons', value: '92' },
  { label: 'Pending Reviews', value: '37' },
  { label: 'Affiliate CTR', value: '6.4%' }
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <header>
        <H2>Operations Dashboard</H2>
        <MutedText>Monitor deal quality, content freshness, and affiliate performance.</MutedText>
      </header>
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        {metrics.map((metric) => (
          <Card key={metric.label}>
            <CardHeader>
              <CardTitle className="text-base">{metric.label}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-semibold">{metric.value}</p>
            </CardContent>
          </Card>
        ))}
      </section>
    </div>
  );
}
