// ChatbotTab.jsx
import React, { useEffect, useRef } from 'react';
import { MessageCircle, Send, Bot, User, MapPin } from 'lucide-react';

const renderInlineFormatting = (text) => {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, index) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return <strong key={index}>{part.slice(2, -2)}</strong>;
    }
    return <React.Fragment key={index}>{part}</React.Fragment>;
  });
};

const renderMessageContent = (text) => {
  if (!text || typeof text !== 'string') {
    return null;
  }

  const lines = text
    .split('\n')
    .map((line) => line.trim())
    .filter((line) => line.length > 0);

  const nodes = [];
  let bulletItems = [];
  let numberedItems = [];

  const flushBulletItems = () => {
    if (!bulletItems.length) return;
    nodes.push(
      <ul key={`bullets-${nodes.length}`} className="list-disc space-y-1 pl-5">
        {bulletItems.map((item, idx) => (
          <li key={idx}>{renderInlineFormatting(item)}</li>
        ))}
      </ul>
    );
    bulletItems = [];
  };

  const flushNumberedItems = () => {
    if (!numberedItems.length) return;
    nodes.push(
      <ol key={`numbers-${nodes.length}`} className="list-decimal space-y-1 pl-5">
        {numberedItems.map((item, idx) => (
          <li key={idx}>{renderInlineFormatting(item)}</li>
        ))}
      </ol>
    );
    numberedItems = [];
  };

  lines.forEach((line) => {
    const bulletMatch = line.match(/^[-*]\s+(.*)$/);
    const numberedMatch = line.match(/^\d+\.\s+(.*)$/);

    if (bulletMatch) {
      flushNumberedItems();
      bulletItems.push(bulletMatch[1]);
      return;
    }

    if (numberedMatch) {
      flushBulletItems();
      numberedItems.push(numberedMatch[1]);
      return;
    }

    flushBulletItems();
    flushNumberedItems();
    nodes.push(
      <p key={`p-${nodes.length}`} className="leading-relaxed">
        {renderInlineFormatting(line)}
      </p>
    );
  });

  flushBulletItems();
  flushNumberedItems();

  return <div className="space-y-2">{nodes}</div>;
};

const ChatbotTab = ({
  currentTexts,
  chatMessages,
  chatInput,
  setChatInput,
  handleChatSubmit,
  chatLocation,
  locationStatus,
  requestLocationAccess,
}) => {
  const quickQuestions = [
    'What are symptoms of leaf blight?',
    'How to prevent powdery mildew?',
    'Best fungicides for crops?',
    'Organic disease control methods?'
  ];

  const listRef = useRef(null);
  const isPending = chatMessages.some((m) => m.pending);
  const locationLabel =
    locationStatus === 'granted'
      ? 'Location shared with chatbot'
      : locationStatus === 'loading'
        ? 'Fetching location...'
        : locationStatus === 'denied'
          ? 'Location permission denied'
          : locationStatus === 'unsupported'
            ? 'Location not supported in this browser'
            : 'Share location for local advice';

  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [chatMessages]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-xl border border-blue-100 overflow-hidden">
        <div className="bg-gradient-to-r from-blue-500 to-teal-500 p-4">
          <h2 className="text-xl font-bold text-white flex items-center tracking-tight">
            <MessageCircle className="h-6 w-6 mr-2" />
            Agricultural Assistant Chatbot
          </h2>
        </div>
        
        <div ref={listRef} className="h-96 overflow-y-auto p-4 space-y-4 bg-gray-50">
          {chatMessages.map((message, index) => (
            <div key={index} className={`flex items-end ${message.type === 'user' ? 'justify-end' : 'justify-start'}`}>
              {message.type !== 'user' && (
                <div className="mr-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-blue-700">
                  <Bot className="h-4 w-4" />
                </div>
              )}
              <div className={`max-w-xs lg:max-w-md px-4 py-2 rounded-2xl shadow-sm ${message.type === 'user' ? 'bg-blue-500 text-white rounded-br-sm' : 'bg-white text-gray-800 border border-gray-200 rounded-bl-sm'}`}>
                {message.pending ? (
                  <div className="flex items-center gap-2">
                    <span className="inline-flex gap-1">
                      <span className="block h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.2s]"></span>
                      <span className="block h-2 w-2 rounded-full bg-gray-400 animate-bounce [animation-delay:-0.1s]"></span>
                      <span className="block h-2 w-2 rounded-full bg-gray-400 animate-bounce"></span>
                    </span>
                    <span className="text-xs opacity-70">Typing...</span>
                  </div>
                ) : (
                  <>
                    <div className="text-sm">{renderMessageContent(message.text)}</div>
                    {message.type === 'bot' && message.provider && (
                      <p className="mt-1 text-[10px] font-medium uppercase tracking-wide text-teal-600">
                        Source: {message.provider}
                      </p>
                    )}
                    <p className="text-[10px] opacity-70 mt-1">{new Date(message.timestamp).toLocaleTimeString()}</p>
                  </>
                )}
              </div>
              {message.type === 'user' && (
                <div className="ml-2 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white">
                  <User className="h-4 w-4" />
                </div>
              )}
            </div>
          ))}
        </div>
        
        <form onSubmit={handleChatSubmit} className="p-4 bg-white border-t border-gray-200">
          <div className="mb-3 flex items-center justify-between gap-3">
            <p className="text-xs text-gray-600">{locationLabel}</p>
            <button
              type="button"
              onClick={requestLocationAccess}
              className="inline-flex items-center gap-1 rounded-md border border-blue-200 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-50"
              disabled={locationStatus === 'loading'}
            >
              <MapPin className="h-3.5 w-3.5" />
              {chatLocation ? 'Update Location' : 'Use My Location'}
            </button>
          </div>
          <div className="flex space-x-3">
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="Type your question here..."
              className="input flex-1"
            />
            <button type="submit" className="btn-primary disabled:opacity-60 disabled:cursor-not-allowed" disabled={isPending || !chatInput.trim()} aria-label="Send message">
              <Send className="h-5 w-5" />
            </button>
          </div>
        </form>
      </div>

      <div className="mt-6 bg-white rounded-xl shadow-lg p-6 border border-blue-100">
        <h3 className="text-lg font-semibold mb-4">Quick Questions</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {quickQuestions.map((question, index) => (
            <button
              key={index}
              onClick={() => setChatInput(question)}
              className="chip"
            >
              {question}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ChatbotTab;
