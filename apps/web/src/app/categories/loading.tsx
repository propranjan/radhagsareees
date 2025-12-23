export default function CategoriesLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white shadow-sm h-16 animate-pulse" />
      
      {/* Hero skeleton */}
      <div className="bg-gradient-to-r from-primary-100 to-primary-50 py-16">
        <div className="container mx-auto px-4 text-center">
          <div className="h-10 w-64 bg-white/50 rounded mx-auto mb-4 animate-pulse" />
          <div className="h-4 w-96 max-w-full bg-white/30 rounded mx-auto animate-pulse" />
        </div>
      </div>
      
      {/* Categories grid skeleton */}
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {[1, 2, 3, 4, 5, 6].map(i => (
            <div key={i} className="bg-white rounded-xl shadow-sm overflow-hidden">
              <div className="aspect-[4/3] bg-gray-200 animate-pulse" />
              <div className="p-6 space-y-3">
                <div className="h-6 w-32 bg-gray-200 rounded animate-pulse" />
                <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
                <div className="h-4 w-2/3 bg-gray-100 rounded animate-pulse" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
