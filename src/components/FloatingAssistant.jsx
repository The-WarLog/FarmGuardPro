import React, { useState } from 'react';
import { Sparkles, X, ArrowRight, Send } from 'lucide-react';
import { queryFreeChatbot } from '../services/chatApi';

const FloatingAssistant = ({ language, setActiveTab, setChatInput }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [quickQuestion, setQuickQuestion] = useState('');
  const [quickAnswer, setQuickAnswer] = useState('');
  const [quickLoading, setQuickLoading] = useState(false);
  const [quickError, setQuickError] = useState('');

  const quickPrompts = [
    {
      en: 'How do I stop leaf blight quickly?',
      hi: 'पत्ती ब्लाइट को जल्दी कैसे रोकें?'
    },
    {
      en: 'Give me organic treatment options',
      hi: 'मुझे जैविक उपचार विकल्प बताएं'
    }
  ];

  const openChatbot = (presetMessage = '') => {
    if (presetMessage && setChatInput) {
      setChatInput(presetMessage);
    }
    setActiveTab('chatbot');
    setIsOpen(false);
  };

  const askFreeChatApi = async (message) => {
    if (!message.trim()) return;

    setQuickLoading(true);
    setQuickError('');

    try {
      const { reply } = await queryFreeChatbot(message);
      setQuickAnswer(reply);
    } catch (error) {
      setQuickError(
        language === 'hindi'
          ? 'फ्री API से उत्तर नहीं मिला। कृपया Full Chatbot खोलें।'
          : 'Could not get a reply from free API. Please open Full Chatbot.'
      );
      setQuickAnswer('');
    } finally {
      setQuickLoading(false);
    }
  };

  const handleQuickAskSubmit = async (e) => {
    e.preventDefault();
    await askFreeChatApi(quickQuestion);
  };

  const handleQuickPrompt = async (prompt) => {
    setQuickQuestion(prompt);
    await askFreeChatApi(prompt);
  };

  return (
    <div className="fixed bottom-6 right-5 z-50 md:bottom-8 md:right-8">
      {isOpen && (
        <div className="relative mb-4 w-[300px] sm:w-[360px] animate-in slide-in-from-bottom-4 fade-in duration-300">
          <div className="absolute -inset-1 rounded-3xl bg-gradient-to-r from-emerald-400/30 via-teal-300/25 to-lime-300/30 blur-md" />
          <div className="relative overflow-hidden rounded-3xl border border-emerald-100/90 bg-white/95 p-5 shadow-[0_18px_45px_rgba(16,185,129,0.20)] backdrop-blur-md">
            <div className="pointer-events-none absolute -top-14 -right-12 h-40 w-40 rounded-full bg-emerald-100/70 blur-2xl" />
            <div className="pointer-events-none absolute -bottom-16 -left-12 h-36 w-36 rounded-full bg-teal-100/60 blur-2xl" />

            <div className="relative mb-4 flex items-start justify-between gap-3">
              <div>
                <p className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-emerald-700">
                  <Sparkles className="h-3 w-3" />
                  {language === 'hindi' ? 'AI सहायक' : 'AI Assistant'}
                </p>
                <h4 className="mt-2 text-lg font-bold text-slate-900 tracking-tight">
                  {language === 'hindi' ? 'फार्मगार्ड हेल्प डेस्क' : 'FarmGuard Help Desk'}
                </h4>
                <p className="mt-1 text-sm leading-relaxed text-slate-600">
                  {language === 'hindi'
                    ? 'किसी भी फसल रोग या इलाज के बारे में पूछें।'
                    : 'Ask about crop disease symptoms or treatment.'}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsOpen(false)}
                className="rounded-xl border border-slate-200 bg-white/80 p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700"
                aria-label={language === 'hindi' ? 'बंद करें' : 'Close'}
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="relative mb-4 space-y-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => handleQuickPrompt(prompt[language === 'hindi' ? 'hi' : 'en'])}
                  className="w-full rounded-xl border border-emerald-200 bg-gradient-to-r from-emerald-50 to-lime-50 px-3 py-2.5 text-left text-sm font-medium text-emerald-800 transition hover:-translate-y-0.5 hover:border-emerald-300 hover:from-emerald-100 hover:to-lime-100"
                >
                  {prompt[language === 'hindi' ? 'hi' : 'en']}
                </button>
              ))}
            </div>

            <form onSubmit={handleQuickAskSubmit} className="mb-3 rounded-xl border border-emerald-100 bg-emerald-50/60 p-3">
              <label className="mb-2 block text-xs font-semibold text-emerald-800">
                {language === 'hindi' ? 'फ्री AI API से तुरंत जवाब' : 'Instant Reply with Free AI API'}
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={quickQuestion}
                  onChange={(e) => setQuickQuestion(e.target.value)}
                  placeholder={language === 'hindi' ? 'अपना सवाल लिखें...' : 'Ask your question...'}
                  className="w-full rounded-lg border border-emerald-200 bg-white px-3 py-2 text-sm text-slate-700 outline-none focus:border-emerald-400 focus:ring-2 focus:ring-emerald-100"
                />
                <button
                  type="submit"
                  disabled={quickLoading || !quickQuestion.trim()}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-lg bg-emerald-600 text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
                  aria-label={language === 'hindi' ? 'भेजें' : 'Send'}
                >
                  <Send className="h-4 w-4" />
                </button>
              </div>

              {quickLoading && (
                <p className="mt-2 text-xs text-emerald-700">
                  {language === 'hindi' ? 'उत्तर तैयार हो रहा है...' : 'Generating reply...'}
                </p>
              )}

              {quickError && (
                <p className="mt-2 text-xs text-red-600">{quickError}</p>
              )}

              {quickAnswer && !quickLoading && !quickError && (
                <div className="mt-2 rounded-lg border border-emerald-200 bg-white p-2.5">
                  <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">
                    {language === 'hindi' ? 'AI उत्तर' : 'AI Reply'}
                  </p>
                  <p className="mt-1 text-sm text-slate-700">{quickAnswer}</p>
                </div>
              )}
            </form>

            <button
              type="button"
              onClick={() => openChatbot()}
              className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-emerald-500 via-green-500 to-teal-500 px-3 py-2.5 text-sm font-semibold text-white shadow-md transition hover:from-emerald-600 hover:via-green-600 hover:to-teal-600"
            >
              {language === 'hindi' ? 'पूरा चैटबॉट खोलें' : 'Open Full Chatbot'}
              <ArrowRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center gap-2">
        <span className="hidden rounded-full bg-blue-700 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wide text-white shadow-lg md:inline-block">
          {language === 'hindi' ? 'मदद चाहिए? AI से पूछें' : 'Need Help? Ask AI'}
        </span>
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="group relative inline-flex h-16 w-16 items-center justify-center rounded-full border-4 border-white bg-gradient-to-b from-emerald-100 to-emerald-300 shadow-[0_10px_28px_rgba(15,23,42,0.30)] transition hover:-translate-y-0.5 hover:shadow-[0_14px_30px_rgba(15,23,42,0.35)]"
          aria-label={language === 'hindi' ? 'सहायक खोलें' : 'Open assistant'}
        >
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-300/35" />
          <span className="relative text-3xl" role="img" aria-label={language === 'hindi' ? 'किसान सहायक' : 'Farmer assistant'}>
            👨‍🌾
          </span>
          <span className="absolute bottom-1 right-1 h-3 w-3 rounded-full border-2 border-white bg-green-500" />
        </button>
      </div>
    </div>
  );
};

export default FloatingAssistant;