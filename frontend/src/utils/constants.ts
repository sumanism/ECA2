// Shared constants

export const CAMPAIGN_STATUSES = ['draft', 'active', 'paused', 'completed'] as const;

export const LOGICAL_OPERATORS = ['AND', 'OR'] as const;

export const CRITERION_OPERATORS = ['gt', 'lt', 'eq', 'contains'] as const;

export const STEP_TYPES = [
  { value: 'SEND_EMAIL', label: 'Send Email' },
  { value: 'WAIT', label: 'Wait' },
  { value: 'SEND_PUSH', label: 'Send Push Notification' },
  { value: 'EXIT', label: 'Exit Flow' },
] as const;

export const ENTRY_CONDITIONS = [
  'New Customer Signup',
  'First Purchase',
  'Cart Abandoned',
  'Order Completed',
  'Subscription Renewal',
] as const;

export const US_STATES = [
  'AL', 'AK', 'AZ', 'AR', 'CA', 'CO', 'CT', 'DE', 'FL', 'GA',
  'HI', 'ID', 'IL', 'IN', 'IA', 'KS', 'KY', 'LA', 'ME', 'MD',
  'MA', 'MI', 'MN', 'MS', 'MO', 'MT', 'NE', 'NV', 'NH', 'NJ',
  'NM', 'NY', 'NC', 'ND', 'OH', 'OK', 'OR', 'PA', 'RI', 'SC',
  'SD', 'TN', 'TX', 'UT', 'VT', 'VA', 'WA', 'WV', 'WI', 'WY',
] as const;

export const CUSTOMER_STATUS_FILTERS = ['all', 'VIP', 'Active', 'Regular', 'New'] as const;

export const SEGMENT_FIELDS = [
  { value: 'total_order_value', label: 'Total Order Value' },
  { value: 'order_count', label: 'Order Count' },
  { value: 'last_order_date', label: 'Last Order Date' },
  { value: 'shipping_state', label: 'Shipping State' },
  { value: 'shipping_country', label: 'Shipping Country' },
  { value: 'marketing_opt_in', label: 'Marketing Opt-in' },
] as const;
