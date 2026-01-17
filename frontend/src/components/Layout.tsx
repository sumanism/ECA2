import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Users, 
  ShoppingBag, 
  Package, 
  BarChart3, 
  Filter,
  Settings,
  Bell,
  User,
  Sparkles,
  Layers,
  Workflow,
  Megaphone,
  Bot
} from 'lucide-react';
import AiAssistant from './AiAssistant';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);

  const navItems = [
    { path: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { path: '/customers', icon: Users, label: 'Customers' },
    { path: '/campaigns', icon: Megaphone, label: 'Campaigns' },
    { path: '/flows', icon: Workflow, label: 'Flows' },
    { path: '/segments', icon: Layers, label: 'Segments' },
    { path: '/analytics', icon: BarChart3, label: 'Analytics' },
    { path: '/orders', icon: ShoppingBag, label: 'Orders' },
    { path: '/inventory', icon: Package, label: 'Inventory' },
    { path: '/agent', icon: Bot, label: 'AI Agent' },
  ];

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <div className="flex h-screen bg-dark-bg text-dark-text">
      {/* Sidebar */}
      <aside className="w-64 bg-dark-card border-r border-dark-border flex flex-col">
        <div className="p-6 border-b border-dark-border">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <span className="text-xl font-bold">E-commerceOS</span>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-2">
          {navItems.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                  isActive(item.path)
                    ? 'bg-gradient-to-r from-orange-600 to-orange-500 text-white'
                    : 'text-dark-muted hover:bg-dark-border hover:text-dark-text'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span>{item.label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="p-4 border-t border-dark-border">
          <Link
            to="/settings"
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-dark-muted hover:bg-dark-border hover:text-dark-text"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-dark-card border-b border-dark-border flex items-center justify-between px-6">
          <h1 className="text-xl font-semibold">
            {navItems.find(item => isActive(item.path))?.label || 'Dashboard'}
          </h1>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setAiAssistantOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              <Sparkles className="w-4 h-4" />
              <span>AI ASSISTANT</span>
            </button>
            <button className="p-2 hover:bg-dark-border rounded-lg">
              <Bell className="w-5 h-5" />
            </button>
            <button className="p-2 hover:bg-dark-border rounded-lg">
              <User className="w-5 h-5" />
            </button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-y-auto bg-dark-bg p-6">
          {children}
        </main>
      </div>

      {/* AI Assistant Sidebar */}
      <AiAssistant isOpen={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} />
    </div>
  );
}
