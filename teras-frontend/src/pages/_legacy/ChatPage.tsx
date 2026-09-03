import { useState, useEffect } from 'react';
import { Button } from '../components/Button';
import { Send, Sparkles, TrendingUp, FileText, Bot, User, RotateCcw, Lightbulb, Clock } from 'lucide-react';

export function ChatPage({ onNavigate }: { onNavigate?: (page: string) => void }) {
  const [messages, setMessages] = useState([
    {
      id: '1',
      role: 'assistant',
      content: "Bonjour ! Je suis votre assistant TERAS IA. Comment puis-je vous aider aujourd'hui ?"
    }
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const quickActions = [
    { label: 'Analyser mon score', icon: TrendingUp, prompt: 'Analyser mon score' },
    { label: 'Comment améliorer', icon: Lightbulb, prompt: 'Comment améliorer mon score ?' },
    { label: 'Documents manquants', icon: FileText, prompt: 'Quels documents manquent ?' }
  ];

  useEffect(() => {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = (content?: string) => {
    const messageContent = content || inputValue.trim();
    if (!messageContent) return;

    setMessages(prev => [...prev, {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent
    }]);
    setInputValue('');
    setIsTyping(true);

    setTimeout(() => {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: "Votre score TERAS de 765 est excellent ! Continuez vos bons comportements financiers."
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: '#0B1220' }}>
      <div className="border-b" style={{ backgroundColor: '#0F172A', borderColor: '#223556' }}>
        <div className="max-w-[1400px] mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center w-12 h-12 rounded-xl" style={{ backgroundColor: '#223556' }}>
                <Sparkles className="w-6 h-6" style={{ color: '#9BD2FF' }} />
              </div>
              <div>
                <h1 className="text-[24px] mb-1" style={{ color: '#EAF2FF', fontWeight: '700' }}>
                  Assistant TERAS IA
                </h1>
                <p className="text-[14px]" style={{ color: '#9CB5DD' }}>
                  Conseils personnalisés pour améliorer votre score
                </p>
              </div>
            </div>
            <Button variant="secondary" onClick={() => onNavigate?.('dashboard')}>
              Retour au dashboard
            </Button>
          </div>
        </div>
      </div>

      <div className="max-w-[1200px] mx-auto px-6 py-8">
        <div className="rounded-xl border flex flex-col" style={{ backgroundColor: '#0F172A', borderColor: '#223556', height: 'calc(100vh - 280px)' }}>
          <div id="chat-messages" className="flex-1 p-6 overflow-y-auto">
            <div className="space-y-6">
              {messages.map((message) => (
                <div key={message.id} className={`flex gap-4 ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  <div 
                    className="flex items-center justify-center w-10 h-10 rounded-full flex-shrink-0"
                    style={{ 
                      backgroundColor: message.role === 'assistant' ? '#223556' : '#9BD2FF15',
                      border: `2px solid ${message.role === 'assistant' ? '#9BD2FF' : '#9BD2FF50'}`
                    }}
                  >
                    {message.role === 'assistant' ? (
                      <Bot className="w-5 h-5" style={{ color: '#9BD2FF' }} />
                    ) : (
                      <User className="w-5 h-5" style={{ color: '#9BD2FF' }} />
                    )}
                  </div>
                  <div className="p-4 rounded-xl max-w-[70%]" style={{
                    backgroundColor: message.role === 'assistant' ? '#223556' : '#9BD2FF15',
                    border: `1px solid ${message.role === 'assistant' ? '#9BD2FF30' : '#9BD2FF50'}`
                  }}>
                    <p className="text-[15px]" style={{ color: '#EAF2FF' }}>
                      {message.content}
                    </p>
                  </div>
                </div>
              ))}
              {isTyping && (
                <div className="flex gap-4">
                  <div className="flex items-center justify-center w-10 h-10 rounded-full" style={{ backgroundColor: '#223556', border: '2px solid #9BD2FF' }}>
                    <Bot className="w-5 h-5" style={{ color: '#9BD2FF' }} />
                  </div>
                  <div className="p-4 rounded-xl" style={{ backgroundColor: '#223556', border: '1px solid #9BD2FF30' }}>
                    <div className="flex gap-1">
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#9BD2FF' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#9BD2FF', animationDelay: '150ms' }} />
                      <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#9BD2FF', animationDelay: '300ms' }} />
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="px-6 py-4 border-t" style={{ borderColor: '#223556' }}>
            <div className="flex gap-2 overflow-x-auto pb-2 mb-4">
              {quickActions.map((action, i) => {
                const IconComponent = action.icon;
                return (
                  <button
                    key={i}
                    className="flex items-center gap-2 px-4 py-2 rounded-lg text-[13px] whitespace-nowrap hover:opacity-80 transition-opacity"
                    style={{ backgroundColor: '#223556', color: '#9BD2FF', border: '1px solid #9BD2FF30' }}
                    onClick={() => handleSendMessage(action.prompt)}
                  >
                    <IconComponent className="w-4 h-4" />
                    {action.label}
                  </button>
                );
              })}
            </div>
            <div className="flex gap-3">
              <div className="flex-1 relative">
                <textarea
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage();
                    }
                  }}
                  placeholder="Posez votre question sur votre score TERAS..."
                  className="w-full min-h-[56px] max-h-[120px] resize-none pr-12 p-4 rounded-xl border outline-none"
                  style={{
                    backgroundColor: '#223556',
                    borderColor: '#9BD2FF30',
                    color: '#EAF2FF'
                  }}
                />
                <button
                  className="absolute right-3 bottom-3 p-2 rounded-lg hover:opacity-80 transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: '#9BD2FF', color: '#0B1220' }}
                  onClick={() => handleSendMessage()}
                  disabled={!inputValue.trim() || isTyping}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
