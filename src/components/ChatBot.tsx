import { useState, useRef, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { MessageCircle, X, Send, Bot, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';

function ChatBotButton({ open, setOpen }: { open: boolean; setOpen: (v: boolean) => void }) {
  const location = useLocation();
  const hiddenPaths = ['/product/', '/cart'];
  const shouldHide = hiddenPaths.some(p => location.pathname.startsWith(p));
  if (shouldHide) return null;
  return (
    <motion.button
      whileTap={{ scale: 0.9 }}
      onClick={() => setOpen(!open)}
      className="fixed bottom-20 right-4 w-12 h-12 bg-primary text-primary-foreground rounded-full shadow-lg flex items-center justify-center z-50 lg:bottom-6"
    >
      {open ? <X size={20} /> : <MessageCircle size={20} />}
    </motion.button>
  );
}

interface Message {
  id: string;
  text: string;
  isBot: boolean;
  quickReplies?: string[];
}

const RESPONSES: Record<string, { text: string; quickReplies?: string[] }> = {
  greeting: { text: 'আসসালামু আলাইকুম! আমি আপনাকে কিভাবে সাহায্য করতে পারি?', quickReplies: ['অর্ডার ট্র্যাক', 'রিটার্ন পলিসি', 'যোগাযোগ', 'পেমেন্ট'] },
  order: { text: 'আপনার অর্ডার ট্র্যাক করতে "My Orders" পেজে যান। সেখানে আপনার সকল অর্ডারের স্ট্যাটাস দেখতে পারবেন।', quickReplies: ['রিটার্ন পলিসি', 'যোগাযোগ', 'পেমেন্ট'] },
  return: { text: 'আমাদের রিটার্ন পলিসি অনুযায়ী, পণ্য পাওয়ার ৭ দিনের মধ্যে রিটার্ন করতে পারবেন। পণ্য অবশ্যই অব্যবহৃত ও অরিজিনাল প্যাকেজিংসহ থাকতে হবে।', quickReplies: ['অর্ডার ট্র্যাক', 'যোগাযোগ', 'পেমেন্ট'] },
  payment: { text: 'আমরা ক্যাশ অন ডেলিভারি (COD) এবং মোবাইল ব্যাংকিং (bKash, Nagad) এর মাধ্যমে পেমেন্ট গ্রহণ করি।', quickReplies: ['অর্ডার ট্র্যাক', 'রিটার্ন পলিসি', 'যোগাযোগ'] },
  contact: { text: 'আমাদের সাথে যোগাযোগ করতে Support পেজ ভিজিট করুন অথবা WhatsApp-এ মেসেজ পাঠান।', quickReplies: ['অর্ডার ট্র্যাক', 'রিটার্ন পলিসি', 'পেমেন্ট'] },
  product: { text: 'আমাদের পণ্য সম্পর্কে জানতে হোমপেজ বা ক্যাটাগরি পেজ ভিজিট করুন। কোনো নির্দিষ্ট পণ্য সম্পর্কে জানতে চাইলে সার্চ করুন।', quickReplies: ['অর্ডার ট্র্যাক', 'পেমেন্ট', 'যোগাযোগ'] },
  delivery: { text: 'ডেলিভারি সাধারণত ৩-৫ কার্যদিবসের মধ্যে সম্পন্ন হয়। এক্সপ্রেস ডেলিভারিতে ১-২ দিনের মধ্যে পেতে পারেন।', quickReplies: ['অর্ডার ট্র্যাক', 'পেমেন্ট', 'রিটার্ন পলিসি'] },
  default: { text: 'দুঃখিত, আমি ঠিক বুঝতে পারিনি। নিচের অপশনগুলো থেকে বেছে নিন অথবা আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করুন।', quickReplies: ['অর্ডার ট্র্যাক', 'রিটার্ন পলিসি', 'যোগাযোগ', 'পেমেন্ট'] },
};

const KEYWORDS: Record<string, string[]> = {
  order: ['order', 'অর্ডার', 'track', 'ট্র্যাক', 'delivery status', 'shipped'],
  return: ['return', 'রিটার্ন', 'refund', 'রিফান্ড', 'exchange', 'পলিসি'],
  payment: ['payment', 'পেমেন্ট', 'pay', 'bkash', 'বিকাশ', 'nagad', 'নগদ', 'cod'],
  contact: ['contact', 'যোগাযোগ', 'phone', 'ফোন', 'email', 'ইমেইল', 'whatsapp'],
  product: ['product', 'পণ্য', 'price', 'দাম', 'stock', 'available'],
  delivery: ['delivery', 'ডেলিভারি', 'shipping', 'শিপিং', 'কবে পাবো'],
  greeting: ['hi', 'hello', 'হ্যালো', 'আসসালামু', 'সালাম', 'hey'],
};

function getResponse(input: string): { text: string; quickReplies?: string[] } {
  const lower = input.toLowerCase();
  for (const [key, keywords] of Object.entries(KEYWORDS)) {
    if (keywords.some(k => lower.includes(k))) return RESPONSES[key];
  }
  return RESPONSES.default;
}

function linkify(text: string) {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, i) =>
    urlRegex.test(part) ? <a key={i} href={part} target="_blank" rel="noopener noreferrer" className="text-primary underline">{part}</a> : part
  );
}

export default function ChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    { id: '0', text: 'আসসালামু আলাইকুম! আমি আপনাকে কিভাবে সাহায্য করতে পারি?', isBot: true, quickReplies: ['অর্ডার ট্র্যাক', 'রিটার্ন পলিসি', 'যোগাযোগ', 'পেমেন্ট'] },
  ]);
  const [input, setInput] = useState('');
  const [typing, setTyping] = useState(false);
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, typing]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    const userMsg: Message = { id: Date.now().toString(), text, isBot: false };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setTyping(true);
    setTimeout(() => {
      const resp = getResponse(text);
      const botMsg: Message = { id: (Date.now() + 1).toString(), text: resp.text, isBot: true, quickReplies: resp.quickReplies };
      setMessages(prev => [...prev, botMsg]);
      setTyping(false);
    }, 1000 + Math.random() * 500);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-24 right-4 w-80 h-[28rem] bg-card border border-border rounded-2xl shadow-xl z-50 flex flex-col overflow-hidden"
          >
            <div className="bg-primary text-primary-foreground p-3 flex items-center justify-between">
              <div className="flex items-center gap-2"><Bot size={18} /><span className="font-semibold text-sm">Support Chat</span></div>
              <button onClick={() => setOpen(false)}><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-3 space-y-3">
              {messages.map(msg => (
                <div key={msg.id} className={`flex ${msg.isBot ? 'justify-start' : 'justify-end'}`}>
                  <div className={`max-w-[85%] ${msg.isBot ? 'order-2' : ''}`}>
                    <div className={`px-3 py-2 rounded-2xl text-sm ${msg.isBot ? 'bg-muted text-foreground rounded-bl-sm' : 'bg-primary text-primary-foreground rounded-br-sm'}`}>
                      {linkify(msg.text)}
                    </div>
                    {msg.quickReplies && (
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {msg.quickReplies.map(qr => (
                          <button key={qr} onClick={() => sendMessage(qr)} className="text-xs bg-primary/10 text-primary px-2.5 py-1 rounded-full hover:bg-primary/20 transition-colors">
                            {qr}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
              {typing && (
                <div className="flex justify-start">
                  <div className="bg-muted px-4 py-2 rounded-2xl rounded-bl-sm flex gap-1">
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 bg-muted-foreground rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}
              <div ref={endRef} />
            </div>
            <form onSubmit={e => { e.preventDefault(); sendMessage(input); }} className="p-2 border-t border-border flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} placeholder="মেসেজ লিখুন..." className="h-9 text-sm" />
              <Button type="submit" size="icon" className="h-9 w-9 shrink-0"><Send size={14} /></Button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
      <ChatBotButton open={open} setOpen={setOpen} />
    </>
  );
}
