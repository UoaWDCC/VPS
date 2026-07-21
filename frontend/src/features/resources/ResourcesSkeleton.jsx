export default function SkeletonBody() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 h-full">
      <div className="space-y-2">
        <div className="skeleton h-5 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
        <div className="skeleton h-4 w-3/5" />
        <div className="skeleton h-4 w-1/2" />
        <div className="skeleton h-4 w-2/3" />
      </div>
      <div className="space-y-2 col-span-2">
        <div className="skeleton h-6 w-3/4" />
        <div className="skeleton h-48 w-full" />
        <div className="skeleton h-4 w-1/3" />
      </div>
    </div>
  );
}
