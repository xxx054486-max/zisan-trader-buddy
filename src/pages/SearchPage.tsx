import { useState, useEffect, useRef } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { useProducts, useCategories } from '@/hooks/useFirestoreData';
import ProductCard from '@/components/ProductCard';
import { ProductCardSkeleton } from '@/components/Skeletons';
import { Search, SlidersHorizontal, X, ChevronDown, Package } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Slider } from '@/components/ui/slider';

const SORT_OPTIONS = [
  { value: 'popular', label: 'Popularity' },
  { value: 'price_asc', label: 'Price: Low → High' },
  { value: 'price_desc', label: 'Price: High → Low' },
  { value: 'rating', label: 'Rating' },
  { value: 'newest', label: 'Newest' },
];

export default function SearchPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { products, loading } = useProducts();
  const { categories } = useCategories();
  const [query, setQuery] = useState(searchParams.get('q') || '');
  const [priceRange, setPriceRange] = useState([0, 50000]);
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [minRating, setMinRating] = useState(0);
  const [sort, setSort] = useState('popular');
  const [filterOpen, setFilterOpen] = useState(false);
  const [suggestions, setSuggestions] = useState<{ id: string; name: string }[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  const brands = [...new Set(products.map(p => p.brand).filter(Boolean))];

  useEffect(() => {
    if (query.trim().length > 0) {
      const q = query.toLowerCase();
      setSuggestions(products.filter(p => p.name.toLowerCase().includes(q)).slice(0, 5).map(p => ({ id: p.id, name: p.name })));
      setShowSuggestions(true);
    } else { setSuggestions([]); setShowSuggestions(false); }
  }, [query, products]);

  useEffect(() => {
    const handler = (e: MouseEvent) => { if (searchRef.current && !searchRef.current.contains(e.target as Node)) setShowSuggestions(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const toggleBrand = (brand: string) => setSelectedBrands(prev => prev.includes(brand) ? prev.filter(b => b !== brand) : [...prev, brand]);

  const filtered = products
    .filter(p => !query || p.name?.toLowerCase().includes(query.toLowerCase()) || p.brand?.toLowerCase().includes(query.toLowerCase()))
    .filter(p => p.price >= priceRange[0] && p.price <= priceRange[1])
    .filter(p => selectedBrands.length === 0 || selectedBrands.includes(p.brand))
    .filter(p => (p.rating || 0) >= minRating)
    .sort((a, b) => {
      if (sort === 'price_asc') return a.price - b.price;
      if (sort === 'price_desc') return b.price - a.price;
      if (sort === 'rating') return (b.rating || 0) - (a.rating || 0);
      if (sort === 'newest') return 0;
      return (b.sold || 0) - (a.sold || 0);
    });

  const FilterPanel = () => (
    <div className="space-y-5">
      <div>
        <h3 className="font-semibold text-sm mb-3">Price Range</h3>
        <div className="flex gap-2 mb-3">
          <Input type="number" placeholder="Min" value={priceRange[0]} onChange={e => setPriceRange([+e.target.value, priceRange[1]])} className="h-8 text-xs" />
          <span className="self-center text-muted-foreground">-</span>
          <Input type="number" placeholder="Max" value={priceRange[1]} onChange={e => setPriceRange([priceRange[0], +e.target.value])} className="h-8 text-xs" />
        </div>
        <Slider value={priceRange} min={0} max={50000} step={100} onValueChange={setPriceRange} />
        <div className="flex justify-between text-xs text-muted-foreground mt-1"><span>৳{priceRange[0]}</span><span>৳{priceRange[1]}</span></div>
      </div>
      {brands.length > 0 && (
        <div>
          <h3 className="font-semibold text-sm mb-3">Brand</h3>
          <div className="space-y-2">{brands.map(brand => (
            <label key={brand} className="flex items-center gap-2 cursor-pointer"><input type="checkbox" checked={selectedBrands.includes(brand)} onChange={() => toggleBrand(brand)} className="rounded" /><span className="text-sm">{brand}</span></label>
          ))}</div>
        </div>
      )}
      <div>
        <h3 className="font-semibold text-sm mb-3">Minimum Rating</h3>
        <div className="flex gap-2 flex-wrap">
          {[0, 3, 4, 4.5].map(r => (
            <button key={r} onClick={() => setMinRating(r)} className={`px-3 py-1.5 rounded-lg border text-xs font-medium transition-all ${minRating === r ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>
              {r === 0 ? 'All' : `${r}+`}
            </button>
          ))}
        </div>
      </div>
    </div>
  );

  return (
    <div className="pb-nav lg:pb-8 max-w-screen-xl mx-auto">
      <div className="sticky top-14 z-30 bg-background/95 backdrop-blur px-4 py-3 border-b border-border">
        <div className="flex gap-2">
          <div className="relative flex-1" ref={searchRef}>
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input value={query} onChange={e => setQuery(e.target.value)} onFocus={() => suggestions.length > 0 && setShowSuggestions(true)} className="pl-9 h-10 rounded-xl bg-muted border-0" />
            {query && <button onClick={() => setQuery('')} className="absolute right-3 top-1/2 -translate-y-1/2"><X size={14} className="text-muted-foreground" /></button>}
            {showSuggestions && suggestions.length > 0 && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-card border border-border rounded-xl shadow-lg z-50 overflow-hidden">
                {suggestions.map(s => (
                  <button key={s.id} onClick={() => { navigate(`/product/${s.id}`); setShowSuggestions(false); }} className="flex items-center gap-3 w-full px-3 py-2 hover:bg-muted text-left text-sm">{s.name}</button>
                ))}
              </div>
            )}
          </div>
          <Sheet open={filterOpen} onOpenChange={setFilterOpen}>
            <SheetTrigger asChild><Button variant="outline" size="icon" className="h-10 w-10 rounded-xl shrink-0 lg:hidden"><SlidersHorizontal size={16} /></Button></SheetTrigger>
            <SheetContent side="bottom" className="h-[80vh] rounded-t-2xl"><SheetHeader><SheetTitle>Filters</SheetTitle></SheetHeader><div className="overflow-y-auto h-full pb-20 pt-4"><FilterPanel /></div></SheetContent>
          </Sheet>
          <div className="relative">
            <select value={sort} onChange={e => setSort(e.target.value)} className="h-10 rounded-xl border border-border bg-card px-3 pr-8 text-xs font-medium appearance-none">
              {SORT_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
            <ChevronDown size={12} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground" />
          </div>
        </div>
      </div>
      <div className="flex gap-4 px-4 pt-4">
        <aside className="hidden lg:block w-56 shrink-0"><div className="bg-card border border-border rounded-xl p-4 sticky top-32"><div className="flex items-center justify-between mb-4"><h2 className="font-bold text-sm">Filters</h2><button onClick={() => { setSelectedBrands([]); setMinRating(0); setPriceRange([0, 50000]); }} className="text-xs text-primary hover:underline">Clear</button></div><FilterPanel /></div></aside>
        <div className="flex-1">
          <p className="text-sm text-muted-foreground mb-3 font-medium">{filtered.length} results</p>
          {loading ? (
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">{Array.from({ length: 6 }).map((_, i) => <ProductCardSkeleton key={i} />)}</div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-3 gap-3">
              {filtered.map(product => <ProductCard key={product.id} product={product} />)}
              {filtered.length === 0 && (
                <div className="col-span-2 md:col-span-3 text-center py-16">
                  <Package size={40} className="mx-auto mb-3 text-muted-foreground opacity-30" />
                  <h3 className="font-bold mb-1">No products found</h3>
                  <p className="text-muted-foreground text-sm">Try adjusting your filters</p>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
