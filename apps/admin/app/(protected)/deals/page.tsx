import { prisma } from '@dealos/database';
import { saveRecord } from '@/lib/actions';
import Link from 'next/link';
export const dynamic = 'force-dynamic';
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ edit?: string; error?: string; saved?: string; page?: string }>;
}) {
  const query = await searchParams;
  const page = Math.max(1, Math.min(100000, Number(query.page) || 1));
  const [records, record, total] = await Promise.all([
    prisma.deal.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * 25, take: 25 }),
    query.edit ? prisma.deal.findUnique({ where: { id: query.edit } }) : null,
    prisma.deal.count(),
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Deals</h1>
      {query.error && (
        <p role="alert">
          Save failed. Check required fields, unique slug, related IDs and API availability.
        </p>
      )}
      {query.saved && <p role="status">Saved successfully.</p>}
      <div className="overflow-x-auto">
        <table className="w-full text-left">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {records.map((item) => (
              <tr key={item.id}>
                <td className="py-3">
                  {item.title}
                  <small className="block">{item.id}</small>
                </td>
                <td>{item.status}</td>
                <td>
                  <Link href={`/deals?edit=${item.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!records.length && <p>No records found.</p>}
      <nav className="flex gap-4">
        {page > 1 && <Link href={`/deals?page=${page - 1}`}>Previous</Link>}
        <span>
          Page {page} / {Math.max(1, Math.ceil(total / 25))}
        </span>
        {page * 25 < total && <Link href={`/deals?page=${page + 1}`}>Next</Link>}
      </nav>
      <h2 className="text-xl font-semibold">{record ? 'Edit record' : 'Create record'}</h2>
      <p>
        To remove a record from public listings, set its status to HIDDEN. Records are preserved.
      </p>
      <form action={saveRecord} className="grid max-w-xl gap-3" key={record?.id ?? 'new'}>
        <input type="hidden" name="entity" value="deals" />
        <input type="hidden" name="id" value={record?.id ?? ''} />
        <label className="grid gap-1">
          Title
          <input
            className="rounded border p-2"
            name="title"
            defaultValue={record?.title ?? ''}
            required
          />
        </label>
        <label className="grid gap-1">
          Slug
          <input
            className="rounded border p-2"
            name="slug"
            defaultValue={record?.slug ?? ''}
            required
          />
        </label>
        <label className="grid gap-1">
          Product ID
          <input
            className="rounded border p-2"
            name="productId"
            defaultValue={record?.productId ?? ''}
            required
          />
        </label>
        <label className="grid gap-1">
          Merchant ID
          <input
            className="rounded border p-2"
            name="merchantId"
            defaultValue={record?.merchantId ?? ''}
            required
          />
        </label>
        <label className="grid gap-1">
          Price
          <input
            className="rounded border p-2"
            name="currentPrice"
            defaultValue={record?.currentPrice?.toString() ?? ''}
            required
            type="number"
            min="0.01"
            step="0.01"
          />
        </label>
        <label className="grid gap-1">
          Currency
          <input
            className="rounded border p-2"
            name="currency"
            defaultValue={record?.currency ?? 'USD'}
            required
          />
        </label>
        <label>
          Status
          <select
            name="status"
            defaultValue={record?.status ?? 'DRAFT'}
            className="ml-2 rounded border p-2"
          >
            {['DRAFT', 'ACTIVE', 'EXPIRED', 'HIDDEN'].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </label>
        <button className="rounded bg-primary p-3 text-primary-foreground" type="submit">
          Save
        </button>
      </form>
    </section>
  );
}
