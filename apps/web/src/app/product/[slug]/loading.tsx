export default function ProductLoading() {
  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header skeleton */}
      <div className="bg-white shadow-sm h-16 animate-pulse" />
      
      <div className="container mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-2 gap-12">
          {/* Image gallery skeleton */}
          <div className="space-y-4">
            <div className="aspect-square bg-gray-200 rounded-lg animate-pulse" />
            <div className="flex gap-2">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="w-20 h-20 bg-gray-200 rounded animate-pulse" />
              ))}
            </div>
          </div>
          
          {/* Product details skeleton */}
          <div className="space-y-6">
            <div className="h-4 w-48 bg-gray-100 rounded animate-pulse" />
            <div className="h-8 w-3/4 bg-gray-200 rounded animate-pulse" />
            <div className="h-4 w-32 bg-gray-100 rounded animate-pulse" />
            
            <div className="space-y-2">
              <div className="h-10 w-40 bg-gray-200 rounded animate-pulse" />
              <div className="h-6 w-24 bg-gray-100 rounded animate-pulse" />
            </div>
            
            <div className="space-y-3">
              <div className="h-4 w-20 bg-gray-200 rounded animate-pulse" />
              <div className="flex gap-2">
                {[1, 2, 3].map(i => (
                  <div key={i} className="w-12 h-12 bg-gray-200 rounded-full animate-pulse" />
                ))}
              </div>
            </div>
            
            <div className="h-12 w-full bg-gray-200 rounded-lg animate-pulse" />
            
            <div className="space-y-2">
              <div className="h-4 w-full bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-5/6 bg-gray-100 rounded animate-pulse" />
              <div className="h-4 w-4/6 bg-gray-100 rounded animate-pulse" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
