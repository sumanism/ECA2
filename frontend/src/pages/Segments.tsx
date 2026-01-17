import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, X, Users, Workflow } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

interface Segment {
  id: string;
  name: string;
  description?: string;
  definition: {
    logical_operator?: string;
    criteria?: Array<{
      field: string;
      operator: string;
      value: any;
    }>;
  };
  created_at: string;
  user_count?: number;
}

interface Criterion {
  field: string;
  operator: string;
  value: any;
}

const CUSTOMER_FIELDS = [
  { value: 'total_order_value', label: 'Total Purchase Value', type: 'number' },
  { value: 'order_count', label: 'Order Count', type: 'number' },
  { value: 'days_since_last_order', label: 'Days Since Last Order', type: 'number' },
  { value: 'last_order_date', label: 'Last Order Date', type: 'date' },
  { value: 'shipping_state', label: 'Shipping State', type: 'string' },
  { value: 'shipping_country', label: 'Shipping Country', type: 'string' },
  { value: 'email', label: 'Email', type: 'string' },
  { value: 'marketing_opt_in', label: 'Marketing Opt-In', type: 'boolean' },
];

const OPERATORS = {
  number: [
    { value: 'gt', label: 'More Than' },
    { value: 'gte', label: 'More Than or Equal' },
    { value: 'lt', label: 'Less Than' },
    { value: 'lte', label: 'Less Than or Equal' },
    { value: 'eq', label: 'Equal To' },
  ],
  string: [
    { value: 'eq', label: 'Equals' },
    { value: 'contains', label: 'Contains' },
  ],
  boolean: [
    { value: 'eq', label: 'Is' },
  ],
  date: [
    { value: 'lt', label: 'Less Than (More Recent)' },
    { value: 'gt', label: 'More Than (Older)' },
  ],
};

const RELATIVE_DATE_OPTIONS = [
  { value: 'relative_1', label: '1 Day Ago' },
  { value: 'relative_7', label: '1 Week Ago' },
  { value: 'relative_30', label: '1 Month Ago' },
  { value: 'relative_90', label: '3 Months Ago' },
  { value: 'relative_180', label: '6 Months Ago' },
  { value: 'relative_365', label: '1 Year Ago' },
];

interface SegmentUser {
  id: string;
  name: string;
  email?: string;
  [key: string]: any;
}

export default function Segments() {
  const location = useLocation();
  const navigate = useNavigate();
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isUsersModalOpen, setIsUsersModalOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<Segment | null>(null);
  const [segmentUsers, setSegmentUsers] = useState<SegmentUser[]>([]);
  const [segmentColumns, setSegmentColumns] = useState<string[]>([]);
  const [isGeneratingFromDescription, setIsGeneratingFromDescription] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    logical_operator: 'AND' as 'AND' | 'OR',
    criteria: [] as Criterion[],
  });

  useEffect(() => {
    fetchSegments();
    
    // Check if navigated from AI assistant with description
    if (location.state?.createSegment && location.state?.description) {
      setFormData(prev => ({
        ...prev,
        description: location.state.description,
      }));
      setIsCreateModalOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchSegments = async () => {
    try {
      const response = await api.get('/segments/');
      const segmentsData = response.data;
      
      // Fetch count for each segment
      const segmentsWithCount = await Promise.all(
        segmentsData.map(async (segment: Segment) => {
          try {
            const countResponse = await api.get(`/segments/${segment.id}/count`);
            return { ...segment, user_count: countResponse.data.count };
          } catch (error) {
            return { ...segment, user_count: 0 };
          }
        })
      );
      
      setSegments(segmentsWithCount);
    } catch (error) {
      console.error('Error fetching segments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewUsers = async (segment: Segment) => {
    try {
      const response = await api.get(`/segments/${segment.id}/users`);
      setSegmentUsers(response.data.users);
      setSegmentColumns(response.data.columns || ['name', 'email']);
      setSelectedSegment(segment);
      setIsUsersModalOpen(true);
    } catch (error) {
      console.error('Error fetching segment users:', error);
      alert('Error fetching users');
    }
  };

  const generateCriteriaFromDescription = async () => {
    const description = formData.description?.trim();
    if (!description) {
      alert('Please enter a description first');
      return;
    }

    setIsGeneratingFromDescription(true);
    try {
      console.log('Generating criteria from description:', description);
      const response = await api.post('/ai/segments/build', {
        prompt: description,
      });
      
      console.log('AI Response:', response.data);
      
      if (response.data && response.data.criteria && response.data.criteria.length > 0) {
        setFormData(prev => ({
          ...prev,
          criteria: response.data.criteria,
          logical_operator: response.data.logical_operator || 'AND',
        }));
        console.log('Criteria generated:', response.data.criteria);
      } else {
        console.log('No criteria in response:', response.data);
        alert('AI could not generate criteria. Please try a different description or add criteria manually.');
      }
    } catch (error: any) {
      console.error('Error generating criteria from description:', error);
      console.error('Error details:', error.response?.data);
      alert(`Error generating criteria: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingFromDescription(false);
    }
  };

  const handleDescriptionChange = (description: string) => {
    // Just update the description, don't auto-generate
    setFormData(prev => ({ ...prev, description }));
  };

  const handleCreate = async () => {
    try {
      // If description is provided but no criteria, try to generate from description
      let criteria = formData.criteria;
      let logicalOperator = formData.logical_operator;
      
      if (formData.description && formData.description.trim() && criteria.length === 0) {
        if (confirm('No criteria defined. Would you like to generate criteria from the description?')) {
          setIsGeneratingFromDescription(true);
          try {
            const aiResponse = await api.post('/ai/segments/build', {
              prompt: formData.description,
            });
            
            if (aiResponse.data && aiResponse.data.criteria && aiResponse.data.criteria.length > 0) {
              criteria = aiResponse.data.criteria;
              logicalOperator = aiResponse.data.logical_operator || 'AND';
            } else {
              alert('Could not generate criteria. Please add criteria manually.');
              setIsGeneratingFromDescription(false);
              return;
            }
          } catch (aiError: any) {
            console.error('Error generating criteria from description:', aiError);
            alert(`Error generating criteria: ${aiError.response?.data?.detail || aiError.message || 'Unknown error'}`);
            setIsGeneratingFromDescription(false);
            return;
          } finally {
            setIsGeneratingFromDescription(false);
          }
        } else {
          alert('Please add at least one criterion to create the segment.');
          return;
        }
      }
      
      if (criteria.length === 0) {
        alert('Please add at least one criterion to create the segment.');
        return;
      }
      
      const definition = {
        logical_operator: logicalOperator,
        criteria: criteria,
      };
      
      await api.post('/segments/', {
        name: formData.name,
        description: formData.description,
        definition,
      });
      setIsCreateModalOpen(false);
      resetForm();
      fetchSegments();
    } catch (error) {
      console.error('Error creating segment:', error);
      alert('Error creating segment');
    }
  };

  const handleEdit = (segment: Segment) => {
    setSelectedSegment(segment);
    const def = segment.definition || {};
    setFormData({
      name: segment.name,
      description: segment.description || '',
      logical_operator: (def.logical_operator || 'AND') as 'AND' | 'OR',
      criteria: def.criteria || [],
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedSegment) return;
    try {
      const definition = {
        logical_operator: formData.logical_operator,
        criteria: formData.criteria,
      };
      await api.put(`/segments/${selectedSegment.id}`, {
        name: formData.name,
        description: formData.description,
        definition,
      });
      setIsEditModalOpen(false);
      setSelectedSegment(null);
      resetForm();
      fetchSegments();
    } catch (error) {
      console.error('Error updating segment:', error);
      alert('Error updating segment');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this segment?')) return;
    try {
      await api.delete(`/segments/${id}`);
      fetchSegments();
    } catch (error) {
      console.error('Error deleting segment:', error);
      alert('Error deleting segment');
    }
  };


  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      logical_operator: 'AND',
      criteria: [],
    });
  };

  const addCriterion = () => {
    setFormData({
      ...formData,
      criteria: [
        ...formData.criteria,
        { field: 'total_order_value', operator: 'gt', value: 0 },
      ],
    });
  };

  const updateCriterion = (index: number, field: keyof Criterion, value: any) => {
    const newCriteria = [...formData.criteria];
    newCriteria[index] = { ...newCriteria[index], [field]: value };
    
    // Reset operator and value if field type changes
    if (field === 'field') {
      const fieldInfo = CUSTOMER_FIELDS.find(f => f.value === value);
      if (fieldInfo) {
        const defaultOp = OPERATORS[fieldInfo.type as keyof typeof OPERATORS][0].value;
        newCriteria[index].operator = defaultOp;
        if (fieldInfo.type === 'boolean') {
          newCriteria[index].value = true;
        } else if (fieldInfo.type === 'number') {
          newCriteria[index].value = 0;
        } else {
          newCriteria[index].value = '';
        }
      }
    }
    
    setFormData({ ...formData, criteria: newCriteria });
  };

  const removeCriterion = (index: number) => {
    setFormData({
      ...formData,
      criteria: formData.criteria.filter((_, i) => i !== index),
    });
  };

  const getFieldType = (fieldValue: string): string => {
    const field = CUSTOMER_FIELDS.find(f => f.value === fieldValue);
    return field?.type || 'string';
  };

  const getOperatorsForField = (fieldValue: string) => {
    const fieldType = getFieldType(fieldValue);
    return OPERATORS[fieldType as keyof typeof OPERATORS] || OPERATORS.string;
  };

  const renderValueInput = (criterion: Criterion, index: number) => {
    const fieldType = getFieldType(criterion.field);
    
    if (criterion.field === 'last_order_date') {
      return (
        <select
          value={criterion.value}
          onChange={(e) => updateCriterion(index, 'value', e.target.value)}
          className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
        >
          <option value="">Select time period</option>
          {RELATIVE_DATE_OPTIONS.map(opt => (
            <option key={opt.value} value={opt.value}>{opt.label}</option>
          ))}
        </select>
      );
    }
    
    if (fieldType === 'boolean') {
      return (
        <select
          value={criterion.value ? 'true' : 'false'}
          onChange={(e) => updateCriterion(index, 'value', e.target.value === 'true')}
          className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
        >
          <option value="true">Yes</option>
          <option value="false">No</option>
        </select>
      );
    }
    
    if (fieldType === 'number') {
      return (
        <input
          type="number"
          value={criterion.value}
          onChange={(e) => updateCriterion(index, 'value', parseFloat(e.target.value) || 0)}
          className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
          placeholder="Enter value"
        />
      );
    }
    
    return (
      <input
        type="text"
        value={criterion.value}
        onChange={(e) => updateCriterion(index, 'value', e.target.value)}
        className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
        placeholder="Enter value"
      />
    );
  };

  const formatCriteria = (definition: any): string => {
    if (!definition) return 'No criteria';
    
    const criteria = definition.criteria || [];
    const operator = definition.logical_operator || 'AND';
    
    if (criteria.length === 0) return 'No criteria';
    
    return criteria.map((c: any) => {
      const field = CUSTOMER_FIELDS.find(f => f.value === c.field)?.label || c.field;
      const op = getOperatorsForField(c.field).find(o => o.value === c.operator)?.label || c.operator;
      let value = c.value;
      
      if (c.field === 'last_order_date' && typeof value === 'string' && value.startsWith('relative_')) {
        value = RELATIVE_DATE_OPTIONS.find(o => o.value === value)?.label || value;
      }
      
      return `${field} ${op} ${value}`;
    }).join(` ${operator} `);
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Segments</h1>
          <p className="text-dark-muted">Create customer segments based on marketing metrics and criteria.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Segment</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {segments.map((segment) => (
          <div
            key={segment.id}
            className="bg-dark-card border border-dark-border rounded-lg p-6"
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold mb-2">{segment.name}</h3>
                {segment.description && (
                  <p className="text-sm text-dark-muted mb-3">{segment.description}</p>
                )}
                <div className="text-xs text-dark-muted bg-dark-border p-2 rounded mb-3">
                  <div className="font-medium mb-1">
                    {segment.definition?.logical_operator || 'AND'} Logic
                  </div>
                  <div>{formatCriteria(segment.definition)}</div>
                </div>
                <button
                  onClick={() => handleViewUsers(segment)}
                  className="flex items-center gap-2 px-3 py-2 bg-orange-600/20 hover:bg-orange-600/30 rounded-lg text-sm text-orange-400 transition-colors"
                >
                  <Users className="w-4 h-4" />
                  <span className="font-medium">{segment.user_count || 0} Users</span>
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(segment)}
                  className="p-2 hover:bg-dark-border rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(segment.id)}
                  className="p-2 hover:bg-dark-border rounded-lg text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create Segment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Segment Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., High-Value Customers"
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">
                Description {isGeneratingFromDescription && <span className="text-orange-400 text-xs">(Generating...)</span>}
              </label>
              {formData.description && formData.description.trim() && (
                <button
                  type="button"
                  onClick={generateCriteriaFromDescription}
                  disabled={isGeneratingFromDescription}
                  className="flex items-center gap-1 px-3 py-1 text-xs bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all"
                >
                  {isGeneratingFromDescription ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Generating...</span>
                    </>
                  ) : (
                    <>
                      <span>✨</span>
                      <span>Generate Criteria</span>
                    </>
                  )}
                </button>
              )}
            </div>
            <textarea
              value={formData.description}
              onChange={(e) => handleDescriptionChange(e.target.value)}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Describe this segment in natural language (e.g., 'High-value customers in Texas with more than $1000 total order value'). Then click 'Generate Criteria' to convert it to segment criteria."
            />
            {formData.criteria.length === 0 && !isGeneratingFromDescription && formData.description && (
              <p className="text-xs text-dark-muted mt-1">
                💡 Tip: Click "Generate Criteria" button above to convert your description into segment criteria
              </p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Logical Operator</label>
            <select
              value={formData.logical_operator}
              onChange={(e) => setFormData({ ...formData, logical_operator: e.target.value as 'AND' | 'OR' })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="AND">ALL criteria must be true (AND)</option>
              <option value="OR">ANY criteria can be true (OR)</option>
            </select>
            <p className="text-xs text-dark-muted mt-1">
              {formData.logical_operator === 'AND' 
                ? 'Customer must match all criteria' 
                : 'Customer must match at least one criterion'}
            </p>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Segment Criteria</label>
              <button
                onClick={addCriterion}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Criteria
              </button>
            </div>
            <div className="space-y-3">
              {formData.criteria.map((criterion, index) => (
                <div key={index} className="bg-dark-border p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-muted">Criterion {index + 1}</span>
                    <button
                      onClick={() => removeCriterion(index)}
                      className="p-1 text-red-500 hover:bg-dark-bg rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={criterion.field}
                      onChange={(e) => updateCriterion(index, 'field', e.target.value)}
                      className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
                    >
                      {CUSTOMER_FIELDS.map(field => (
                        <option key={field.value} value={field.value}>{field.label}</option>
                      ))}
                    </select>
                    <select
                      value={criterion.operator}
                      onChange={(e) => updateCriterion(index, 'operator', e.target.value)}
                      className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
                    >
                      {getOperatorsForField(criterion.field).map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    {renderValueInput(criterion, index)}
                  </div>
                </div>
              ))}
              {formData.criteria.length === 0 && (
                <div className="text-center py-4 text-dark-muted text-sm">
                  No criteria added. Click "Add Criteria" to start building your segment.
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-dark-border">
            <button
              onClick={() => {
                setIsCreateModalOpen(false);
                resetForm();
              }}
              className="px-4 py-2 bg-dark-border hover:bg-dark-bg rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={formData.criteria.length === 0 || !formData.name}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
            >
              Create Segment
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedSegment(null);
          resetForm();
        }}
        title="Edit Segment"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Segment Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={2}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Logical Operator</label>
            <select
              value={formData.logical_operator}
              onChange={(e) => setFormData({ ...formData, logical_operator: e.target.value as 'AND' | 'OR' })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="AND">ALL criteria must be true (AND)</option>
              <option value="OR">ANY criteria can be true (OR)</option>
            </select>
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Segment Criteria</label>
              <button
                onClick={addCriterion}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Criteria
              </button>
            </div>
            <div className="space-y-3">
              {formData.criteria.map((criterion, index) => (
                <div key={index} className="bg-dark-border p-4 rounded-lg space-y-2">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-dark-muted">Criterion {index + 1}</span>
                    <button
                      onClick={() => removeCriterion(index)}
                      className="p-1 text-red-500 hover:bg-dark-bg rounded"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex gap-2 items-center">
                    <select
                      value={criterion.field}
                      onChange={(e) => updateCriterion(index, 'field', e.target.value)}
                      className="flex-1 px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
                    >
                      {CUSTOMER_FIELDS.map(field => (
                        <option key={field.value} value={field.value}>{field.label}</option>
                      ))}
                    </select>
                    <select
                      value={criterion.operator}
                      onChange={(e) => updateCriterion(index, 'operator', e.target.value)}
                      className="px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
                    >
                      {getOperatorsForField(criterion.field).map(op => (
                        <option key={op.value} value={op.value}>{op.label}</option>
                      ))}
                    </select>
                    {renderValueInput(criterion, index)}
                  </div>
                </div>
              ))}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-dark-border">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedSegment(null);
                resetForm();
              }}
              className="px-4 py-2 bg-dark-border hover:bg-dark-bg rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              disabled={formData.criteria.length === 0 || !formData.name}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
            >
              Update Segment
            </button>
          </div>
        </div>
      </Modal>

      {/* Users Modal */}
      <Modal
        isOpen={isUsersModalOpen}
        onClose={() => {
          setIsUsersModalOpen(false);
          setSelectedSegment(null);
          setSegmentUsers([]);
        }}
        title={`Users in "${selectedSegment?.name}"`}
      >
        <div className="space-y-4">
          <div className="text-sm text-dark-muted">
            Showing {segmentUsers.length} of {selectedSegment?.user_count || 0} matching users
          </div>
          <div className="bg-dark-border rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-dark-bg">
                <tr>
                  {segmentColumns.map((col) => (
                    <th key={col} className="px-4 py-3 text-left text-xs font-semibold text-dark-muted uppercase">
                      {col === 'name' ? 'Name' : 
                       col === 'email' ? 'Email' :
                       col.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-dark-border">
                {segmentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-dark-bg/50">
                    {segmentColumns.map((col) => (
                      <td key={col} className="px-4 py-3">
                        {col === 'name' ? (
                          <span className="font-medium">{user.name}</span>
                        ) : (
                          <span className="text-dark-muted">
                            {typeof user[col] === 'number' 
                              ? user[col].toLocaleString() 
                              : user[col] || '-'}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {segmentUsers.length === 0 && (
            <div className="text-center py-8 text-dark-muted">
              No users match this segment criteria
            </div>
          )}
        </div>
      </Modal>

    </div>
  );
}
