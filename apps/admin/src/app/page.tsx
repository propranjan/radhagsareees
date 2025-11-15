import Link from 'next/link';
import { 
  BarChart3, 
  Package, 
  ShoppingCart, 
  Users, 
  TrendingUp, 
  DollarSign,
  Eye,
  ArrowUpRight
} from 'lucide-react';

export default function AdminDashboard() {
  // Mock data - in real app, this would come from API
  const stats = {
    totalOrders: 1284,
    totalRevenue: 485320,
    totalProducts: 156,
    totalCustomers: 892,
  };

  const recentOrders = [
    { id: '#ORD-001', customer: 'Priya Sharma', amount: 12999, status: 'Processing', date: '2024-01-15' },
    { id: '#ORD-002', customer: 'Meera Patel', amount: 8999, status: 'Shipped', date: '2024-01-15' },
    { id: '#ORD-003', customer: 'Anjali Kumar', amount: 15999, status: 'Delivered', date: '2024-01-14' },
  ];

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <div className="fixed inset-y-0 left-0 w-64 bg-white shadow-lg">
        <div className="flex items-center justify-center h-16 bg-primary-600">
          <h1 className="text-xl font-bold text-white">Admin Dashboard</h1>
        </div>
        
        <nav className="mt-8">
          <div className="px-4 space-y-2">
            <Link href="/" className="flex items-center px-4 py-2 text-gray-700 bg-gray-100 rounded-lg">
              <BarChart3 className="w-5 h-5 mr-3" />
              Dashboard
            </Link>
            <Link href="/products" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Package className="w-5 h-5 mr-3" />
              Products
            </Link>
            <Link href="/orders" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <ShoppingCart className="w-5 h-5 mr-3" />
              Orders
            </Link>
            <Link href="/customers" className="flex items-center px-4 py-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
              <Users className="w-5 h-5 mr-3" />
              Customers
            </Link>
          </div>
        </nav>
      </div>

      {/* Main Content */}
      <div className="ml-64">
        {/* Header */}
        <header className="bg-white shadow-sm border-b">
          <div className="px-6 py-4">
            <h2 className="text-2xl font-bold text-gray-900">Dashboard Overview</h2>
            <p className="text-gray-600">Welcome back! Here's what's happening today.</p>
          </div>
        </header>

        {/* Content */}
        <main className="p-6">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  <p className="text-2xl font-bold text-gray-900">₹{stats.totalRevenue.toLocaleString()}</p>
                </div>
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-green-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+12.5% from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalOrders}</p>
                </div>
                <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                  <ShoppingCart className="w-6 h-6 text-blue-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+8.2% from last month</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Products</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalProducts}</p>
                </div>
                <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                  <Package className="w-6 h-6 text-purple-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <span className="text-sm text-gray-600">12 added this month</span>
              </div>
            </div>

            <div className="bg-white rounded-lg shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-600">Customers</p>
                  <p className="text-2xl font-bold text-gray-900">{stats.totalCustomers}</p>
                </div>
                <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                  <Users className="w-6 h-6 text-orange-600" />
                </div>
              </div>
              <div className="mt-4 flex items-center">
                <ArrowUpRight className="w-4 h-4 text-green-500" />
                <span className="text-sm text-green-600 ml-1">+15.1% from last month</span>
              </div>
            </div>
          </div>

          {/* Recent Orders Table */}
          <div className="bg-white rounded-lg shadow-sm">
            <div className="px-6 py-4 border-b border-gray-200">
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-gray-900">Recent Orders</h3>
                <Link href="/orders" className="text-primary-600 hover:text-primary-700 font-medium">
                  View All
                </Link>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Order ID
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Customer
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {order.id}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.customer}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        ₹{order.amount.toLocaleString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                          order.status === 'Delivered' ? 'bg-green-100 text-green-800' :
                          order.status === 'Shipped' ? 'bg-blue-100 text-blue-800' :
                          order.status === 'Processing' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {order.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {order.date}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <button className="text-primary-600 hover:text-primary-700">
                          <Eye className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}