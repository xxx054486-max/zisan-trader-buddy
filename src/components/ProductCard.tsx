import { Link } from 'react-router-dom';
import { Star, ShoppingCart } from 'lucide-react';
import { Product } from '@/hooks/useFirestoreData';
import { useCart } from '@/contexts/CartContext';
import { motion } from 'framer-motion';

interface ProductCardProps {
  product: Product;
}

export default function ProductCard({ product }: ProductCardProps) {
  const { addToCart } = useCart();
  const discount = product.originalPrice
    ? Math.round((1 - product.price / product.originalPrice) * 100)
    : null;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    await addToCart({
      productId: product.id,
      name: product.name,
      price: product.price,
      originalPrice: product.originalPrice,
      image: product.images?.[0] || '',
      stock: product.stock,
    });
  };

  return (
    <motion.div whileHover={{ y: -2 }} className="group h-full">
      <Link to={`/product/${product.id}`} className="flex flex-col h-full bg-card rounded-xl overflow-hidden border border-border/60 card-hover">
        <div className="relative aspect-square overflow-hidden">
          <img src={product.images?.[0] || '/placeholder.svg'} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" loading="lazy" />
          {discount && discount > 0 && (
            <span className="absolute top-2 left-2 bg-destructive text-destructive-foreground text-[11px] font-bold px-1.5 py-0.5 rounded-md">-{discount}%</span>
          )}
          {product.stock < 10 && product.stock > 0 && (
            <span className="absolute bottom-2 left-2 bg-accent text-accent-foreground text-[10px] font-semibold px-1.5 py-0.5 rounded-md">Only {product.stock} left</span>
          )}
        </div>
        <div className="p-3 flex flex-col flex-1">
          <p className="text-xs text-muted-foreground mb-0.5">{product.brand}</p>
          <h3 className="text-sm font-medium line-clamp-2 mb-2 flex-1">{product.name}</h3>
          <div className="flex items-center gap-1 mb-2">
            <Star size={11} className="fill-accent text-accent" />
            <span className="text-xs font-medium">{product.rating || 0}</span>
            <span className="text-xs text-muted-foreground">({product.reviewCount || 0})</span>
          </div>
          <div className="flex items-center justify-between mt-auto">
            <div>
              <span className="font-bold text-sm">৳{product.price?.toFixed(0)}</span>
              {product.originalPrice && <span className="text-xs text-muted-foreground line-through ml-1">৳{product.originalPrice?.toFixed(0)}</span>}
            </div>
            <button onClick={handleAddToCart} className="w-7 h-7 flex items-center justify-center rounded-full bg-primary text-primary-foreground hover:bg-primary/90 transition-colors">
              <ShoppingCart size={13} />
            </button>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
