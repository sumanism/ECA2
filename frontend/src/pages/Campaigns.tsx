import { useState, useEffect } from 'react';
import { Plus, Edit, Trash2, Workflow, Play, Pause, Sparkles, Layers } from 'lucide-react';
import api from '../api';
import Modal from '../components/Modal';

interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: string;
  segment_id: string;
  flow_id?: string;
  start_time?: string;
  start_date?: string;
  start_time_of_day?: string;
  created_at: string;
}

interface Segment {
  id: string;
  name: string;
  description?: string;
}

interface Flow {
  id: string;
  segment_id: string;
  name?: string;
  entry_condition_type?: string;
}

export default function Campaigns() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [segments, setSegments] = useState<Segment[]>([]);
  const [flows, setFlows] = useState<Flow[]>([]);
  const [loading, setLoading] = useState(true);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    segment_id: '',
    flow_id: '',
    status: 'draft',
    start_time: '',
    start_date: '',
    start_time_of_day: '',
  });
  const [aiGenerating, setAiGenerating] = useState(false);

  useEffect(() => {
    fetchCampaigns();
    fetchSegments();
    fetchFlows();
  }, []);

  const fetchCampaigns = async () => {
    try {
      const response = await api.get('/campaigns/');
      setCampaigns(response.data);
    } catch (error) {
      console.error('Error fetching campaigns:', error);
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

  const fetchFlows = async () => {
    try {
      const response = await api.get('/flows/');
      setFlows(response.data);
    } catch (error) {
      console.error('Error fetching flows:', error);
    }
  };

  const handleGenerateCampaign = async () => {
    if (!formData.segment_id) {
      alert('Please select a segment first');
      return;
    }

    setAiGenerating(true);
    try {
      const response = await api.post('/ai/campaigns/generate', {
        segment_id: formData.segment_id,
        flow_id: formData.flow_id || undefined,
      });
      
      const generated = response.data;
      
      // Auto-fill campaign details (only time, not date - user selects date manually)
      setFormData(prev => ({
        ...prev,
        name: generated.name || prev.name,
        description: generated.description || prev.description,
        // start_date is NOT auto-filled - user selects manually
        start_time_of_day: generated.start_time_of_day || prev.start_time_of_day,
      }));
      
      // Show time recommendation reason if available
      if (generated.time_recommendation_reason) {
        console.log('Time recommendation:', generated.start_time_of_day);
        console.log('Reason:', generated.time_recommendation_reason);
      }
    } catch (error: any) {
      console.error('Error generating campaign details:', error);
      const errorMessage = error.response?.data?.detail || error.message || 'Unknown error occurred';
      alert(`Error generating campaign: ${errorMessage}`);
    } finally {
      setAiGenerating(false);
    }
  };

  const handleCreate = async () => {
    try {
      await api.post('/campaigns/', {
        ...formData,
        flow_id: formData.flow_id || undefined,
        start_time: formData.start_time || undefined,
        start_date: formData.start_date || undefined,
        start_time_of_day: formData.start_time_of_day || undefined,
      });
      setIsCreateModalOpen(false);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Error creating campaign');
    }
  };

  const resetForm = () => {
    setFormData({ 
      name: '', 
      description: '',
      segment_id: '', 
      flow_id: '',
      status: 'draft', 
      start_time: '',
      start_date: '',
      start_time_of_day: '',
    });
  };

  const handleEdit = (campaign: Campaign) => {
    setSelectedCampaign(campaign);
    setFormData({
      name: campaign.name,
      description: campaign.description || '',
      segment_id: campaign.segment_id,
      flow_id: campaign.flow_id || '',
      status: campaign.status,
      start_time: campaign.start_time ? new Date(campaign.start_time).toISOString().slice(0, 16) : '',
      start_date: campaign.start_date || '',
      start_time_of_day: campaign.start_time_of_day || '',
    });
    setIsEditModalOpen(true);
  };

  const handleUpdate = async () => {
    if (!selectedCampaign) return;
    try {
      await api.put(`/campaigns/${selectedCampaign.id}`, {
        name: formData.name,
        description: formData.description,
        flow_id: formData.flow_id || undefined,
        status: formData.status,
        start_time: formData.start_time || undefined,
        start_date: formData.start_date || undefined,
        start_time_of_day: formData.start_time_of_day || undefined,
      });
      setIsEditModalOpen(false);
      setSelectedCampaign(null);
      resetForm();
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign:', error);
      alert('Error updating campaign');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this campaign?')) return;
    try {
      await api.delete(`/campaigns/${id}`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error deleting campaign:', error);
      alert('Error deleting campaign');
    }
  };

  const handleStatusChange = async (campaignId: string, newStatus: string) => {
    try {
      await api.put(`/campaigns/${campaignId}/status?status=${newStatus}`);
      fetchCampaigns();
    } catch (error) {
      console.error('Error updating campaign status:', error);
      alert('Error updating campaign status');
    }
  };

  if (loading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold mb-2">Campaigns</h1>
          <p className="text-dark-muted">Create campaigns to communicate with customer segments.</p>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg transition-all shadow-lg shadow-orange-500/20"
        >
          <Plus className="w-4 h-4" />
          <span>New Campaign</span>
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {campaigns.map((campaign) => {
          const segment = segments.find(s => s.id === campaign.segment_id);
          const flow = flows.find(f => f.id === campaign.flow_id);
          return (
          <div
            key={campaign.id}
            className="bg-dark-card border border-dark-border rounded-lg p-6"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex-1">
                <h3 className="text-lg font-semibold">{campaign.name}</h3>
                {campaign.description && (
                  <p className="text-sm text-dark-muted mt-1">{campaign.description}</p>
                )}
                <div className="flex items-center gap-3 mt-2 text-xs">
                  {segment && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Layers className="w-3 h-3" />
                      <span>{segment.name}</span>
                    </div>
                  )}
                  {flow && (
                    <div className="flex items-center gap-1 text-orange-400">
                      <Workflow className="w-3 h-3" />
                      <span>{flow.name || 'Flow'}</span>
                    </div>
                  )}
                </div>
                {(campaign.start_date || campaign.start_time) && (
                  <p className="text-xs text-dark-muted mt-2">
                    Start: {campaign.start_date 
                      ? `${campaign.start_date}${campaign.start_time_of_day ? ` at ${campaign.start_time_of_day}` : ''}`
                      : campaign.start_time 
                        ? new Date(campaign.start_time).toLocaleDateString()
                        : 'Not scheduled'}
                  </p>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(campaign)}
                  className="p-2 hover:bg-dark-border rounded-lg"
                >
                  <Edit className="w-4 h-4" />
                </button>
                <button
                  onClick={() => handleDelete(campaign.id)}
                  className="p-2 hover:bg-dark-border rounded-lg text-red-500"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span
                  className={`px-2 py-1 rounded-full text-xs font-medium ${
                    campaign.status === 'active'
                      ? 'bg-green-500/20 text-green-500'
                      : campaign.status === 'paused'
                      ? 'bg-yellow-500/20 text-yellow-500'
                      : campaign.status === 'completed'
                      ? 'bg-orange-500/20 text-orange-500'
                      : 'bg-gray-500/20 text-gray-400'
                  }`}
                >
                  {campaign.status.toUpperCase()}
                </span>
                {flow && (
                  <a
                    href={`/flows`}
                    className="flex items-center gap-1 text-sm text-orange-500 hover:text-orange-400"
                  >
                    <Workflow className="w-4 h-4" />
                    <span>View Flow</span>
                  </a>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleStatusChange(campaign.id, 'active')}
                  disabled={campaign.status === 'draft' || campaign.status === 'completed'}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                >
                  <Play className="w-4 h-4" />
                  <span>Activate</span>
                </button>
                <button
                  onClick={() => handleStatusChange(campaign.id, 'paused')}
                  disabled={campaign.status === 'draft' || campaign.status === 'completed' || campaign.status === 'paused'}
                  className="flex-1 flex items-center justify-center gap-2 px-3 py-2 bg-yellow-600 hover:bg-yellow-700 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm transition-colors"
                >
                  <Pause className="w-4 h-4" />
                  <span>Pause</span>
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
        title="Create Campaign"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Segment *</label>
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
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Flow (Optional)</label>
            <select
              value={formData.flow_id}
              onChange={(e) => {
                const selectedFlowId = e.target.value;
                // Filter flows to only show flows for the selected segment
                setFormData({ ...formData, flow_id: selectedFlowId });
              }}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">No flow (select segment first)</option>
              {formData.segment_id && flows
                .filter(f => f.segment_id === formData.segment_id)
                .map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name || 'Unnamed Flow'}
                  </option>
                ))}
            </select>
            {formData.segment_id && flows.filter(f => f.segment_id === formData.segment_id).length === 0 && (
              <p className="text-xs text-yellow-400 mt-1">
                No flows available for this segment. Create a flow first.
              </p>
            )}
          </div>
          {formData.segment_id && (
            <div>
              <button
                type="button"
                onClick={handleGenerateCampaign}
                disabled={aiGenerating}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-orange-500/20"
              >
                {aiGenerating ? (
                  <>
                    <span className="animate-spin">⏳</span>
                    <span>Generating Campaign Details...</span>
                  </>
                ) : (
                  <>
                    <Sparkles className="w-4 h-4" />
                    <span>Generate Campaign Name, Description & Optimal Time</span>
                  </>
                )}
              </button>
              <p className="text-xs text-orange-400 mt-1 text-center">
                AI will generate campaign name, description, and recommend optimal send time based on marketing strategy
              </p>
            </div>
          )}
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              placeholder="e.g., Welcome Campaign"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Description</label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
              rows={3}
              placeholder="Campaign description and strategy..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Launch Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
              <p className="text-xs text-dark-muted mt-1">Select the date when you want to launch this campaign</p>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Optimal Send Time (AI Recommended)</label>
              <div className="flex gap-2">
                <input
                  type="time"
                  value={formData.start_time_of_day}
                  onChange={(e) => setFormData({ ...formData, start_time_of_day: e.target.value })}
                  className="flex-1 px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                  placeholder="HH:MM"
                />
                {formData.segment_id && (
                  <button
                    type="button"
                    onClick={handleGenerateCampaign}
                    disabled={aiGenerating}
                    className="px-3 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg text-sm whitespace-nowrap transition-all"
                    title="Get AI-recommended optimal send time based on marketing strategy"
                  >
                    {aiGenerating ? '...' : 'Get Time'}
                  </button>
                )}
              </div>
              <p className="text-xs text-orange-400 mt-1">
                {formData.segment_id 
                  ? "Click 'Get Time' to get AI-recommended optimal send time based on your segment and marketing strategy"
                  : "Select a segment first to get AI time recommendations"}
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-dark-border">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="px-4 py-2 bg-dark-border hover:bg-dark-bg rounded-lg"
            >
              Cancel
            </button>
            <button
              onClick={handleCreate}
              disabled={!formData.name || !formData.segment_id}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg shadow-orange-500/20"
            >
              Create Campaign
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Modal */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setSelectedCampaign(null);
          resetForm();
        }}
        title="Edit Campaign"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-2">Campaign Name</label>
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
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Flow (Optional)</label>
            <select
              value={formData.flow_id}
              onChange={(e) => setFormData({ ...formData, flow_id: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="">No flow</option>
              {flows
                .filter(f => f.segment_id === selectedCampaign?.segment_id)
                .map((flow) => (
                  <option key={flow.id} value={flow.id}>
                    {flow.name || 'Unnamed Flow'}
                  </option>
                ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-2">Status</label>
            <select
              value={formData.status}
              onChange={(e) => setFormData({ ...formData, status: e.target.value })}
              className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            >
              <option value="draft">Draft</option>
              <option value="active">Active</option>
              <option value="paused">Paused</option>
              <option value="completed">Completed</option>
            </select>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Campaign Launch Date *</label>
              <input
                type="date"
                value={formData.start_date}
                onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Optimal Send Time</label>
              <input
                type="time"
                value={formData.start_time_of_day}
                onChange={(e) => setFormData({ ...formData, start_time_of_day: e.target.value })}
                className="w-full px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
                placeholder="HH:MM"
              />
              <p className="text-xs text-dark-muted mt-1">Recommended time based on marketing strategy</p>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4 border-t border-dark-border">
            <button
              onClick={() => setIsEditModalOpen(false)}
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
