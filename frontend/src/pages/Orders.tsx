import { useEffect, useState } from 'react';
import { Search, Sparkles } from 'lucide-react';
import api from '../api';

interface Order {
  id: string;
  user_id: string;
  order_date: string;
  order_status: string;
  total_amount: number;
  currency: string;
}

export default function Orders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchOrders();
  }, [filter]);

  const fetchOrders = async () => {
    try {
      // Note: You'll need to create an orders endpoint in the backend
      // For now, this is a placeholder
      setOrders([]);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'shipped':
        return 'bg-green-500/20 text-green-500';
      case 'pending':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'cancelled':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Orders Management</h1>
        <div className="flex items-center gap-4">
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20">
            <Sparkles className="w-4 h-4" />
            <span>AI Mode On</span>
          </button>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-muted" />
          <input
            type="text"
            placeholder="Search orders..."
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
      </div>

      <div>
        <h2 className="text-2xl font-bold mb-2">Recent Orders</h2>
        <p className="text-dark-muted mb-4">
          Track and manage incoming customer purchases across all channels.
        </p>

        <div className="flex gap-4 mb-6">
          {['All Orders', 'Pending', 'Shipped', 'Cancelled'].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab.toLowerCase().replace(' ', '_'))}
              className={`px-4 py-2 border-b-2 ${
                filter === tab.toLowerCase().replace(' ', '_')
                  ? 'border-orange-500 text-orange-500'
                  : 'border-transparent text-dark-muted hover:text-dark-text'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
          <table className="w-full">
            <thead className="bg-dark-border">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">
                  ORDER ID
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">
                  DATE
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">
                  CUSTOMER
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">
                  STATUS
                </th>
                <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">
                  TOTAL AMOUNT
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-dark-border">
              {orders.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-dark-muted">
                    No orders found. Create an orders endpoint in the backend to display data.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
