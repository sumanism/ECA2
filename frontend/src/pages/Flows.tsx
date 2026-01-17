import { useState, useEffect } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Plus, Edit, Trash2, ArrowRight, Mail, Clock, Bell, X, Sparkles } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

interface Flow {
  id: string;
  segment_id: string;
  entry_condition_type?: string;
  entry_condition?: string;
  name?: string;
  created_at: string;
}

const ENTRY_CONDITION_TYPES = [
  { value: 'signup', label: 'New Customer Signup' },
  { value: 'first_purchase', label: 'First Purchase' },
  { value: 'cart_abandoned', label: 'Cart Abandoned' },
  { value: 'order_completed', label: 'Order Completed' },
  { value: 'subscription_renewal', label: 'Subscription Renewal' },
];

interface Segment {
  id: string;
  name: string;
  description?: string;
  definition?: any;
}

interface Campaign {
  id: string;
  name: string;
}

interface FlowStep {
  id: string;
  flow_id: string;
  step_type: string;
  config: Record<string, any>;
  next_step_id?: string;
  step_order: number;
}

const STEP_TYPES = [
  { value: 'SEND_EMAIL', label: 'Send Email', icon: Mail },
  { value: 'WAIT', label: 'Wait', icon: Clock },
  { value: 'SEND_PUSH', label: 'Send Push', icon: Bell },
  { value: 'EXIT', label: 'Exit', icon: X },
];

export default function Flows() {
  const location = useLocation();
  const navigate = useNavigate();
  const [flows, setFlows] = useState<Flow[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedFlow, setSelectedFlow] = useState<Flow | null>(null);
  const [isGeneratingFlow, setIsGeneratingFlow] = useState(false);
  const [formData, setFormData] = useState({
    segment_id: '',
    entry_condition_type: '',
    entry_condition: '',
    name: '',
    steps: [] as Array<{
      step_type: string;
      config: Record<string, any>;
      next_step_id?: string;
      step_order: number;
    }>,
  });

  useEffect(() => {
    fetchFlows();
    fetchSegments();
    
    // Check if navigated from segments page with segment selected
    if (location.state?.createFlow && location.state?.segmentId) {
      setFormData(prev => ({
        ...prev,
        segment_id: location.state.segmentId,
      }));
      setIsCreateModalOpen(true);
      // Clear the state
      window.history.replaceState({}, document.title);
    }
  }, [location]);

  const fetchFlows = async () => {
    try {
      const response = await api.get('/flows/');
      setFlows(response.data);
    } catch (error) {
      console.error('Error fetching flows:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSegments = async () => {
    try {
      const response = await api.get('/segments/');
      setSegments(response.data);
    } catch (error) {
      console.error('Error fetching segments:', error);
    }
  };

  const fetchFlowSteps = async (flowId: string) => {
    try {
      const response = await api.get(`/flows/${flowId}/steps`);
      return response.data.sort((a: FlowStep, b: FlowStep) => a.step_order - b.step_order);
    } catch (error) {
      console.error('Error fetching flow steps:', error);
      return [];
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/flows/', formData);
      setIsCreateModalOpen(false);
      resetForm();
      fetchFlows();
    } catch (error: any) {
      console.error('Error creating flow:', error);
      alert(error.response?.data?.detail || 'Error creating flow');
    }
  };

  const handleEdit = async (flow: Flow) => {
    setSelectedFlow(flow);
    const steps = await fetchFlowSteps(flow.id);
    setFormData({
      segment_id: flow.segment_id,
      entry_condition_type: flow.entry_condition_type || '',
      entry_condition: flow.entry_condition || '',
      name: flow.name || '',
      steps: steps.map((step: FlowStep) => ({
        step_type: step.step_type,
        config: step.config,
        next_step_id: step.next_step_id,
        step_order: step.step_order,
      })),
    });
    setIsEditModalOpen(true);
  };


  const handleGenerateFlowFromSegment = async () => {
    if (!formData.segment_id) {
      alert('Please select a segment first');
      return;
    }

    const segment = segments.find(s => s.id === formData.segment_id);
    if (!segment) {
      alert('Segment not found');
      return;
    }

    setIsGeneratingFlow(true);
    try {
      const response = await api.post('/ai/flows/generate-from-segment', {
        segment_id: formData.segment_id,
        segment_description: segment.description || segment.name,
      });

      const generated = response.data;
      
      // Update form with generated flow data
      setFormData(prev => ({
        ...prev,
        entry_condition_type: generated.entry_condition_type || prev.entry_condition_type,
        entry_condition: generated.entry_condition || prev.entry_condition,
        name: generated.name || prev.name,
        steps: generated.steps || prev.steps,
      }));
    } catch (error: any) {
      console.error('Error generating flow:', error);
      alert(`Error generating flow: ${error.response?.data?.detail || error.message || 'Unknown error'}`);
    } finally {
      setIsGeneratingFlow(false);
    }
  };

  const handleUpdate = async () => {
    if (!selectedFlow) return;
    try {
      await api.put(`/flows/${selectedFlow.id}`, {
        entry_condition_type: formData.entry_condition_type,
        entry_condition: formData.entry_condition,
        name: formData.name,
      });
      setIsEditModalOpen(false);
      setSelectedFlow(null);
      resetForm();
      fetchFlows();
    } catch (error) {
      console.error('Error updating flow:', error);
      alert('Error updating flow');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this flow?')) return;
    try {
      await api.delete(`/flows/${id}`);
      fetchFlows();
    } catch (error) {
      console.error('Error deleting flow:', error);
      alert('Error deleting flow');
    }
  };

  const resetForm = () => {
    setFormData({
      segment_id: '',
      entry_condition_type: '',
      entry_condition: '',
      name: '',
      steps: [],
    });
  };

  const addStep = () => {
    setFormData({
      ...formData,
      steps: [
        ...formData.steps,
        {
          step_type: 'SEND_EMAIL',
          config: { subject: '', body_text: '' },
          step_order: formData.steps.length + 1,
        },
      ],
    });
  };

  const updateStep = (index: number, field: string, value: any) => {
    const newSteps = [...formData.steps];
    if (field === 'config') {
      newSteps[index] = { ...newSteps[index], config: { ...newSteps[index].config, ...value } };
    } else {
      newSteps[index] = { ...newSteps[index], [field]: value };
      
      // Reset config when step_type changes
      if (field === 'step_type') {
        if (value === 'SEND_EMAIL') {
          newSteps[index].config = { subject: '', body_text: '' };
        } else if (value === 'WAIT') {
          newSteps[index].config = { duration_days: 0 };
        } else if (value === 'SEND_PUSH') {
          newSteps[index].config = { title: '', message: '' };
        } else {
          newSteps[index].config = {};
        }
      }
    }
    setFormData({ ...formData, steps: newSteps });
  };

  const removeStep = (index: number) => {
    setFormData({
      ...formData,
      steps: formData.steps.filter((_, i) => i !== index).map((step, i) => ({
        ...step,
        step_order: i + 1,
      })),
    });
  };

  const renderStepConfig = (step: any, index: number) => {
    if (step.step_type === 'SEND_EMAIL') {
      return (
        <div className="space-y-2">
          <div className="mb-2">
            <span className="text-sm text-dark-muted">Email Content</span>
          </div>
          <input
            type="text"
            placeholder="Email Subject"
            value={step.config.subject || ''}
            onChange={(e) => updateStep(index, 'config', { ...step.config, subject: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
          />
          <textarea
            placeholder="Email Body"
            value={step.config.body_text || ''}
            onChange={(e) => updateStep(index, 'config', { ...step.config, body_text: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
            rows={3}
          />
        </div>
      );
    } else if (step.step_type === 'WAIT') {
      return (
        <div>
          <input
            type="number"
            placeholder="Duration (days)"
            value={step.config.duration_days || 0}
            onChange={(e) => updateStep(index, 'config', { duration_days: parseInt(e.target.value) || 0 })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
          />
        </div>
      );
    } else if (step.step_type === 'SEND_PUSH') {
      return (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Push Title"
            value={step.config.title || ''}
            onChange={(e) => updateStep(index, 'config', { title: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
          />
          <textarea
            placeholder="Push Message"
            value={step.config.message || ''}
            onChange={(e) => updateStep(index, 'config', { message: e.target.value })}
            className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
            rows={2}
          />
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Flows</h1>
          <p className="text-dark-muted">Create multi-step email sequences with delays for campaigns.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Flow</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {flows.map((flow) => {
          const segment = segments.find(s => s.id === flow.segment_id);
          return (
            <div
              key={flow.id}
              className="bg-dark-card border border-dark-border rounded-lg p-6"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold mb-2">{flow.name || 'Unnamed Flow'}</h3>
                  {segment && (
                    <p className="text-sm text-dark-muted mb-2">Segment: {segment.name}</p>
                  )}
                  {flow.entry_condition_type && (
                    <p className="text-xs text-orange-400 mb-1">
                      {ENTRY_CONDITION_TYPES.find(t => t.value === flow.entry_condition_type)?.label || flow.entry_condition_type}
                    </p>
                  )}
                  {flow.entry_condition && (
                    <p className="text-xs text-dark-muted">{flow.entry_condition}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => handleEdit(flow)}
                    className="p-2 hover:bg-dark-border rounded-lg"
                  >
                    <Edit className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(flow.id)}
                    className="p-2 hover:bg-dark-border rounded-lg text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Create Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => {
          setIsCreateModalOpen(false);
          resetForm();
        }}
        title="Create Flow"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Segment</label>
            <select
              value={formData.segment_id}
              onChange={(e) => setFormData({ ...formData, segment_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select a segment</option>
              {segments.map((segment) => (
                <option key={segment.id} value={segment.id}>
                  {segment.name}
                </option>
              ))}
            </select>
            {formData.segment_id && (
              <div className="mt-2">
                <button
                  type="button"
                  onClick={handleGenerateFlowFromSegment}
                  disabled={isGeneratingFlow}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-all shadow-lg shadow-orange-500/20"
                >
                  {isGeneratingFlow ? (
                    <>
                      <span className="animate-spin">⏳</span>
                      <span>Generating Flow...</span>
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      <span>Generate Flow from Segment</span>
                    </>
                  )}
                </button>
                {!isGeneratingFlow && (
                  <p className="text-xs text-orange-400 mt-1 text-center">
                    AI will create flow steps based on segment conditions
                  </p>
                )}
              </div>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Flow Name (Optional)</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Entry Condition Type</label>
            <select
              value={formData.entry_condition_type}
              onChange={(e) => setFormData({ ...formData, entry_condition_type: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select entry condition...</option>
              {ENTRY_CONDITION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Entry Condition Notes (Optional)</label>
            <textarea
              value={formData.entry_condition}
              onChange={(e) => setFormData({ ...formData, entry_condition: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={2}
              placeholder="Additional notes about when users enter this flow..."
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Flow Steps</label>
              <button
                onClick={addStep}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>
            <div className="space-y-3">
              {formData.steps.map((step, index) => {
                const StepIcon = STEP_TYPES.find(t => t.value === step.step_type)?.icon || Mail;
                return (
                  <div key={index} className="bg-dark-border p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StepIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Step {step.step_order}</span>
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={step.step_type}
                      onChange={(e) => updateStep(index, 'step_type', e.target.value)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
                    >
                      {STEP_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {renderStepConfig(step, index)}
                  </div>
                );
              })}
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
              disabled={!formData.segment_id || formData.steps.length === 0}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
            >
              Create Flow
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedFlow(null);
          resetForm();
        }}
        title="Edit Flow"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Flow Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Entry Condition Type</label>
            <select
              value={formData.entry_condition_type}
              onChange={(e) => setFormData({ ...formData, entry_condition_type: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">Select entry condition...</option>
              {ENTRY_CONDITION_TYPES.map(type => (
                <option key={type.value} value={type.value}>{type.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Entry Condition Notes (Optional)</label>
            <textarea
              value={formData.entry_condition}
              onChange={(e) => setFormData({ ...formData, entry_condition: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={2}
            />
          </div>
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-sm font-medium">Flow Steps</label>
              <button
                onClick={addStep}
                className="text-sm text-orange-500 hover:text-orange-400 flex items-center gap-1"
              >
                <Plus className="w-4 h-4" />
                Add Step
              </button>
            </div>
            <div className="space-y-3">
              {formData.steps.map((step, index) => {
                const StepIcon = STEP_TYPES.find(t => t.value === step.step_type)?.icon || Mail;
                return (
                  <div key={index} className="bg-dark-border p-4 rounded-lg space-y-2">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <StepIcon className="w-4 h-4" />
                        <span className="text-sm font-medium">Step {step.step_order}</span>
                      </div>
                      <button
                        onClick={() => removeStep(index)}
                        className="text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                    <select
                      value={step.step_type}
                      onChange={(e) => updateStep(index, 'step_type', e.target.value)}
                      className="w-full px-3 py-2 bg-dark-bg border border-dark-border rounded-lg text-sm"
                    >
                      {STEP_TYPES.map(type => (
                        <option key={type.value} value={type.value}>{type.label}</option>
                      ))}
                    </select>
                    {renderStepConfig(step, index)}
                  </div>
                );
              })}
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-dark-border">
            <button
              onClick={() => {
                setIsEditModalOpen(false);
                setSelectedFlow(null);
                resetForm();
              }}
              className="px-4 py-2 bg-dark-border hover:bg-dark-bg rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleUpdate}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              Update
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
