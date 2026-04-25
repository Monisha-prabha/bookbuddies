import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Search, X, TrendingUp } from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { BookCard } from "@/components/books/BookCard";
import { GenreFilter } from "@/components/books/GenreFilter";
import { FriendSuggestions } from "@/components/friends/FriendSuggestions";
import { toast } from "sonner";
import { supabase } from "../lib/supabase";

export default function Home() {
  const [selectedGenre, setSelectedGenre] = useState("All");
  const [searchQuery, setSearchQuery] = useState("");
  const [books, setBooks] = useState<any[]>([]);
  const [cartCount, setCartCount] = useState(0);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchBooks = async () => {
      setIsLoading(true);

      let query = supabase
        .from("books")
        .select("*")
        .eq("is_sold", false)
        .order("created_at", { ascending: false });

      if (selectedGenre !== "All") {
        query = query.eq("category", selectedGenre.toLowerCase());
      }

      const { data, error } = await query;

      if (error) {
        toast.error("Failed to load books");
        setIsLoading(false);
        return;
      }

      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const filtered = (data || []).filter(
          (book) =>
            book.title?.toLowerCase().includes(q) ||
            book.author?.toLowerCase().includes(q) ||
            book.description?.toLowerCase().includes(q)
        );
        setBooks(filtered);
      } else {
        setBooks(data || []);
      }

      setIsLoading(false);
    };

    fetchBooks();
  }, [selectedGenre, searchQuery]);

  useEffect(() => {
    const fetchCartCount = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;
      const { count } = await supabase
        .from("cart")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id);
      setCartCount(count || 0);
    };
    fetchCartCount();
  }, []);

  const handleAddToCart = async (book: any) => {
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      toast.error("Please login to add books to cart");
      return;
    }

    const { data: existing } = await supabase
      .from("cart")
      .select("id")
      .eq("user_id", user.id)
      .eq("book_id", book.id)
      .single();

    if (existing) {
      toast.info("Book already in cart!");
      return;
    }

    const { error } = await supabase.from("cart").insert({
      user_id: user.id,
      book_id: book.id,
      quantity: 1,
    });

    if (error) {
      toast.error("Failed to add to cart");
    } else {
      setCartCount((prev) => prev + 1);
      toast.success(`"${book.title}" added to cart!`, {
        description: `₹${book.price} • ${book.condition}`,
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-3 sm:px-4 py-6 sm:py-8">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <h1 className="text-2xl sm:text-3xl font-bold text-foreground mb-1">
            Discover Your Next Read 📚
          </h1>
          <p className="text-sm sm:text-base text-muted-foreground">
            Browse pre-loved books from fellow readers
          </p>
        </motion.div>

        <div className="flex flex-col lg:flex-row gap-6 lg:gap-8">
          {/* Main Content */}
          <div className="flex-1 min-w-0">

            {/* Search Bar */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative mb-4"
            >
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search by title, author..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-11 pr-10 py-2.5 rounded-2xl border border-border bg-card text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent text-sm"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </motion.div>

            {/* Genre Filter */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-4"
            >
              <GenreFilter
                selectedGenre={selectedGenre}
                onSelectGenre={setSelectedGenre}
              />
            </motion.div>

            {/* Trending Label */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.2 }}
              className="flex items-center gap-2 mb-3"
            >
              <TrendingUp className="w-4 h-4 text-accent" />
              <span className="font-medium text-sm text-foreground">
                {searchQuery
                  ? `Results for "${searchQuery}"`
                  : selectedGenre === "All"
                  ? "Trending Books"
                  : selectedGenre}
              </span>
              <span className="text-xs text-muted-foreground">
                ({books.length} books)
              </span>
            </motion.div>

            {/* Loading State */}
            {isLoading ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="bg-card rounded-2xl h-64 animate-pulse" />
                ))}
              </div>
            ) : books.length === 0 ? (
              <div className="text-center py-16">
                <p className="text-4xl mb-4">📚</p>
                <p className="text-xl font-semibold text-foreground mb-2">No books found</p>
                <p className="text-muted-foreground text-sm">
                  {searchQuery
                    ? `No books match "${searchQuery}"`
                    : selectedGenre !== "All"
                    ? `No books in ${selectedGenre} genre yet`
                    : "Be the first to list a book!"}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="mt-4 text-accent underline text-sm"
                  >
                    Clear search
                  </button>
                )}
              </div>
            ) : (
              /* Book Grid — 2 cols on mobile, 2 on tablet, 3 on desktop */
              <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-6">
                {books.map((book, index) => (
                  <BookCard
                    key={book.id}
                    book={book}
                    onAddToCart={handleAddToCart}
                    index={index}
                  />
                ))}
              </div>
            )}
          </div>

          {/* Sidebar — hidden on mobile, shows on desktop */}
          <div className="hidden lg:block lg:w-80 space-y-6">
            <FriendSuggestions />

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3 }}
              className="bg-card rounded-2xl p-6 shadow-card"
            >
              <h3 className="font-semibold text-lg mb-4">Your Activity</h3>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Books Listed</span>
                  <span className="font-semibold text-foreground">{books.length}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Cart Items</span>
                  <span className="font-semibold text-accent">{cartCount}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground">Communities</span>
                  <span className="font-semibold text-foreground">3</span>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </main>
    </div>
  );
}