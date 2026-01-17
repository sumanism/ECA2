import { useEffect, useState, useMemo } from 'react';
import { Plus, Edit, Trash2 } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';
import Button from '../components/ui/Button';
import Input from '../components/ui/Input';
import Select from '../components/ui/Select';
import Badge from '../components/ui/Badge';
import SearchInput from '../components/ui/SearchInput';
import { useModal } from '../hooks/useModal';
import { useApi } from '../hooks/useApi';
import { User } from '../types';
import { getCustomerStatus, sortCustomers, filterCustomers } from '../utils/customerUtils';
import { getInitials, formatCurrency } from '../utils/formatters';
import { CUSTOMER_STATUS_FILTERS, US_STATES } from '../utils/constants';

const INITIAL_FORM_DATA = {
  email: '',
  phone: '',
  first_name: '',
  last_name: '',
  marketing_opt_in: true,
  shipping_state: '',
  shipping_country: 'US',
};

const SORT_OPTIONS = [
  { value: 'highest_spend', label: 'Highest Spend' },
  { value: 'most_orders', label: 'Most Orders' },
  { value: 'newest', label: 'Newest' },
];

const STATE_OPTIONS = [
  { value: 'all', label: 'All States' },
  { value: 'TX', label: 'Texas' },
  { value: 'CA', label: 'California' },
  { value: 'NY', label: 'New York' },
  { value: 'FL', label: 'Florida' },
  { value: 'WA', label: 'Washington' },
];

const STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  ...CUSTOMER_STATUS_FILTERS.filter(s => s !== 'all').map(s => ({ value: s, label: s })),
];

export default function Customers() {
  const [customers, setCustomers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('highest_spend');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterState, setFilterState] = useState<string>('all');
  const [selectedCustomer, setSelectedCustomer] = useState<User | null>(null);
  const [formData, setFormData] = useState(INITIAL_FORM_DATA);
  
  const createModal = useModal();
  const editModal = useModal();
  const { execute: executeApi } = useApi();

  useEffect(() => {
    fetchCustomers();
  }, [search]);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const response = await api.get('/users/', {
        params: { search, limit: 100 },
      });
      setCustomers(response.data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const processedCustomers = useMemo(() => {
    let processed = filterCustomers(customers, filterStatus, filterState);
    return sortCustomers(processed, sortBy);
  }, [customers, filterStatus, filterState, sortBy]);

  const handleCreate = async () => {
    const result = await executeApi(() => api.post('/users/', formData));
    if (result) {
      createModal.close();
      setFormData(INITIAL_FORM_DATA);
      fetchCustomers();
    }
  };

  const handleEdit = (customer: User) => {
    setSelectedCustomer(customer);
    setFormData({
      email: customer.email,
      phone: customer.phone || '',
      first_name: customer.first_name,
      last_name: customer.last_name,
      marketing_opt_in: customer.marketing_opt_in ?? true,
      shipping_state: customer.shipping_state || '',
      shipping_country: customer.shipping_country || 'US',
    });
    editModal.open();
  };

  const handleUpdate = async () => {
    if (!selectedCustomer) return;
    const result = await executeApi(() => api.put(`/users/${selectedCustomer.id}`, formData));
    if (result) {
      editModal.close();
      setSelectedCustomer(null);
      setFormData(INITIAL_FORM_DATA);
      fetchCustomers();
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this customer?')) return;
    const result = await executeApi(() => api.delete(`/users/${id}`));
    if (result) {
      fetchCustomers();
    }
  };

  const resetForm = () => {
    setFormData(INITIAL_FORM_DATA);
    setSelectedCustomer(null);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <div className="text-sm text-dark-muted mb-1">Admin &gt; Customers</div>
          <h1 className="text-3xl font-bold mb-2">Customers</h1>
          <p className="text-dark-muted">Manage and monitor your store's customer engagement.</p>
        </div>
        <Button onClick={createModal.open}>
          <Plus className="w-4 h-4" />
          <span>New Customer</span>
        </Button>
      </div>

      <div className="flex items-center gap-4">
        <SearchInput
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search customers by name or email..."
        />
        <div className="flex items-center gap-2">
          <Select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            options={STATUS_OPTIONS}
            className="w-auto min-w-[150px]"
          />
          <Select
            value={filterState}
            onChange={(e) => setFilterState(e.target.value)}
            options={STATE_OPTIONS}
            className="w-auto min-w-[150px]"
          />
        </div>
        <div className="flex items-center gap-2">
          <span className="text-sm text-dark-muted">SORT BY:</span>
          <Select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            options={SORT_OPTIONS}
            className="w-auto min-w-[150px]"
          />
        </div>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg overflow-hidden">
        <table className="w-full">
          <thead className="bg-dark-border">
            <tr>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase tracking-wider">
                CUSTOMER
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase tracking-wider">
                EMAIL
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase tracking-wider">
                STATUS
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase tracking-wider">
                ORDERS
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase tracking-wider">
                TOTAL SPEND
              </th>
              <th className="px-6 py-4 text-left text-xs font-semibold text-dark-muted uppercase tracking-wider">
                ACTIONS
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-dark-border">
            {processedCustomers.map((customer) => {
              const status = getCustomerStatus(customer);
              return (
                <tr key={customer.id} className="hover:bg-dark-border/50">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-600 rounded-full flex items-center justify-center text-sm font-medium">
                        {getInitials(customer.first_name, customer.last_name)}
                      </div>
                      <div className="font-medium">
                        {customer.first_name} {customer.last_name}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-dark-muted">{customer.email}</td>
                  <td className="px-6 py-4">
                    <Badge variant={status.variant}>{status.label}</Badge>
                  </td>
                  <td className="px-6 py-4">{customer.order_count}</td>
                  <td className="px-6 py-4 font-medium">
                    {formatCurrency(customer.total_order_value)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex gap-2">
                      <button
                        onClick={() => handleEdit(customer)}
                        className="p-2 hover:bg-dark-border rounded-lg"
                      >
                        <Edit className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(customer.id)}
                        className="p-2 hover:bg-dark-border rounded-lg text-red-500"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-dark-muted">
        <div>SHOWING {processedCustomers.length} OF {customers.length} CUSTOMERS</div>
        <div className="flex items-center gap-2">
          <Button variant="secondary" disabled>Previous</Button>
          <Button variant="primary">Next</Button>
        </div>
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={createModal.isOpen}
        onClose={() => {
          createModal.close();
          resetForm();
        }}
        title="Create Customer"
      >
        <CustomerForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleCreate}
          onCancel={() => {
            createModal.close();
            resetForm();
          }}
        />
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={editModal.isOpen}
        onClose={() => {
          editModal.close();
          resetForm();
        }}
        title="Edit Customer"
      >
        <CustomerForm
          formData={formData}
          setFormData={setFormData}
          onSubmit={handleUpdate}
          onCancel={() => {
            editModal.close();
            resetForm();
          }}
        />
      </Modal>
    </div>
  );
}

interface CustomerFormProps {
  formData: typeof INITIAL_FORM_DATA;
  setFormData: (data: typeof INITIAL_FORM_DATA) => void;
  onSubmit: () => void;
  onCancel: () => void;
}

function CustomerForm({ formData, setFormData, onSubmit, onCancel }: CustomerFormProps) {
  const stateOptions = [
    { value: '', label: 'Select State' },
    ...STATE_OPTIONS.filter(s => s.value !== 'all'),
  ];

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input
          label="First Name"
          value={formData.first_name}
          onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
        />
        <Input
          label="Last Name"
          value={formData.last_name}
          onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
        />
      </div>
      <Input
        label="Email"
        type="email"
        value={formData.email}
        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
      />
      <Input
        label="Phone"
        type="tel"
        value={formData.phone}
        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
      />
      <div className="grid grid-cols-2 gap-4">
        <Select
          label="State"
          value={formData.shipping_state}
          onChange={(e) => setFormData({ ...formData, shipping_state: e.target.value })}
          options={stateOptions}
        />
        <Input
          label="Country"
          value={formData.shipping_country}
          onChange={(e) => setFormData({ ...formData, shipping_country: e.target.value })}
        />
      </div>
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="marketing_opt_in"
          checked={formData.marketing_opt_in}
          onChange={(e) => setFormData({ ...formData, marketing_opt_in: e.target.checked })}
          className="w-4 h-4"
        />
        <label htmlFor="marketing_opt_in" className="text-sm">
          Marketing Opt-In
        </label>
      </div>
      <div className="flex gap-2 justify-end pt-4 border-t border-dark-border">
        <Button variant="secondary" onClick={onCancel}>Cancel</Button>
        <Button onClick={onSubmit}>Create</Button>
      </div>
    </div>
  );
}
