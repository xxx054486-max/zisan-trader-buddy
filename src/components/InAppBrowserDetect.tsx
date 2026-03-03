import { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function InAppBrowserDetect() {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const ua = navigator.userAgent || '';
    const isInApp = /FBAN|FBAV|Instagram|Messenger|WhatsApp|Line|Snapchat|GSA/i.test(ua);
    setShow(isInApp);
  }, []);

  if (!show) return null;

  const openExternal = () => {
    const url = window.location.href;
    window.open(`intent://${url.replace(/^https?:\/\//, '')}#Intent;scheme=https;package=com.android.chrome;end`, '_blank');
    setTimeout(() => { window.location.href = url; }, 500);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-background flex flex-col items-center justify-center p-6 text-center">
      <img src="/logo.png" alt="Logo" className="w-20 h-20 mb-6" />
      <h2 className="text-xl font-bold mb-2">সেরা অভিজ্ঞতার জন্য Chrome-এ খুলুন।</h2>
      <p className="text-muted-foreground text-sm mb-6">
        আপনি একটি ইন-অ্যাপ ব্রাউজারে আছেন। আরও ভালো অভিজ্ঞতার জন্য এক্সটার্নাল ব্রাউজারে খুলুন।
      </p>
      <Button onClick={openExternal} className="gap-2">
        <ExternalLink size={16} /> Open in External Browser
      </Button>
      <button onClick={() => setShow(false)} className="mt-4 text-sm text-muted-foreground hover:text-foreground">
        এখানেই চালিয়ে যান
      </button>
    </div>
  );
}
