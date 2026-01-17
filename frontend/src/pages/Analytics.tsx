import { BarChart3 } from 'lucide-react';

export default function Analytics() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Analytics</h1>
        <p className="text-dark-muted">View detailed analytics and insights.</p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg p-12 text-center">
        <BarChart3 className="w-16 h-16 text-dark-muted mx-auto mb-4" />
        <p className="text-dark-muted">Analytics dashboard coming soon...</p>
      </div>
    </div>
  );
}
