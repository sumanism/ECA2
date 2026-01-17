import { useEffect, useState } from 'react';
import { Users, DollarSign, ShoppingBag, TrendingUp, Package, BarChart3 } from 'lucide-react';
import api from '../api';

interface DashboardMetrics {
  total_customers: number;
  revenue_30d: number;
  total_orders: number;
  average_order_value: number;
  returning_customers: number;
  new_customers: number;
}

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await api.get('/metrics/dashboard');
      setMetrics(response.data);
    } catch (error) {
      console.error('Error fetching metrics:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  const cards = [
    {
      title: 'Total Customers',
      value: metrics?.total_customers || 0,
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: Users,
      description: 'vs last month',
    },
    {
      title: '30 Days Revenue',
      value: `$${metrics?.revenue_30d.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0.00'}`,
      change: '+18%',
      changeType: 'positive' as const,
      icon: DollarSign,
      description: 'vs last month',
    },
    {
      title: 'Total Orders',
      value: metrics?.total_orders || 0,
      change: '+8.2%',
      changeType: 'positive' as const,
      icon: ShoppingBag,
      description: 'vs last month',
    },
    {
      title: 'Average Order Value',
      value: `$${metrics?.average_order_value.toFixed(2) || '0.00'}`,
      change: '+4.5%',
      changeType: 'positive' as const,
      icon: TrendingUp,
      description: 'this week',
    },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Dashboard Overview</h1>
        <p className="text-dark-muted">Welcome back, here's what's happening today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {cards.map((card, idx) => {
          const Icon = card.icon;
          return (
            <div
              key={idx}
              className="bg-dark-card border border-dark-border rounded-lg p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="p-3 bg-orange-600/20 rounded-lg">
                  <Icon className="w-6 h-6 text-orange-500" />
                </div>
                <span
                  className={`text-sm font-medium ${
                    card.changeType === 'positive' ? 'text-green-500' : 'text-red-500'
                  }`}
                >
                  {card.change}
                </span>
              </div>
              <h3 className="text-sm text-dark-muted mb-1">{card.title}</h3>
              <p className="text-2xl font-bold mb-1">{card.value}</p>
              <p className="text-xs text-dark-muted">{card.description}</p>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Customer Retention</h3>
          <div className="space-y-4">
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-dark-muted">Returning</span>
                <span className="text-sm font-medium">{metrics?.returning_customers || 0}</span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-orange-500 to-orange-600 h-2 rounded-full"
                  style={{
                    width: `${((metrics?.returning_customers || 0) / (metrics?.total_customers || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between mb-2">
                <span className="text-sm text-dark-muted">New</span>
                <span className="text-sm font-medium">{metrics?.new_customers || 0}</span>
              </div>
              <div className="w-full bg-dark-border rounded-full h-2">
                <div
                  className="bg-green-500 h-2 rounded-full"
                  style={{
                    width: `${((metrics?.new_customers || 0) / (metrics?.total_customers || 1)) * 100}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>

        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <h3 className="text-lg font-semibold mb-4">Intelligence Feed</h3>
          <div className="space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2 bg-green-500/20 rounded-lg">
                <TrendingUp className="w-4 h-4 text-green-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm">Sales are up 40% this month</p>
                <p className="text-xs text-dark-muted mt-1">2m ago</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-2 bg-orange-500/20 rounded-lg">
                <Package className="w-4 h-4 text-orange-500" />
              </div>
              <div className="flex-1">
                <p className="text-sm">Stock for popular items is running low</p>
                <p className="text-xs text-dark-muted mt-1">45m ago</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
