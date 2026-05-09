export default function EventCardSkeleton() {
  return (
    <div className="rounded-2xl overflow-hidden border border-gray-200 bg-white h-full flex flex-col">
      <div className="aspect-[4/3] bg-gray-200 animate-pulse shrink-0" />
      <div className="p-4 flex flex-col flex-1">
        <div className="h-3 w-24 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-5 w-full bg-gray-200 rounded animate-pulse mb-2" />
        <div className="h-5 w-2/3 bg-gray-200 rounded animate-pulse mb-3" />
        <div className="h-4 w-3/4 bg-gray-200 rounded animate-pulse mt-2" />
        <div className="mt-auto pt-3 border-t border-gray-100 flex items-center justify-between">
          <div className="h-3 w-20 bg-gray-200 rounded animate-pulse" />
          <div className="h-3 w-16 bg-gray-200 rounded animate-pulse" />
        </div>
      </div>
    </div>
  )
}
