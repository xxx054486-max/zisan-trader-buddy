import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, Menu, X, LogOut, User, Package, Settings, HeadphonesIcon, Star, SlidersHorizontal } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, useSettings } from '@/hooks/useFirestoreData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { motion, AnimatePresence } from 'framer-motion';

export default function Header() {
  const { itemCount } = useCart();
  const { user, userData, logout } = useAuth();
  const { settings } = useSettings();
  const { products } = useProducts();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [suggestions, setSuggestions] = useState<{ id: string; name: string; image: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);

  const placeholderText = products.length > 0
    ? `Search "${products[placeholderIndex % products.length]?.name?.slice(0, 25)}..."`
    : 'Search products...';

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % products.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [products.length]);

  const isAdmin = userData?.role === 'admin';

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      const q = searchQuery.toLowerCase();
      const matches = products
        .filter(p => p.name.toLowerCase().includes(q) || p.brand?.toLowerCase().includes(q) || p.category?.toLowerCase().includes(q))
        .slice(0, 6)
        .map(p => ({ id: p.id, name: p.name, image: p.images?.[0] || '' }));
      setSuggestions(matches);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, products]);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim() || products[placeholderIndex % products.length]?.name || '';
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const SuggestionsDropdown = () => (
    showSuggestions && suggestions.length > 0 ? (
      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
        {suggestions.map(s => (
          <button key={s.id} onClick={() => { navigate(`/product/${s.id}`); setShowSuggestions(false); setSearchQuery(''); }} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted transition-colors text-left">
            {s.image && <img src={s.image} alt="" className="w-8 h-8 rounded-lg object-cover" />}
            <span className="text-sm truncate">{s.name}</span>
          </button>
        ))}
      </div>
    ) : null
  );

  const PointsBadge = () => {
    if (!user || !userData) return null;
    return (
      <button onClick={() => navigate('/profile?tab=rewards')} className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors" title="Loyalty Points">
        <Star size={12} className="text-accent fill-accent" />
        <span className="text-xs font-bold text-accent">{userData.loyaltyPoints || 0}</span>
      </button>
    );
  };

  if (isAdmin) return null;

  return (
    <>
      <header className="sticky top-0 z-40 bg-card/95 backdrop-blur border-b border-border">
        {/* Mobile Header */}
        <div className="lg:hidden flex items-center gap-3 px-4 h-14">
          <button onClick={() => setMobileMenuOpen(true)} className="flex flex-col gap-[5px] w-8 h-8 items-center justify-center" aria-label="Menu">
            <span className="block h-0.5 bg-foreground w-6 rounded-full" />
            <span className="block h-0.5 bg-foreground w-4 rounded-full" />
            <span className="block h-0.5 bg-foreground w-5 rounded-full" />
          </button>
          <Link to="/" className="flex-1 flex items-center gap-2">
            <img src={settings.appLogo || '/logo.png'} alt={settings.appName} className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
            <span className="font-bold text-lg text-primary">{settings.appName}</span>
          </Link>
          <PointsBadge />
          <Link to="/cart" className="relative p-2">
            <ShoppingCart size={22} className="text-foreground" />
            {itemCount > 0 && (
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold w-4.5 h-4.5 min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full">{itemCount > 99 ? '99+' : itemCount}</span>
            )}
          </Link>
        </div>

        {/* Sticky search bar mobile */}
        <div className="lg:hidden px-4 pb-2" ref={searchRef}>
          <form onSubmit={handleSearch} className="relative flex gap-2">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} placeholder={placeholderText} className="pl-9 pr-3 h-9 rounded-xl bg-muted border-0 text-sm" />
              <SuggestionsDropdown />
            </div>
            <button type="submit" className="h-9 px-3 rounded-xl bg-primary text-primary-foreground text-xs font-semibold shrink-0">
              <Search size={14} />
            </button>
            <button type="button" onClick={() => navigate('/search')} className="h-9 w-9 rounded-xl border border-border bg-card flex items-center justify-center shrink-0">
              <SlidersHorizontal size={14} className="text-muted-foreground" />
            </button>
          </form>
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-6 px-6 h-16 max-w-screen-xl mx-auto">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={settings.appLogo || '/logo.png'} alt={settings.appName} className="w-9 h-9 object-contain" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
            <span className="font-bold text-xl text-primary">{settings.appName}</span>
          </Link>
          <div ref={searchRef} className="flex-1 max-w-xl relative">
            <form onSubmit={handleSearch} className="relative flex gap-2">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input value={searchQuery} onChange={e => setSearchQuery(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} placeholder={placeholderText} className="pl-9 rounded-xl bg-muted border-0" />
              </div>
              <Button type="submit" size="sm" className="h-10 px-4 rounded-xl">Search</Button>
              <button type="button" onClick={() => navigate('/search')} className="h-10 w-10 rounded-xl border border-border bg-card flex items-center justify-center shrink-0 hover:bg-muted transition-colors">
                <SlidersHorizontal size={14} className="text-muted-foreground" />
              </button>
            </form>
            <SuggestionsDropdown />
          </div>
          <nav className="flex items-center gap-1">
            <Link to="/category" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Categories</Link>
            <Link to="/support" className="px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">Support</Link>
          </nav>
          <div className="flex items-center gap-2">
            <PointsBadge />
            <Link to="/cart" className="relative p-2 hover:bg-muted rounded-lg transition-colors">
              <ShoppingCart size={20} />
              {itemCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full">{itemCount > 99 ? '99+' : itemCount}</span>
              )}
            </Link>
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-2 hover:bg-muted rounded-lg p-1.5 transition-colors">
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={user.photoURL || undefined} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">{(user.displayName || user.email || 'U')[0].toUpperCase()}</AvatarFallback>
                    </Avatar>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem onClick={() => navigate('/profile')}><User size={14} className="mr-2" /> My Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/orders')}><Package size={14} className="mr-2" /> My Orders</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="text-destructive"><LogOut size={14} className="mr-2" /> Logout</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <Button size="sm" onClick={() => navigate('/auth')}>Login</Button>
            )}
          </div>
        </div>
      </header>

      {/* Mobile Menu Drawer */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 bg-black/50 z-50 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
            <motion.div initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }} transition={{ type: 'spring', damping: 25, stiffness: 300 }} className="fixed left-0 top-0 bottom-0 w-72 bg-card z-50 lg:hidden flex flex-col">
              <div className="flex items-center justify-between p-4 border-b">
                <Link to="/" className="flex items-center gap-2" onClick={() => setMobileMenuOpen(false)}>
                   <img src={settings.appLogo || '/logo.png'} alt={settings.appName} className="w-8 h-8 object-contain" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
                  <span className="font-bold text-lg text-primary">{settings.appName}</span>
                </Link>
                <button onClick={() => setMobileMenuOpen(false)} className="p-2"><X size={20} /></button>
              </div>
              {user ? (
                <div className="p-4 border-b bg-muted/30">
                  <div className="flex items-center gap-3">
                    <Avatar><AvatarImage src={user.photoURL || undefined} /><AvatarFallback className="bg-primary text-primary-foreground">{(user.displayName || 'U')[0].toUpperCase()}</AvatarFallback></Avatar>
                    <div><p className="font-semibold text-sm">{user.displayName || 'User'}</p><p className="text-xs text-muted-foreground">{user.email}</p></div>
                  </div>
                </div>
              ) : (
                <div className="p-4 border-b"><Button className="w-full" onClick={() => { navigate('/auth'); setMobileMenuOpen(false); }}>Login / Register</Button></div>
              )}
              <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
                {[
                  { label: 'Home', path: '/' },
                  { label: 'Categories', path: '/category' },
                  { label: 'My Orders', path: '/orders' },
                  { label: 'Profile', path: '/profile' },
                  { label: 'Support', path: '/support' },
                ].map(item => (
                  <Link key={item.path} to={item.path} onClick={() => setMobileMenuOpen(false)} className="flex items-center px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-muted transition-colors">{item.label}</Link>
                ))}
              </nav>
              {user && (
                <div className="p-4 border-t">
                  <button onClick={() => { logout(); setMobileMenuOpen(false); }} className="flex items-center gap-2 text-sm text-destructive font-medium w-full px-3 py-2"><LogOut size={16} /> Logout</button>
                </div>
              )}
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}