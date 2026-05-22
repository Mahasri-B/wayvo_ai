export default function LoadingSkeleton() {
  return (
    <div className="space-y-3">
      {[1, 2, 3].map(i => (
        <div key={i} className="white-card p-4 space-y-3">
          <div className="flex justify-between">
            <div className="shimmer h-4 w-32 rounded-lg" />
            <div className="shimmer h-4 w-16 rounded-lg" />
          </div>
          <div className="flex gap-2">
            <div className="shimmer h-6 w-16 rounded-lg" />
            <div className="shimmer h-6 w-4 rounded" />
            <div className="shimmer h-6 w-20 rounded-lg" />
          </div>
          <div className="flex gap-4">
            <div className="shimmer h-3 w-24 rounded" />
            <div className="shimmer h-3 w-24 rounded" />
          </div>
        </div>
      ))}
    </div>
  );
}
