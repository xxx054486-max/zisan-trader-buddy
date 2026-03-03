import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, ShoppingCart, X, LogOut, User, Package, Star, SlidersHorizontal } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { useAuth } from '@/contexts/AuthContext';
import { useProducts, useSettings } from '@/hooks/useFirestoreData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { motion, AnimatePresence } from 'framer-motion';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popularity' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
];

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
  const [filterOpen, setFilterOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const mobileSearchRef = useRef<HTMLDivElement>(null);
  const [placeholderIndex, setPlaceholderIndex] = useState(0);
  const [displayedPlaceholder, setDisplayedPlaceholder] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [isFocused, setIsFocused] = useState(false);

  const [sort, setSort] = useState('popular');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [minRating, setMinRating] = useState(0);

  const targetPlaceholder = products.length > 0
    ? products[placeholderIndex % products.length]?.name?.slice(0, 30) ?? ''
    : '';

  // Smooth typewriter placeholder animation
  useEffect(() => {
    if (!targetPlaceholder) return;
    setIsTyping(true);
    setDisplayedPlaceholder('');
    let i = 0;
    // Erase first, then type — gives a smooth feel
    const type = setInterval(() => {
      i++;
      setDisplayedPlaceholder(targetPlaceholder.slice(0, i));
      if (i >= targetPlaceholder.length) {
        clearInterval(type);
        setIsTyping(false);
      }
    }, 55);
    return () => clearInterval(type);
  }, [targetPlaceholder]);

  useEffect(() => {
    if (products.length === 0) return;
    const interval = setInterval(() => {
      setPlaceholderIndex(prev => (prev + 1) % products.length);
    }, 3500);
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
      const outsideDesktop = searchRef.current && !searchRef.current.contains(e.target as Node);
      const outsideMobile = mobileSearchRef.current && !mobileSearchRef.current.contains(e.target as Node);
      if (outsideDesktop && outsideMobile) setShowSuggestions(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSearch = (e?: React.FormEvent) => {
    e?.preventDefault();
    const q = searchQuery.trim() || products[placeholderIndex % products.length]?.name || '';
    if (q) {
      navigate(`/search?q=${encodeURIComponent(q)}&sort=${sort}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}&minRating=${minRating}`);
      setShowSuggestions(false);
      setSearchQuery('');
    }
  };

  const applyFilters = () => {
    const currentQ = searchQuery.trim() || '';
    navigate(`/search?q=${encodeURIComponent(currentQ)}&sort=${sort}&minPrice=${priceRange[0]}&maxPrice=${priceRange[1]}&minRating=${minRating}`);
    setFilterOpen(false);
  };

  const SuggestionsDropdown = () => (
    showSuggestions && suggestions.length > 0 ? (
      <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
        {suggestions.map(s => (
          <button
            key={s.id}
            onClick={() => { navigate(`/product/${s.id}`); setShowSuggestions(false); setSearchQuery(''); }}
            className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted transition-colors text-left"
          >
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
      <button
        onClick={() => navigate('/profile?tab=rewards')}
        className="flex items-center gap-1 px-2 py-1 rounded-lg bg-accent/10 hover:bg-accent/20 transition-colors"
        title="Loyalty Points"
      >
        <Star size={12} className="text-accent fill-accent" />
        <span className="text-xs font-bold text-accent">{userData.loyaltyPoints || 0}</span>
      </button>
    );
  };

  // ── Daraz-style Search Bar ──────────────────────────────────────────────────
  const SearchBar = ({ isMobile = false }: { isMobile?: boolean }) => (
    <div ref={isMobile ? mobileSearchRef : searchRef} className="relative flex gap-2">
      <form onSubmit={handleSearch} className="relative flex-1">
        {/*
          Outer wrapper acts as the visual "input box".
          Border: dotted + subtle, thickens & turns primary on focus.
          Layout: input text on the left, search button flush on the right (Daraz pattern).
        */}
        <div
          className={[
            'flex items-center overflow-hidden transition-all duration-200',
            'rounded-xl border-2 border-dotted bg-background',
            isMobile ? 'h-10' : 'h-11',
            isFocused
              ? 'border-primary shadow-[0_0_0_3px_hsl(var(--primary)/0.12)]'
              : 'border-border/70 hover:border-primary/50',
          ].join(' ')}
        >
          {/* Search icon inside box – Daraz style */}
          <Search
            size={15}
            strokeWidth={2.2}
            className={`ml-3 shrink-0 transition-colors duration-200 ${isFocused ? 'text-primary' : 'text-muted-foreground'}`}
          />

          {/* Text input */}
          <input
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => { setIsFocused(true); suggestions.length > 0 && setShowSuggestions(true); }}
            onBlur={() => setIsFocused(false)}
            placeholder={displayedPlaceholder + (isTyping ? '▌' : '')}
            className="flex-1 h-full bg-transparent outline-none px-2.5 text-sm placeholder:text-muted-foreground/70 truncate"
          />

          {/* Clear button */}
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="p-1.5 mr-1 text-muted-foreground hover:text-foreground transition-colors"
            >
              <X size={13} />
            </button>
          )}

          {/* Search button – flush right, rounded only on right side */}
          <button
            type="submit"
            className={[
              'shrink-0 flex items-center justify-center gap-1.5',
              'bg-primary hover:bg-primary/90 active:scale-95',
              'text-primary-foreground font-semibold transition-all duration-150',
              'rounded-r-[10px]',           // match outer radius − border-width
              isMobile
                ? 'h-full px-3.5 text-xs'
                : 'h-full px-5 text-sm',
            ].join(' ')}
          >
            <Search size={isMobile ? 13 : 14} strokeWidth={2.5} />
            {/* Hide label on very small screens to keep it tidy */}
            <span className={isMobile ? 'hidden xs:inline' : ''}>Search</span>
          </button>
        </div>
      </form>

      {/* Filter button */}
      <button
        type="button"
        onClick={() => setFilterOpen(true)}
        className={[
          'rounded-xl border-2 border-dotted border-border/70 bg-background',
          'flex items-center justify-center shrink-0',
          'hover:border-primary/50 hover:bg-muted active:scale-95 transition-all duration-150',
          isMobile ? 'h-10 w-10' : 'h-11 w-11',
        ].join(' ')}
      >
        <SlidersHorizontal size={14} className="text-muted-foreground" />
      </button>

      <SuggestionsDropdown />
    </div>
  );
  // ───────────────────────────────────────────────────────────────────────────

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
              <span className="absolute -top-0.5 -right-0.5 bg-destructive text-destructive-foreground text-[10px] font-bold min-w-[18px] min-h-[18px] flex items-center justify-center rounded-full">{itemCount > 99 ? '99+' : itemCount}</span>
            )}
          </Link>
        </div>

        {/* Mobile Search Bar */}
        <div className="lg:hidden px-4 pb-2.5">
          <SearchBar isMobile />
        </div>

        {/* Desktop Header */}
        <div className="hidden lg:flex items-center gap-6 px-6 h-16 max-w-screen-xl mx-auto">
          <Link to="/" className="flex items-center gap-2 shrink-0">
            <img src={settings.appLogo || '/logo.png'} alt={settings.appName} className="w-9 h-9 object-contain" onError={e => { (e.target as HTMLImageElement).src = '/logo.png'; }} />
            <span className="font-bold text-xl text-primary">{settings.appName}</span>
          </Link>
          <div className="flex-1 max-w-xl">
            <SearchBar />
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

      {/* Filter Sheet */}
      <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
        <SheetContent side="bottom" className="h-[70vh] rounded-t-2xl">
          <SheetHeader>
            <SheetTitle>Filters & Sort</SheetTitle>
          </SheetHeader>
          <div className="overflow-y-auto h-full pb-24 pt-4 space-y-6">
            <div>
              <h3 className="font-semibold text-sm mb-3">Sort By</h3>
              <div className="flex flex-wrap gap-2">
                {SORT_OPTIONS.map(o => (
                  <button key={o.value} onClick={() => setSort(o.value)} className={`px-3 py-2 rounded-xl border text-xs font-medium transition-all ${sort === o.value ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                    {o.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Price Range</h3>
              <div className="flex items-center gap-3">
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Min (৳)</label>
                  <Input type="number" value={priceRange[0]} onChange={e => setPriceRange([Number(e.target.value) || 0, priceRange[1]])} className="h-9 rounded-xl" placeholder="0" />
                </div>
                <span className="text-muted-foreground mt-5">—</span>
                <div className="flex-1">
                  <label className="text-xs text-muted-foreground mb-1 block">Max (৳)</label>
                  <Input type="number" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], Number(e.target.value) || 50000])} className="h-9 rounded-xl" placeholder="50000" />
                </div>
              </div>
            </div>
            <div>
              <h3 className="font-semibold text-sm mb-3">Minimum Rating</h3>
              <div className="flex gap-2 flex-wrap">
                {[0, 3, 4, 4.5].map(r => (
                  <button key={r} onClick={() => setMinRating(r)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${minRating === r ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
                    {r === 0 ? 'All' : `${r}+ ★`}
                  </button>
                ))}
              </div>
            </div>
            <div className="flex gap-3 pt-4">
              <Button variant="outline" className="flex-1" onClick={() => { setSort('popular'); setPriceRange([0, 50000]); setMinRating(0); }}>Reset</Button>
              <Button className="flex-1" onClick={applyFilters}>Apply Filters</Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

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
