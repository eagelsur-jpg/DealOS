import { getMetrics } from '@/lib/data';
export const dynamic = 'force-dynamic';
export default async function AnalyticsPage() {
  const data = await getMetrics();
  return (
    <section className="space-y-4">
      <h1 className="text-2xl font-semibold">Affiliate analytics</h1>
      <p>
        {data.clicks.toLocaleString()} recorded clicks across {data.merchants} merchants.
      </p>
      <p>
        Known seed and verification clicks are excluded ({data.excludedSampleClicks} preserved records).
        Other automated and repeated requests may remain. CTR and conversion rate are unavailable.
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Deal</th>
              <th>Merchant</th>
              <th>Clicks</th>
            </tr>
          </thead>
          <tbody>
            {data.topDeals.map((d) => (
              <tr key={d.id}>
                <td className="py-3">{d.title}</td>
                <td>{d.merchant.name}</td>
                <td>{d._count.clicks}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!data.topDeals.length && <p>No non-sample deal clicks recorded.</p>}
    </section>
  );
}
