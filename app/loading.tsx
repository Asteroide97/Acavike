export default function RootLoading() {
  return (
    <div className="section-shell py-24">
      <div className="surface p-8">
        <div className="h-8 w-48 animate-pulse rounded-full bg-slate-200" />
        <div className="mt-6 grid gap-4 md:grid-cols-3">
          {Array.from({ length: 6 }).map((_, index) => (
            <div key={index} className="h-40 animate-pulse rounded-3xl bg-slate-100" />
          ))}
        </div>
      </div>
    </div>
  );
}
