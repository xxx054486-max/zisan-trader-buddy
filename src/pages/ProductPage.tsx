import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { useProducts } from '@/hooks/useFirestoreData';
import { useCart } from '@/contexts/CartContext';
import { Star, Minus, Plus, ChevronLeft, ChevronRight, Truck, Shield, RotateCcw, ShoppingCart, ThumbsUp, CheckCircle, AlertTriangle, Share2, Banknote, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import ProductCard from '@/components/ProductCard';
import { motion, AnimatePresence } from 'framer-motion';

const staticReviews = [
  { id: 'r1', userName: 'Rahim A.', rating: 5, comment: 'অসাধারণ পণ্য! খুবই সন্তুষ্ট।', date: '2025-01-15', helpful: 12 },
  { id: 'r2', userName: 'Fatima K.', rating: 4, comment: 'ভালো মানের, দামের তুলনায় অনেক ভালো।', date: '2025-01-10', helpful: 8 },
  { id: 'r3', userName: 'Kamal H.', rating: 5, comment: 'চমৎকার! আবারও কিনবো।', date: '2024-12-28', helpful: 15 },
  { id: 'r4', userName: 'Sumaiya R.', rating: 3, comment: 'পণ্য ভালো, তবে ডেলিভারি একটু দেরিতে এসেছে।', date: '2024-12-20', helpful: 3 },
];

function ShareButtons({ product }: { product: any }) {
  const url = window.location.href;
  const text = `${product.name} - ৳${product.price}`;
  
  const shareLinks = [
    { name: 'Facebook', color: 'bg-[#1877F2]', icon: 'f', url: `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}` },
    { name: 'WhatsApp', color: 'bg-[#25D366]', icon: 'w', url: `https://wa.me/?text=${encodeURIComponent(text + ' ' + url)}` },
    { name: 'Messenger', color: 'bg-[#0084FF]', icon: 'm', url: `https://www.facebook.com/dialog/send?link=${encodeURIComponent(url)}&app_id=0&redirect_uri=${encodeURIComponent(url)}` },
    { name: 'Twitter', color: 'bg-[#1DA1F2]', icon: 'x', url: `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}` },
  ];

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({ title: product.name, text, url });
      } catch {}
    }
  };

  return (
    <div className="flex items-center gap-2 mt-4">
      <span className="text-xs font-semibold text-muted-foreground flex items-center gap-1"><Share2 size={13} /> Share:</span>
      {shareLinks.map(s => (
        <a key={s.name} href={s.url} target="_blank" rel="noopener noreferrer" className={`w-8 h-8 rounded-full ${s.color} text-white flex items-center justify-center text-xs font-bold hover:opacity-80 transition-opacity`} title={s.name}>
          {s.icon.toUpperCase()}
        </a>
      ))}
      {typeof navigator.share === 'function' && (
        <button onClick={handleNativeShare} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center hover:bg-muted/80"><Share2 size={14} /></button>
      )}
    </div>
  );
}

export default function ProductPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { products } = useProducts();
  const product = products.find(p => p.id === id);
  const related = product ? products.filter(p => p.categoryId === product.categoryId && p.id !== product.id).slice(0, 4) : [];
  const otherCategoryProducts = product ? products.filter(p => p.categoryId !== product.categoryId).slice(0, 8) : [];
  const { addToCart } = useCart();
  const [currentImage, setCurrentImage] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | undefined>();
  const [selectedColor, setSelectedColor] = useState<string | undefined>();
  const [qty, setQty] = useState(1);
  const [addedToCart, setAddedToCart] = useState(false);

  if (!product) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <p className="text-muted-foreground">পণ্য পাওয়া যায়নি</p>
    </div>
  );

  const discount = product.originalPrice ? Math.round((1 - product.price / product.originalPrice) * 100) : null;

  const handleAddToCart = async () => {
    await addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images?.[0] || '',
      stock: product.stock,
      selectedSize: selectedSize || product.sizes?.[0],
      selectedColor: selectedColor || product.colors?.[0],
      quantity: qty,
    });
    setAddedToCart(true);
    setTimeout(() => setAddedToCart(false), 2000);
  };

  const handleBuyNow = () => {
    const item = {
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images?.[0] || '',
      stock: product.stock,
      selectedSize: selectedSize || product.sizes?.[0],
      selectedColor: selectedColor || product.colors?.[0],
      quantity: qty,
    };
    navigate('/checkout', { state: { selectedItems: [item] } });
  };

  return (
    <div className="pb-36 lg:pb-8">
      <div className="max-w-screen-xl mx-auto lg:px-6 lg:py-6">
        <div className="lg:grid lg:grid-cols-2 lg:gap-10">
          {/* Image Gallery */}
          <div className="lg:sticky lg:top-20 lg:self-start">
            <div className="relative overflow-hidden bg-muted lg:rounded-2xl">
              <AnimatePresence mode="wait">
                <motion.img key={currentImage} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} src={product.images?.[currentImage] || '/placeholder.svg'} alt={product.name} className="w-full aspect-square object-cover" />
              </AnimatePresence>
              {(product.images?.length || 0) > 1 && (<>
                <button onClick={() => setCurrentImage(prev => (prev - 1 + product.images.length) % product.images.length)} className="absolute left-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md"><ChevronLeft size={18} /></button>
                <button onClick={() => setCurrentImage(prev => (prev + 1) % product.images.length)} className="absolute right-3 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-card/80 backdrop-blur flex items-center justify-center shadow-md"><ChevronRight size={18} /></button>
              </>)}
              {discount && discount > 0 && <span className="absolute top-3 left-3 bg-destructive text-destructive-foreground text-sm font-bold px-2 py-1 rounded-lg">-{discount}%</span>}
            </div>
            {(product.images?.length || 0) > 1 && (
              <div className="flex gap-2 p-4 lg:p-0 lg:mt-3 overflow-x-auto scrollbar-hide">
                {product.images.map((img, i) => (
                  <button key={i} onClick={() => setCurrentImage(i)} className={`shrink-0 w-16 h-16 rounded-xl overflow-hidden border-2 transition-all ${i === currentImage ? 'border-primary' : 'border-transparent'}`}>
                    <img src={img} alt="" className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="px-4 py-4 lg:px-0">
            <div>
              <Link to={`/category/${product.categoryId}`} className="text-primary text-xs font-medium">{product.category}</Link>
              <h1 className="text-xl font-bold mt-1 leading-tight">{product.name}</h1>
            </div>

            <div className="flex items-center gap-3 mt-3">
              <div className="flex items-center gap-1">{[1,2,3,4,5].map(s => <Star key={s} size={14} className={s <= Math.floor(product.rating || 0) ? 'fill-accent text-accent' : 'text-muted'} />)}</div>
              <span className="text-sm font-semibold">{product.rating || 0}</span>
              <span className="text-sm text-muted-foreground">({product.reviewCount || 0} reviews)</span>
            </div>

            <div className="flex items-center gap-3 mt-4">
              <span className="text-3xl font-bold">৳{product.price?.toFixed(0)}</span>
              {product.originalPrice && <span className="text-lg text-muted-foreground line-through">৳{product.originalPrice?.toFixed(0)}</span>}
              {discount && discount > 0 && <Badge className="bg-destructive/10 text-destructive border-destructive/20">Save {discount}%</Badge>}
            </div>

            <div className="mt-3">
              {product.stock > 10 ? <span className="text-green-600 text-sm font-medium flex items-center gap-1"><CheckCircle size={14} /> In Stock ({product.stock})</span>
                : product.stock > 0 ? <span className="text-amber-500 text-sm font-semibold flex items-center gap-1"><AlertTriangle size={14} /> Only {product.stock} left!</span>
                : <span className="text-destructive text-sm font-semibold">Out of Stock</span>}
            </div>

            {/* Social Share */}
            <ShareButtons product={product} />

            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Color: <span className="font-normal text-muted-foreground">{selectedColor || product.colors[0]}</span></p>
                <div className="flex gap-2 flex-wrap">{product.colors.map(color => (
                  <button key={color} onClick={() => setSelectedColor(color)} className={`px-3 py-1.5 rounded-lg border text-sm transition-all ${(selectedColor || product.colors![0]) === color ? 'border-primary bg-primary/10 text-primary' : 'border-border'}`}>{color}</button>
                ))}</div>
              </div>
            )}

            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-4">
                <p className="text-sm font-semibold mb-2">Size: <span className="font-normal text-muted-foreground">{selectedSize || product.sizes[0]}</span></p>
                <div className="flex gap-2 flex-wrap">{product.sizes.map(size => (
                  <button key={size} onClick={() => setSelectedSize(size)} className={`w-11 h-11 rounded-xl border text-sm font-medium transition-all ${(selectedSize || product.sizes![0]) === size ? 'border-primary bg-primary text-primary-foreground' : 'border-border'}`}>{size}</button>
                ))}</div>
              </div>
            )}

            <div className="mt-5 flex items-center gap-4">
              <p className="text-sm font-semibold">Quantity:</p>
              <div className="flex items-center gap-3 border border-border rounded-xl p-1">
                <button onClick={() => setQty(q => Math.max(1, q - 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"><Minus size={14} /></button>
                <span className="text-sm font-bold w-6 text-center">{qty}</span>
                <button onClick={() => setQty(q => Math.min(product.stock, q + 1))} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-muted"><Plus size={14} /></button>
              </div>
            </div>

            {/* Desktop action buttons */}
            <div className="hidden lg:flex gap-3 mt-6">
              <Button variant="outline" className="flex-1 h-12 font-semibold gap-2" onClick={handleAddToCart} disabled={product.stock === 0}>
                {addedToCart ? <><CheckCircle size={16} /> Added to Cart!</> : <><ShoppingCart size={16} /> Add to Cart</>}
              </Button>
              <Button className="flex-1 h-12 font-semibold" onClick={handleBuyNow} disabled={product.stock === 0}>Buy Now</Button>
            </div>

            {/* Trust Badges - আমাদের সুবিধাসমূহ */}
            <div className="mt-6 bg-muted/40 rounded-2xl p-4 border border-border">
              <h3 className="font-bold text-sm mb-3 text-foreground">আমাদের সুবিধাসমূহ</h3>
              <div className="grid grid-cols-2 gap-2.5">
                {[
                  { icon: Banknote, label: 'ক্যাশ অন ডেলিভারি', sub: 'পণ্য পেয়ে পেমেন্ট', color: 'text-green-600 bg-green-500/10' },
                  { icon: Smartphone, label: 'মোবাইল ব্যাংকিং', sub: 'bKash / Nagad', color: 'text-pink-500 bg-pink-500/10' },
                  { icon: RotateCcw, label: '৭ দিনে পণ্য ফেরত', sub: 'সহজ রিটার্ন পলিসি', color: 'text-blue-500 bg-blue-500/10' },
                  { icon: Shield, label: '১০০% টাকা ফেরত', sub: 'মানি ব্যাক গ্যারান্টি', color: 'text-amber-500 bg-amber-500/10' },
                  { icon: CheckCircle, label: '৯৯% অরিজিনাল', sub: 'প্রোডাক্ট গ্যারান্টি', color: 'text-emerald-600 bg-emerald-500/10' },
                  { icon: Truck, label: 'দ্রুত ডেলিভারি', sub: 'সারাদেশে পৌঁছে দেই', color: 'text-purple-500 bg-purple-500/10' },
                ].map(({ icon: Icon, label, sub, color }) => (
                  <div key={label} className="flex items-center gap-2.5 p-2.5 bg-card rounded-xl border border-border/50">
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${color}`}>
                      <Icon size={18} />
                    </div>
                    <div>
                      <p className="text-xs font-semibold leading-tight">{label}</p>
                      <p className="text-[10px] text-muted-foreground">{sub}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <Accordion type="multiple" className="mt-5" defaultValue={['description']}>
              <AccordionItem value="description"><AccordionTrigger className="text-sm font-semibold">Description</AccordionTrigger><AccordionContent className="text-sm text-muted-foreground leading-relaxed">{product.description}</AccordionContent></AccordionItem>
            </Accordion>

            {/* Reviews */}
            <div className="mt-6">
              <h2 className="font-bold text-base mb-4">Customer Reviews</h2>
              <div className="space-y-4">
                {staticReviews.map(review => (
                  <div key={review.id} className="border-b border-border/50 pb-4 last:border-0">
                    <div className="flex items-center gap-3 mb-2">
                      <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-sm">{review.userName[0]}</div>
                      <div>
                        <p className="text-sm font-semibold">{review.userName}</p>
                        <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} size={10} className={s <= review.rating ? 'fill-accent text-accent' : 'text-muted'} />)}</div>
                      </div>
                      <span className="ml-auto text-xs text-muted-foreground">{review.date}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{review.comment}</p>
                    <button className="text-xs text-muted-foreground mt-2 hover:text-primary flex items-center gap-1"><ThumbsUp size={12} /> Helpful ({review.helpful})</button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Similar Products */}
        {related.length > 0 && (
          <section className="mt-4 px-4 lg:px-0">
            <h2 className="font-bold text-base mb-4">Similar Products</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{related.map(p => <ProductCard key={p.id} product={p} />)}</div>
          </section>
        )}

        {/* Other Category Products */}
        {otherCategoryProducts.length > 0 && (
          <section className="mt-6 px-4 lg:px-0">
            <h2 className="font-bold text-base mb-4">You May Also Like</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">{otherCategoryProducts.map(p => <ProductCard key={p.id} product={p} />)}</div>
          </section>
        )}
      </div>

      {/* Mobile sticky action bar */}
      <div className="lg:hidden fixed bottom-16 left-0 right-0 p-3 bg-card border-t border-border z-30">
        <div className="flex gap-3 max-w-screen-xl mx-auto">
          <Button variant="outline" className="flex-1 h-11 font-semibold text-sm gap-2" onClick={handleAddToCart} disabled={product.stock === 0}>
            {addedToCart ? <><CheckCircle size={14} /> Added!</> : <><ShoppingCart size={14} /> Add to Cart</>}
          </Button>
          <Button className="flex-1 h-11 font-semibold text-sm" onClick={handleBuyNow} disabled={product.stock === 0}>Buy Now</Button>
        </div>
      </div>
    </div>
  );
}
