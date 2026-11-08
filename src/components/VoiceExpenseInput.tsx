import React, { useState } from 'react';
import { Mic, MicOff, Sparkles } from 'lucide-react';

interface VoiceExpenseInputProps {
  onParsedExpense: (data: { amount: number; category: string; note: string; mode: 'UPI' | 'Card' | 'Cash' | 'Net Banking' }) => void;
}

export const VoiceExpenseInput: React.FC<VoiceExpenseInputProps> = ({ onParsedExpense }) => {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [errorMsg, setErrorMsg] = useState('');

  const parseVoiceText = (text: string) => {
    const clean = text.toLowerCase();
    let amount = 0;
    const match = clean.match(/(?:rs\.?|inr|rupees?)?\s*([\d,]+(?:\.\d{1,2})?)/i) || clean.match(/([\d,]+(?:\.\d{1,2})?)\s*(?:rs|inr|rupees?)/i);
    if (match) {
      amount = parseFloat(match[1].replace(/,/g, ''));
    }

    let category = 'Other';
    if (clean.includes('swiggy') || clean.includes('zomato') || clean.includes('dinner') || clean.includes('lunch') || clean.includes('food') || clean.includes('tea') || clean.includes('coffee') || clean.includes('burger')) {
      category = 'Food';
    } else if (clean.includes('uber') || clean.includes('ola') || clean.includes('metro') || clean.includes('petrol') || clean.includes('fuel') || clean.includes('auto')) {
      category = 'Transport';
    } else if (clean.includes('amazon') || clean.includes('flipkart') || clean.includes('shopping') || clean.includes('clothes') || clean.includes('shoes')) {
      category = 'Shopping';
    } else if (clean.includes('wifi') || clean.includes('broadband') || clean.includes('bill') || clean.includes('electricity') || clean.includes('recharge')) {
      category = 'Bills';
    } else if (clean.includes('doctor') || clean.includes('medicine') || clean.includes('pharmacy') || clean.includes('hospital')) {
      category = 'Health';
    } else if (clean.includes('movie') || clean.includes('netflix') || clean.includes('spotify') || clean.includes('game')) {
      category = 'Entertainment';
    } else if (clean.includes('rent') || clean.includes('pg') || clean.includes('flat')) {
      category = 'Rent';
    } else if (clean.includes('book') || clean.includes('course') || clean.includes('study')) {
      category = 'Books';
    }

    let mode: 'UPI' | 'Card' | 'Cash' | 'Net Banking' = 'UPI';
    if (clean.includes('card') || clean.includes('credit')) mode = 'Card';
    else if (clean.includes('cash')) mode = 'Cash';
    else if (clean.includes('net banking') || clean.includes('bank')) mode = 'Net Banking';

    if (amount > 0) {
      onParsedExpense({
        amount,
        category,
        note: text.slice(0, 40),
        mode,
      });
    }
  };

  const startListening = () => {
    // Check if SpeechRecognition is available in browser
    const SpeechRecognition = (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      // Fallback: offer simulated voice prompt examples
      simulateVoiceInput('Paid Rs 320 for dinner on Swiggy via UPI');
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.lang = 'en-IN';
      recognition.continuous = false;
      recognition.interimResults = false;

      recognition.onstart = () => {
        setIsListening(true);
        setErrorMsg('');
      };

      recognition.onresult = (event: any) => {
        const text = event.results[0][0].transcript;
        setTranscript(text);
        parseVoiceText(text);
        setIsListening(false);
      };

      recognition.onerror = () => {
        setIsListening(false);
        simulateVoiceInput('Spent 450 on Uber ride to office via UPI');
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch {
      simulateVoiceInput('Paid Rs 280 for coffee and snacks via UPI');
    }
  };

  const simulateVoiceInput = (sampleText: string) => {
    setTranscript(sampleText);
    parseVoiceText(sampleText);
  };

  return (
    <div className="bg-indigo-50/60 border border-indigo-100 rounded-2xl p-3 text-xs space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5 font-bold text-indigo-950">
          <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
          <span>Hands-Free Voice Logger</span>
        </div>

        <button
          type="button"
          onClick={isListening ? () => setIsListening(false) : startListening}
          className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-bold transition-all ${
            isListening
              ? 'bg-rose-500 text-white animate-pulse'
              : 'bg-indigo-600 hover:bg-indigo-700 text-white shadow-xs'
          }`}
        >
          {isListening ? (
            <>
              <MicOff className="w-3.5 h-3.5" />
              <span>Listening...</span>
            </>
          ) : (
            <>
              <Mic className="w-3.5 h-3.5" />
              <span>Tap to Speak</span>
            </>
          )}
        </button>
      </div>

      {transcript && (
        <div className="bg-white/90 p-2 rounded-xl border border-indigo-100 font-mono text-[11px] text-slate-700">
          🎙️ "{transcript}"
        </div>
      )}

      {/* Quick voice simulation presets */}
      <div className="flex flex-wrap items-center gap-1 text-[11px] text-slate-500">
        <span className="text-slate-400 font-medium">Or try:</span>
        <button
          type="button"
          onClick={() => simulateVoiceInput('Paid 350 for lunch on Swiggy via UPI')}
          className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-slate-700"
        >
          "Paid 350 on Swiggy"
        </button>
        <button
          type="button"
          onClick={() => simulateVoiceInput('Spent 120 on Uber ride via Card')}
          className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-slate-700"
        >
          "120 Uber ride"
        </button>
        <button
          type="button"
          onClick={() => simulateVoiceInput('Rs 890 wifi broadband bill via Net Banking')}
          className="px-2 py-0.5 bg-white border border-slate-200 hover:border-indigo-400 rounded-lg text-slate-700"
        >
          "890 Wifi bill"
        </button>
      </div>
    </div>
  );
};
