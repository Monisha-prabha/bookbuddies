import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { ShoppingCart, MessageCircle, Eye, Star } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Link } from "react-router-dom";
import { supabase } from "@/lib/supabase";

interface BookCardProps {
  book: any;
  onAddToCart: (book: any) => void;
  index?: number;
}

const conditionColors: Record<string, string> = {
  new:      "bg-green-500/10 text-green-600 border-green-500/20",
  like_new: "bg-blue-500/10 text-blue-600 border-blue-500/20",
  good:     "bg-yellow-500/10 text-yellow-600 border-yellow-500/20",
  fair:     "bg-orange-500/10 text-orange-600 border-orange-500/20",
};

const conditionLabel: Record<string, string> = {
  new:      "New",
  like_new: "Like New",
  good:     "Good",
  fair:     "Fair",
};

export function BookCard({ book, onAddToCart, index = 0 }: BookCardProps) {
  const [avgRating, setAvgRating] = useState<number | null>(null);
  const [reviewCount, setReviewCount] = useState(0);

  useEffect(() => {
    const fetchRating = async () => {
      const { data } = await supabase
        .from("reviews")
        .select("rating")
        .eq("book_id", book.id);

      if (data && data.length > 0) {
        const avg = data.reduce((sum, r) => sum + r.rating, 0) / data.length;
        setAvgRating(parseFloat(avg.toFixed(1)));
        setReviewCount(data.length);
      }
    };

    if (book?.id) fetchRating();
  }, [book.id]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className="book-card group overflow-hidden flex flex-col"
    >
      {/* Book Cover */}
      <Link to={`/book/${book.id}`} className="block relative overflow-hidden aspect-[3/4]">
        <img
          src={book.image_url || "https://via.placeholder.com/300x400?text=No+Cover"}
          alt={book.title}
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
        />

        {/* Hover Overlay — desktop only */}
        <div className="hidden sm:block absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />

        {/* Quick View — desktop only */}
        <div className="hidden sm:flex absolute bottom-4 left-4 right-4 gap-2 opacity-0 translate-y-4 group-hover:opacity-100 group-hover:translate-y-0 transition-all duration-300">
          <Button size="sm" variant="heroOutline" className="flex-1">
            <Eye className="w-4 h-4 mr-1" />
            View Details
          </Button>
        </div>

        {/* Condition Badge */}
        {book.condition && (
          <Badge
            className={`absolute top-2 right-2 border text-[10px] sm:text-xs px-1.5 py-0.5 ${
              conditionColors[book.condition] || "bg-secondary"
            }`}
          >
            {conditionLabel[book.condition] || book.condition}
          </Badge>
        )}

        {/* Sold Overlay */}
        {book.is_sold && (
          <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
            <Badge className="bg-red-500 text-white border-0 text-xs sm:text-sm px-3 py-1">
              SOLD
            </Badge>
          </div>
        )}
      </Link>

      {/* Book Info */}
      <div className="p-2.5 sm:p-4 flex flex-col gap-1.5 sm:gap-3 flex-1">

        {/* Title & Author */}
        <div>
          <h3 className="font-semibold text-xs sm:text-base text-foreground leading-tight group-hover:text-accent transition-colors" style={{ display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', minHeight: '2.5rem' }}>
         {book.title}
        </h3>
          <p className="text-[11px] sm:text-sm text-muted-foreground line-clamp-1 mt-0.5">
            {book.author}
          </p>
        </div>

        {/* Star Rating */}
        <div className="flex items-center gap-0.5">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              className={`w-3 h-3 sm:w-3.5 sm:h-3.5 ${
                avgRating && star <= Math.round(avgRating)
                  ? "text-yellow-500 fill-yellow-500"
                  : "text-muted-foreground"
              }`}
            />
          ))}
          <span className="text-[10px] sm:text-xs text-muted-foreground ml-1">
            {avgRating ? `${avgRating}` : ""}
            {reviewCount > 0 ? ` (${reviewCount})` : ""}
          </span>
        </div>

        {/* Price + Category */}
        <div className="flex items-center justify-between">
          <span className="text-base sm:text-xl font-bold text-accent">
            ₹{book.price}
          </span>
          {book.category && (
            <Badge variant="secondary" className="text-[10px] sm:text-xs capitalize hidden sm:inline-flex">
              {book.category}
            </Badge>
          )}
        </div>

        {/* Action Buttons */}
        {!book.is_sold ? (
          <div className="flex gap-1.5 sm:gap-2 mt-auto pt-1">
            {/* Mobile: icon-only cart button */}
            <motion.div whileTap={{ scale: 0.92 }} className="flex-1">
              <Button
                size="sm"
                variant="warm"
                className="w-full text-xs sm:text-sm h-8 sm:h-9"
                onClick={() => onAddToCart(book)}
              >
                <ShoppingCart className="w-3.5 h-3.5 sm:mr-1" />
                <span className="hidden sm:inline">Add to Cart</span>
              </Button>
            </motion.div>

            {/* Chat button */}
            <Button
              size="sm"
              variant="outline"
              className="h-8 sm:h-9 w-8 sm:w-9 p-0"
              asChild
            >
              <Link to="/chat">
                <MessageCircle className="w-3.5 h-3.5" />
              </Link>
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            variant="secondary"
            className="w-full text-xs sm:text-sm h-8 sm:h-9"
            disabled
          >
            Sold Out
          </Button>
        )}
      </div>
    </motion.div>
  );
}