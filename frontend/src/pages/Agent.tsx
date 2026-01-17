import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, Send, Copy, Check } from 'lucide-react';
import api from '../api';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  data?: {
    segment_description?: string;
    campaign?: any;
    explanation?: string;
  };
}

export default function Agent() {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSegment, setCopiedSegment] = useState<string | null>(null);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: 'user', content: input };
    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await api.post('/ai/chat', {
        prompt: input,
      });

      const data = response.data;
      
      // Store the full data for copy functionality
      const messageData = {
        segment_description: data.segment_description,
        campaign: data.campaign,
        explanation: data.explanation,
      };
      
      // Format the structured response
      let content = '';
      
      if (data.segment_description) {
        content += `**Segment Description:**\n${data.segment_description}\n\n`;
      }
      
      if (data.campaign) {
        content += `**Campaign Details:**\n`;
        content += `**Subject:** ${data.campaign.subject || 'Not specified'}\n`;
        content += `**Send-Time:** ${data.campaign.send_time || 'Not specified'}\n`;
        content += `**Send-Date:** ${data.campaign.send_date || 'Not specified'}\n\n`;
        
        if (data.campaign.content_ideas && data.campaign.content_ideas.length > 0) {
          content += `**Content Ideas:**\n`;
          data.campaign.content_ideas.forEach((idea: string, index: number) => {
            content += `${index + 1}. ${idea}\n`;
          });
          content += `\n`;
        }
      }
      
      if (data.explanation) {
        content += `**Explanation:**\n${data.explanation}`;
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: content || 'I can provide suggestions on segments, campaigns, and flows. What would you like help with?',
        data: messageData, // Store structured data
      };

      setMessages(prev => [...prev, assistantMessage]);
    } catch (error) {
      const errorMessage: Message = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">AI Agent</h1>
        <p className="text-dark-muted">Generate segment descriptions and campaign details using natural language. Copy the segment description to use in segment creation.</p>
      </div>

      <div className="bg-dark-card border border-dark-border rounded-lg h-[600px] flex flex-col">
        <div className="p-4 border-b border-dark-border flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-orange-500" />
          <h2 className="text-lg font-semibold">AI Assistant</h2>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="text-center py-12 text-dark-muted">
              <Sparkles className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>Start a conversation to generate campaigns and segments</p>
            </div>
          )}

          {messages.map((message, idx) => (
            <div
              key={idx}
              className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-[80%] p-3 rounded-lg ${
                  message.role === 'user'
                    ? 'bg-orange-600 text-white'
                    : 'bg-dark-border text-dark-text'
                }`}
              >
                <p className="text-sm whitespace-pre-wrap">{message.content}</p>
                {message.role === 'assistant' && message.data?.segment_description && (
                  <button
                    onClick={() => {
                      // Navigate to segments page with description in state
                      navigate('/segments', { 
                        state: { 
                          createSegment: true, 
                          description: message.data.segment_description 
                        } 
                      });
                    }}
                    className="mt-2 flex items-center gap-1 px-2 py-1 text-xs bg-green-600 hover:bg-green-700 rounded text-white"
                  >
                    <span>Create Segment with This Description</span>
                  </button>
                )}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex justify-start">
              <div className="bg-dark-border p-3 rounded-lg">
                <p className="text-sm text-dark-muted">Thinking...</p>
              </div>
            </div>
          )}
        </div>

        <div className="p-4 border-t border-dark-border">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSend()}
              placeholder="Ask me anything..."
              className="flex-1 px-4 py-2 bg-dark-border border border-dark-border rounded-lg focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-4 py-2 bg-gradient-to-r from-orange-600 to-orange-500 hover:from-orange-700 hover:to-orange-600 disabled:opacity-50 disabled:cursor-not-allowed rounded-lg transition-all shadow-lg shadow-orange-500/20"
            >
              <Send className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
