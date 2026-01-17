import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Send, Sparkles, Copy, Check } from 'lucide-react';
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

interface AiAssistantProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function AiAssistant({ isOpen, onClose }: AiAssistantProps) {
  const navigate = useNavigate();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [copiedSegment, setCopiedSegment] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

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

  const examplePrompts = [
    "I want to improve revenue from high lifetime value customers that haven't purchased recently",
    "Create a segment for customers in Texas who spend more than $500",
    "Target customers who haven't ordered in the last 60 days",
    "Segment for VIP customers who are subscribed to email marketing",
  ];

  return (
    <>
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40"
          onClick={onClose}
        />
      )}
      <div
        className={`fixed right-0 top-0 h-full w-96 bg-dark-card border-l border-dark-border z-50 transform transition-transform duration-300 ${
          isOpen ? 'translate-x-0' : 'translate-x-full'
        } flex flex-col`}
      >
        <div className="p-4 border-b border-dark-border flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-orange-500" />
            <h2 className="text-lg font-semibold">AI Assistant</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-dark-border rounded-lg"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-2">
              <p className="text-dark-muted text-sm">Try these example prompts:</p>
              {examplePrompts.map((prompt, idx) => (
                <button
                  key={idx}
                  onClick={() => setInput(prompt)}
                  className="w-full text-left p-3 bg-dark-border rounded-lg hover:bg-dark-bg text-sm"
                >
                  {prompt}
                </button>
              ))}
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
                      onClose();
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

          <div ref={messagesEndRef} />
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
    </>
  );
}
