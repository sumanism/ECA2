import { useState } from 'react';
import { Search, Plus, Filter, Download } from 'lucide-react';

export default function Inventory() {
  const [filter, setFilter] = useState('all');

  const inventoryItems = [
    {
      id: '1',
      name: 'HyperPhone Pro 15',
      sku: '99021',
      stock: 5,
      price: 999.00,
      status: 'LOW STOCK',
      predictedNeed: 'Restock in 3d',
    },
    {
      id: '2',
      name: 'HyperBook Air M2',
      sku: '82103',
      stock: 142,
      price: 1299.00,
      status: 'IN STOCK',
      predictedNeed: 'Healthy',
    },
    {
      id: '3',
      name: 'Noise Buds Pro',
      sku: '10294',
      stock: 0,
      price: 149.00,
      status: 'OUT OF STOCK',
      predictedNeed: 'Order Now',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'IN STOCK':
        return 'bg-green-500/20 text-green-500';
      case 'LOW STOCK':
        return 'bg-yellow-500/20 text-yellow-500';
      case 'OUT OF STOCK':
        return 'bg-red-500/20 text-red-500';
      default:
        return 'bg-gray-500/20 text-gray-400';
    }
  };

  const getPredictedNeedColor = (need: string) => {
    if (need.includes('Restock')) return 'text-orange-500';
    if (need === 'Order Now') return 'text-red-500';
    return 'text-gray-400';
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Inventory Management</h1>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <button className="px-4 py-2 bg-orange-600 rounded-lg">AI ON</button>
            <button className="px-4 py-2 bg-dark-card border border-dark-border rounded-lg">MANUAL</button>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20">
            <Plus className="w-4 h-4" />
            <span>Add Product</span>
          </button>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-4">
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-muted">Total SKUs</span>
            <span className="text-xs text-green-500">+2.5% this month</span>
          </div>
          <p className="text-2xl font-bold">1,240</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-muted">Low Stock Alerts</span>
            <span className="text-xs text-yellow-500">Action required</span>
          </div>
          <p className="text-2xl font-bold">12</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-muted">Out of Stock</span>
            <span className="text-xs text-red-500">Critical</span>
          </div>
          <p className="text-2xl font-bold">4</p>
        </div>
        <div className="bg-dark-card border border-dark-border rounded-lg p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-dark-muted">Inventory Value</span>
            <span className="text-xs text-orange-500">Live valuation</span>
          </div>
          <p className="text-2xl font-bold">$142,840</p>
        </div>
      </div>

      <div className="flex items-center gap-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-5 h-5 text-dark-muted" />
          <input
            type="text"
            placeholder="Search by SKU, product name..."
            className="w-full pl-10 pr-4 py-2 bg-dark-card border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>
        <div className="flex gap-2">
          {['All Items', 'Low Stock', 'Out of Stock'].map((item) => (
            <button
              key={item}
              onClick={() => setFilter(item.toLowerCase().replace(' ', '_'))}
              className={`px-4 py-2 rounded-lg ${
                filter === item.toLowerCase().replace(' ', '_')
                  ? 'bg-orange-600 text-white'
                  : 'bg-dark-card border border-dark-border hover:bg-dark-border'
              }`}
            >
              {item}
            </button>
          ))}
        </div>
        <button className="p-2 bg-dark-card border border-dark-border rounded-lg hover:bg-dark-border">
          <Filter className="w-5 h-5" />
        </button>
        <button className="p-2 bg-dark-card border border-dark-border rounded-lg hover:bg-dark-border">
          <Download className="w-5 h-5" />
        </button>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">PRODUCT</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">SKU</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">STOCK LEVEL</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">PRICE</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">STATUS</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">PREDICTED NEED</th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase">ACTION</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {inventoryItems.map((item) => (
              <tr key={item.id} className="hover:bg-dark-border/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-dark-border rounded-lg flex items-center justify-center">
                      <span className="text-xs">📱</span>
                    </div>
                    <span className="font-medium">{item.name}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-dark-muted">{item.sku}</td>
                <td className="px-6 py-4">
                  <div className="flex items-center gap-2">
                    <span>{item.stock} units</span>
                    <div className="w-24 h-2 bg-dark-border rounded-full overflow-hidden">
                      <div
                        className={`h-full ${
                          item.stock > 50 ? 'bg-orange-500' : item.stock > 0 ? 'bg-yellow-500' : 'bg-gray-500'
                        }`}
                        style={{ width: `${Math.min((item.stock / 150) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4 font-medium">${item.price.toFixed(2)}</td>
                <td className="px-6 py-4">
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                    {item.status}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <span className={`text-sm ${getPredictedNeedColor(item.predictedNeed)}`}>
                    {item.predictedNeed}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <button className="p-2 hover:bg-dark-border rounded-lg">⋯</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
