// Shared style classes and utilities

export const buttonStyles = {
  primary: 'px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20 disabled:opacity-50 disabled:cursor-not-allowed',
  secondary: 'px-4 py-2 bg-dark-border hover:bg-dark-bg rounded-lg transition-colors',
  danger: 'px-4 py-2 bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed',
  ghost: 'px-4 py-2 hover:bg-dark-border rounded-lg transition-colors',
  icon: 'p-2 hover:bg-dark-border rounded-lg transition-colors',
} as const;

export const inputStyles = 'w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500 transition-all';

export const cardStyles = 'bg-dark-card border border-dark-border rounded-lg p-6';

export const badgeStyles = {
  draft: 'bg-gray-500/20 text-gray-400',
  active: 'bg-green-500/20 text-green-500',
  paused: 'bg-yellow-500/20 text-yellow-500',
  completed: 'bg-orange-500/20 text-orange-500',
  vip: 'bg-green-500/20 text-green-500',
  active_customer: 'bg-orange-500/20 text-orange-500',
  regular: 'bg-gray-500/20 text-gray-400',
  new: 'bg-yellow-500/20 text-yellow-500',
} as const;
