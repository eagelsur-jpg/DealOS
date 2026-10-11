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
    prisma.product.findMany({ orderBy: { createdAt: 'desc' }, skip: (page - 1) * 25, take: 25 }),
    query.edit ? prisma.product.findUnique({ where: { id: query.edit } }) : null,
    prisma.product.count(),
  ]);
  return (
    <section className="space-y-6">
      <h1 className="text-2xl font-semibold">Products</h1>
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
                  {item.name}
                  <small className="block">{item.id}</small>
                </td>
                <td>{item.isActive ? 'Active' : 'Inactive'}</td>
                <td>
                  <Link href={`/products?edit=${item.id}`}>Edit</Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {!records.length && <p>No records found.</p>}
      <nav className="flex gap-4">
        {page > 1 && <Link href={`/products?page=${page - 1}`}>Previous</Link>}
        <span>
          Page {page} / {Math.max(1, Math.ceil(total / 25))}
        </span>
        {page * 25 < total && <Link href={`/products?page=${page + 1}`}>Next</Link>}
      </nav>
      <h2 className="text-xl font-semibold">{record ? 'Edit record' : 'Create record'}</h2>
      <p>To remove a record from public listings, disable Active. Records are preserved.</p>
      <form action={saveRecord} className="grid max-w-xl gap-3" key={record?.id ?? 'new'}>
        <input type="hidden" name="entity" value="products" />
        <input type="hidden" name="id" value={record?.id ?? ''} />
        <label className="grid gap-1">
          Name
          <input
            className="rounded border p-2"
            name="name"
            defaultValue={record?.name ?? ''}
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
          Description
          <input
            className="rounded border p-2"
            name="description"
            defaultValue={record?.description ?? ''}
          />
        </label>
        <label className="grid gap-1">
          Image URL
          <input
            className="rounded border p-2"
            name="imageUrl"
            defaultValue={record?.imageUrl ?? ''}
          />
        </label>
        <label className="grid gap-1">
          Category ID
          <input
            className="rounded border p-2"
            name="categoryId"
            defaultValue={record?.categoryId ?? ''}
          />
        </label>
        <label>
          <input type="checkbox" name="isActive" defaultChecked={record?.isActive ?? true} /> Active
        </label>
        <button className="rounded bg-primary p-3 text-primary-foreground" type="submit">
          Save
        </button>
      </form>
    </section>
  );
}
