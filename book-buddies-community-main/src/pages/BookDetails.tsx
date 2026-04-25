import { useState, useEffect } from "react";
import { useParams, Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  ShoppingCart,
  MessageCircle,
  Users,
  Plus,
  ArrowLeft,
  BookOpen,
  Star,
  Share2,
  Heart,
  Loader2,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

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

export default function BookDetails() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [book, setBook] = useState<any>(null);
  const [seller, setSeller] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [recommendedBooks, setRecommendedBooks] = useState<any[]>([]);
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddingToCart, setIsAddingToCart] = useState(false);

  // Review form state
  const [userRating, setUserRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewComment, setReviewComment] = useState("");
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);

  useEffect(() => {
    const init = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setCurrentUserId(user.id);
      await fetchBook();
    };
    init();
  }, [id]);

  const fetchBook = async () => {
    setIsLoading(true);

    // Fetch book
    const { data: bookData, error } = await supabase
      .from("books")
      .select("*")
      .eq("id", id)
      .single();

    if (error || !bookData) {
      toast.error("Book not found");
      setIsLoading(false);
      return;
    }

    setBook(bookData);

    // Fetch seller profile
    const { data: sellerData } = await supabase
      .from("profiles")
      .select("id, full_name, username, avatar_url")
      .eq("id", bookData.seller_id)
      .single();

    setSeller(sellerData);

    // Fetch reviews for this book
    const { data: reviewData } = await supabase
      .from("reviews")
      .select("*, profiles(full_name, username, avatar_url)")
      .eq("book_id", id)
      .order("created_at", { ascending: false });

    setReviews(reviewData || []);

    // Fetch recommended books (same category, exclude current)
    if (bookData.category) {
      const { data: recData } = await supabase
        .from("books")
        .select("*")
        .eq("category", bookData.category)
        .eq("is_sold", false)
        .neq("id", id)
        .limit(3);

      setRecommendedBooks(recData || []);
    }

    setIsLoading(false);
  };

  const handleAddToCart = async () => {
    if (!currentUserId) { toast.error("Please login to add to cart"); return; }
    if (book?.seller_id === currentUserId) {
      toast.error("You can't buy your own book!");
      return;
    }

    setIsAddingToCart(true);

    // Check if already in cart
    const { data: existing } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", currentUserId)
      .eq("book_id", book.id)
      .single();

    if (existing) {
      toast.info("Book already in cart!");
      setIsAddingToCart(false);
      return;
    }

    const { error } = await supabase.from("cart").insert({
      user_id: currentUserId,
      book_id: book.id,
      quantity: 1,
    });

    if (error) {
      toast.error("Failed to add to cart");
    } else {
      toast.success(`"${book.title}" added to cart! 🛒`);
    }

    setIsAddingToCart(false);
  };

  const handleSubmitReview = async () => {
    if (!currentUserId) { toast.error("Please login to review"); return; }
    if (userRating === 0) { toast.error("Please select a rating"); return; }
    if (!reviewComment.trim()) { toast.error("Please write a comment"); return; }

    setIsSubmittingReview(true);

    const { error } = await supabase.from("reviews").insert({
      book_id: book.id,
      reviewer_id: currentUserId,
      rating: userRating,
      comment: reviewComment,
    });

    if (error) {
      toast.error("Failed to submit review");
    } else {
      toast.success("Review submitted! ⭐");
      setUserRating(0);
      setReviewComment("");
      fetchBook(); // Refresh reviews
    }

    setIsSubmittingReview(false);
  };

  const avgRating = reviews.length
    ? (reviews.reduce((sum, r) => sum + r.rating, 0) / reviews.length).toFixed(1)
    : null;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-accent" />
        </div>
      </div>
    );
  }

  if (!book) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-16 text-center">
          <p className="text-4xl mb-4">📚</p>
          <h1 className="text-2xl font-bold text-foreground mb-2">Book not found</h1>
          <Link to="/home" className="text-accent hover:underline mt-4 inline-block">
            Back to Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
        {/* Back Button */}
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6"
        >
          <Link
            to="/home"
            className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Back to Books
          </Link>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-12">
          {/* Book Cover */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="relative"
          >
            <div className="aspect-[3/4] rounded-3xl overflow-hidden shadow-hover">
              <img
                src={book.image_url || "https://via.placeholder.com/400x533?text=No+Cover"}
                alt={book.title}
                className="w-full h-full object-cover"
              />
            </div>

            {/* Sold Badge */}
            {book.is_sold && (
              <div className="absolute inset-0 bg-black/50 rounded-3xl flex items-center justify-center">
                <Badge className="bg-red-500 text-white text-lg px-6 py-2">SOLD</Badge>
              </div>
            )}

            {/* Floating Actions */}
            <div className="absolute top-4 right-4 flex gap-2">
              <Button
                size="icon"
                variant={isWishlisted ? "warm" : "secondary"}
                className="rounded-full"
                onClick={() => {
                  setIsWishlisted(!isWishlisted);
                  toast.success(isWishlisted ? "Removed from wishlist" : "Added to wishlist ❤️");
                }}
              >
                <Heart className={`w-5 h-5 ${isWishlisted ? "fill-current" : ""}`} />
              </Button>
              <Button
                size="icon"
                variant="secondary"
                className="rounded-full"
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Link copied!");
                }}
              >
                <Share2 className="w-5 h-5" />
              </Button>
            </div>
          </motion.div>

          {/* Book Details */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="space-y-6"
          >
            {/* Category & Condition */}
            <div className="flex gap-2 flex-wrap">
              {book.category && (
                <Badge variant="secondary" className="capitalize">
                  {book.category}
                </Badge>
              )}
              {book.condition && (
                <Badge className={`${conditionColors[book.condition]} border`}>
                  {conditionLabel[book.condition] || book.condition}
                </Badge>
              )}
            </div>

            {/* Title & Author */}
            <div>
              <h1 className="text-3xl lg:text-4xl font-bold text-foreground mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-muted-foreground">by {book.author}</p>
            </div>

            {/* Rating */}
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <Star
                  key={star}
                  className={`w-5 h-5 ${
                    avgRating && star <= parseFloat(avgRating)
                      ? "text-yellow-500 fill-yellow-500"
                      : "text-muted"
                  }`}
                />
              ))}
              <span className="text-muted-foreground">
                {avgRating
                  ? `(${avgRating} • ${reviews.length} review${reviews.length !== 1 ? "s" : ""})`
                  : "No reviews yet"}
              </span>
            </div>

            {/* Price */}
            <div className="flex items-baseline gap-3">
              <span className="text-4xl font-bold text-accent">₹{book.price}</span>
              {book.original_price && (
                <>
                  <span className="text-lg text-muted-foreground line-through">
                    ₹{book.original_price}
                  </span>
                  <Badge variant="secondary" className="text-green-600">
                    Save {Math.floor((1 - book.price / book.original_price) * 100)}%
                  </Badge>
                </>
              )}
            </div>

            {/* Description */}
            <div className="bg-card rounded-2xl p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                About this Book
              </h3>
              <p className="text-muted-foreground leading-relaxed">
                {book.description || "No description provided by the seller."}
              </p>
            </div>

            {/* Seller Info */}
            {seller && (
              <div className="bg-card rounded-2xl p-6 shadow-soft">
                <h3 className="font-semibold text-foreground mb-3">Seller</h3>
                <div className="flex items-center gap-4">
                  <img
                    src={
                      seller.avatar_url ||
                      `https://api.dicebear.com/7.x/avataaars/svg?seed=${seller.id}`
                    }
                    alt={seller.full_name}
                    className="w-12 h-12 rounded-full bg-muted"
                  />
                  <div className="flex-1">
                    <p className="font-medium text-foreground">
                      {seller.full_name || seller.username || "Book Seller"}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      ⭐ {reviews.length} reviews received
                    </p>
                  </div>
                  {currentUserId !== seller.id && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => navigate("/chat")}
                    >
                      <MessageCircle className="w-4 h-4 mr-1" />
                      Chat
                    </Button>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            {!book.is_sold && currentUserId !== book.seller_id && (
              <div className="flex gap-4">
                <Button
                  size="lg"
                  variant="warm"
                  className="flex-1"
                  onClick={handleAddToCart}
                  disabled={isAddingToCart}
                >
                  {isAddingToCart ? (
                    <Loader2 className="w-5 h-5 animate-spin mr-2" />
                  ) : (
                    <ShoppingCart className="w-5 h-5 mr-2" />
                  )}
                  Add to Cart
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => navigate("/chat")}
                >
                  <MessageCircle className="w-5 h-5 mr-2" />
                  Chat with Seller
                </Button>
              </div>
            )}

            {book.is_sold && (
              <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-center">
                <p className="text-red-600 font-semibold">This book has been sold</p>
                <Button
                  variant="warm"
                  className="mt-3"
                  onClick={() => navigate("/home")}
                >
                  Find Similar Books
                </Button>
              </div>
            )}

            {currentUserId === book.seller_id && (
              <div className="bg-accent/10 border border-accent/20 rounded-2xl p-4 text-center">
                <p className="text-accent font-semibold">This is your listing</p>
              </div>
            )}

            {/* Community Section */}
            <div className="bg-card rounded-2xl p-6 shadow-soft">
              <h3 className="font-semibold text-foreground mb-3 flex items-center gap-2">
                <Users className="w-5 h-5 text-accent" />
                Book Community
              </h3>
              <p className="text-muted-foreground mb-4">
                Discuss this book with fellow readers!
              </p>
              <Button variant="warm" className="w-full" asChild>
                <Link to="/communities">
                  <Users className="w-4 h-4 mr-2" />
                  Explore Communities
                </Link>
              </Button>
            </div>
          </motion.div>
        </div>

        {/* ── Reviews Section ── */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="mt-16"
        >
          <h2 className="text-2xl font-bold text-foreground mb-6">
            Reviews {reviews.length > 0 && `(${reviews.length})`}
          </h2>

          {/* Write a Review */}
          {currentUserId && currentUserId !== book.seller_id && (
            <div className="bg-card rounded-2xl p-6 shadow-soft mb-8">
              <h3 className="font-semibold text-foreground mb-4">Write a Review</h3>

              {/* Star Rating Picker */}
              <div className="flex items-center gap-1 mb-4">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    onMouseEnter={() => setHoverRating(star)}
                    onMouseLeave={() => setHoverRating(0)}
                    onClick={() => setUserRating(star)}
                  >
                    <Star
                      className={`w-7 h-7 transition-colors ${
                        star <= (hoverRating || userRating)
                          ? "text-yellow-500 fill-yellow-500"
                          : "text-muted-foreground"
                      }`}
                    />
                  </button>
                ))}
                {userRating > 0 && (
                  <span className="ml-2 text-sm text-muted-foreground">
                    {["", "Poor", "Fair", "Good", "Great", "Excellent"][userRating]}
                  </span>
                )}
              </div>

              <textarea
                className="w-full border rounded-xl p-3 text-sm min-h-[100px] bg-background mb-4"
                placeholder="Share your thoughts about this book..."
                value={reviewComment}
                onChange={(e) => setReviewComment(e.target.value)}
              />

              <Button
                variant="warm"
                onClick={handleSubmitReview}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? (
                  <Loader2 className="w-4 h-4 animate-spin mr-2" />
                ) : (
                  <Star className="w-4 h-4 mr-2" />
                )}
                Submit Review
              </Button>
            </div>
          )}

          {/* Reviews List */}
          {reviews.length === 0 ? (
            <div className="text-center py-12 bg-card rounded-2xl">
              <p className="text-3xl mb-2">⭐</p>
              <p className="text-muted-foreground">
                No reviews yet. Be the first to review!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {reviews.map((review, index) => (
                <motion.div
                  key={review.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.05 }}
                  className="bg-card rounded-2xl p-6 shadow-soft"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <img
                      src={
                        review.profiles?.avatar_url ||
                        `https://api.dicebear.com/7.x/avataaars/svg?seed=${review.reviewer_id}`
                      }
                      alt="Reviewer"
                      className="w-10 h-10 rounded-full bg-muted"
                    />
                    <div>
                      <p className="font-medium text-foreground">
                        {review.profiles?.full_name ||
                          review.profiles?.username ||
                          "Reader"}
                      </p>
                      <div className="flex items-center gap-1">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star
                            key={star}
                            className={`w-4 h-4 ${
                              star <= review.rating
                                ? "text-yellow-500 fill-yellow-500"
                                : "text-muted"
                            }`}
                          />
                        ))}
                      </div>
                    </div>
                    <span className="ml-auto text-xs text-muted-foreground">
                      {new Date(review.created_at).toLocaleDateString("en-IN", {
                        day: "numeric",
                        month: "short",
                        year: "numeric",
                      })}
                    </span>
                  </div>
                  <p className="text-muted-foreground">{review.comment}</p>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>

        {/* Recommended Books */}
        {recommendedBooks.length > 0 && (
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-16"
          >
            <h2 className="text-2xl font-bold text-foreground mb-6">
              More in {book.category}
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {recommendedBooks.map((rec) => (
                <Link key={rec.id} to={`/book/${rec.id}`}>
                  <div className="bg-card rounded-2xl overflow-hidden shadow-soft hover:shadow-hover transition-all group cursor-pointer">
                    <div className="aspect-[3/4] overflow-hidden">
                      <img
                        src={rec.image_url || "https://via.placeholder.com/300x400?text=Book"}
                        alt={rec.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    </div>
                    <div className="p-4">
                      <h3 className="font-semibold text-foreground line-clamp-1">{rec.title}</h3>
                      <p className="text-sm text-muted-foreground">{rec.author}</p>
                      <p className="text-accent font-bold mt-2">₹{rec.price}</p>
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.section>
        )}
      </main>
    </div>
  );
}