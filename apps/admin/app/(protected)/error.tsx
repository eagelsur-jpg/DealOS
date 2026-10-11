'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <div role="alert">
      <p>Unable to load data. Check database availability.</p>
      <button onClick={reset}>Try again</button>
    </div>
  );
}
