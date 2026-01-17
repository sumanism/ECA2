import { User } from '../types';

export const getCustomerStatus = (customer: User): { label: string; variant: 'vip' | 'active_customer' | 'regular' | 'new' } => {
  if (customer.total_order_value > 10000) {
    return { label: 'VIP', variant: 'vip' };
  } else if (customer.total_order_value > 5000) {
    return { label: 'ACTIVE', variant: 'active_customer' };
  } else if (customer.order_count > 5) {
    return { label: 'REGULAR', variant: 'regular' };
  } else {
    return { label: 'NEW', variant: 'new' };
  }
};

export const sortCustomers = (customers: User[], sortBy: string): User[] => {
  const sorted = [...customers];
  
  switch (sortBy) {
    case 'highest_spend':
      return sorted.sort((a, b) => b.total_order_value - a.total_order_value);
    case 'most_orders':
      return sorted.sort((a, b) => b.order_count - a.order_count);
    case 'newest':
      return sorted.sort((a, b) => {
        const dateA = a.created_at ? new Date(a.created_at).getTime() : 0;
        const dateB = b.created_at ? new Date(b.created_at).getTime() : 0;
        return dateB - dateA;
      });
    default:
      return sorted;
  }
};

export const filterCustomers = (customers: User[], filterStatus: string, filterState: string): User[] => {
  let filtered = [...customers];

  if (filterStatus !== 'all') {
    filtered = filtered.filter((customer) => {
      const status = getCustomerStatus(customer);
      return status.label === filterStatus.toUpperCase();
    });
  }

  if (filterState !== 'all') {
    filtered = filtered.filter((customer) => customer.shipping_state === filterState);
  }

  return filtered;
};
