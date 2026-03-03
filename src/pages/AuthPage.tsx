import { useState } from 'react';
import { useNavigate, Link, useSearchParams } from 'react-router-dom';
import { Eye, EyeOff, Mail, Lock, ArrowLeft } from 'lucide-react';
import { getAuth } from 'firebase/auth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useAuth } from '@/contexts/AuthContext';
import { useSettings, bindReferral } from '@/hooks/useFirestoreData';
import { motion } from 'framer-motion';

export default function AuthPage() {
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [isReset, setIsReset] = useState(false);
  const [form, setForm] = useState({ email: '', password: '' });
  const { login, register, resetPassword } = useAuth();
  const { settings } = useSettings();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const refCode = searchParams.get('ref') || '';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(''); setSuccess(''); setLoading(true);
    try {
      if (isReset) {
        await resetPassword(form.email);
        setSuccess('পাসওয়ার্ড রিসেট লিংক পাঠানো হয়েছে!');
      } else {
        try {
          await login(form.email, form.password);
          navigate('/');
        } catch (err: any) {
          if (err.code === 'auth/user-not-found' || err.code === 'auth/invalid-credential') {
            // Auto register
            try {
              const name = form.email.split('@')[0];
              await register(form.email, form.password, name);
              // Auto-bind referral if ref code present in URL
              const currentUser = getAuth().currentUser;
              if (refCode && currentUser?.uid) {
                try { await bindReferral(currentUser.uid, refCode); } catch {}
              }
              navigate('/');
            } catch (regErr: any) {
              if (regErr.code === 'auth/email-already-in-use') {
                setError('ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
              } else {
                setError(regErr.message || 'কিছু ভুল হয়েছে।');
              }
            }
          } else if (err.code === 'auth/wrong-password') {
            setError('ভুল পাসওয়ার্ড। আবার চেষ্টা করুন।');
          } else if (err.code === 'auth/too-many-requests') {
            setError('অনেক বেশি চেষ্টা হয়েছে। কিছুক্ষণ পর আবার চেষ্টা করুন।');
          } else {
            setError(err.message || 'কিছু ভুল হয়েছে।');
          }
        }
      }
    } catch (err: any) {
      setError(err.message || 'কিছু ভুল হয়েছে।');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      {/* Left illustration (desktop) */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-primary to-primary/80 items-center justify-center p-12 relative overflow-hidden">
        <div className="relative z-10 text-center text-primary-foreground">
          <img src={settings.appLogo || '/logo.png'} alt={settings.appName} className="w-20 h-20 mx-auto mb-6 object-contain" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
          <h1 className="text-4xl font-bold mb-4">Welcome to {settings.appName}</h1>
          <p className="text-white/80 text-lg max-w-sm mx-auto">সেরা পণ্য, সেরা দাম। আজই শপিং শুরু করুন।</p>
        </div>
        <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-white/5 rounded-full" />
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-white/5 rounded-full" />
      </div>

      {/* Right form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">
        <div className="w-full max-w-sm">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground text-sm mb-6 hover:text-foreground">
            <ArrowLeft size={16} /> Back to Home
          </Link>

          <div className="lg:hidden flex items-center gap-2 mb-8">
            <img src={settings.appLogo || '/logo.png'} alt={settings.appName} className="w-10 h-10 object-contain" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
            <span className="text-xl font-bold text-primary">{settings.appName}</span>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <h2 className="text-2xl font-bold mb-1">{isReset ? 'পাসওয়ার্ড রিসেট' : 'লগইন / রেজিস্ট্রেশন'}</h2>
            <p className="text-muted-foreground text-sm mb-6">
              {isReset ? 'আপনার ইমেইল দিন, রিসেট লিংক পাঠানো হবে।' : 'ইমেইল ও পাসওয়ার্ড দিন। নতুন হলে স্বয়ংক্রিয়ভাবে অ্যাকাউন্ট তৈরি হবে।'}
            </p>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email</Label>
                <div className="relative">
                  <Mail size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                  <Input id="email" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} className="pl-10 h-11" required />
                </div>
              </div>

              {!isReset && (
                <div className="space-y-1.5">
                  <Label htmlFor="password">Password</Label>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                    <Input id="password" type={showPass ? 'text' : 'password'} value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} className="pl-10 pr-10 h-11" minLength={6} required />
                    <button type="button" onClick={() => setShowPass(!showPass)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                  {form.password.length > 0 && form.password.length < 6 && (
                    <p className="text-destructive text-xs">পাসওয়ার্ড কমপক্ষে ৬ অক্ষরের হতে হবে</p>
                  )}
                </div>
              )}

              {!isReset && (
                <button type="button" onClick={() => setIsReset(true)} className="text-primary text-sm font-medium hover:underline">
                  পাসওয়ার্ড ভুলে গেছেন?
                </button>
              )}

              {error && <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-lg border border-destructive/20">{error}</div>}
              {success && <div className="bg-green-500/10 text-green-600 text-sm p-3 rounded-lg border border-green-500/20">{success}</div>}

              <Button type="submit" className="w-full h-11 font-semibold" disabled={loading}>
                {loading ? 'অপেক্ষা করুন...' : isReset ? 'রিসেট লিংক পাঠান' : 'Continue'}
              </Button>
            </form>

            {isReset && (
              <button onClick={() => setIsReset(false)} className="mt-4 text-primary text-sm font-semibold hover:underline">
                লগইনে ফিরে যান
              </button>
            )}

            <div className="mt-6 text-center text-xs text-muted-foreground">
              Continue করলে আপনি আমাদের{' '}
              <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link> ও{' '}
              <Link to="/terms" className="text-primary hover:underline">Terms & Conditions</Link> মেনে নিচ্ছেন।
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
