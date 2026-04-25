import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  Trash2,
  ShoppingBag,
  ArrowRight,
  ArrowLeft,
  Tag,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

export default function Cart() {
  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data, error } = await supabase
      .from("cart")
      .select("id, quantity, books(id, title, author, price, condition, image_url)")
      .eq("user_id", user.id);

    if (error) {
      toast.error("Failed to load cart");
    } else {
      setCartItems(data || []);
    }
    setIsLoading(false);
  };

  const removeItem = async (cartId: string) => {
    const { error } = await supabase
      .from("cart")
      .delete()
      .eq("id", cartId);

    if (error) {
      toast.error("Failed to remove item");
    } else {
      setCartItems((prev) => prev.filter((item) => item.id !== cartId));
      toast.success("Item removed from cart");
    }
  };

  const subtotal = cartItems.reduce(
    (sum, item) => sum + (item.books?.price || 0) * item.quantity, 0
  );
  const discount = Math.floor(subtotal * 0.1);
  const total = subtotal - discount;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <main className="container mx-auto px-4 py-8">
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8">
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
            Continue Shopping
          </Link>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-3xl font-bold text-foreground mb-8 flex items-center gap-3"
        >
          <ShoppingBag className="w-8 h-8 text-accent" />
          Your Cart
          <span className="text-lg font-normal text-muted-foreground">
            ({cartItems.length} items)
          </span>
        </motion.h1>

        {cartItems.length === 0 ? (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center py-16"
          >
            <ShoppingBag className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Your cart is empty
            </h2>
            <p className="text-muted-foreground mb-6">
              Start adding some amazing books!
            </p>
            <Button variant="warm" asChild>
              <Link to="/home">Explore Books</Link>
            </Button>
          </motion.div>
        ) : (
          <div className="grid lg:grid-cols-3 gap-8">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {cartItems.map((item, index) => (
                <motion.div
                  key={item.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-card rounded-2xl p-4 shadow-soft flex gap-4"
                >
                  <Link to={`/book/${item.books?.id}`}>
                    <img
                      src={item.books?.image_url || "https://via.placeholder.com/96x128?text=Book"}
                      alt={item.books?.title}
                      className="w-24 h-32 object-cover rounded-xl"
                    />
                  </Link>
                  <div className="flex-1">
                    <Link
                      to={`/book/${item.books?.id}`}
                      className="font-semibold text-foreground hover:text-accent transition-colors"
                    >
                      {item.books?.title}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {item.books?.author}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {item.books?.condition}
                    </p>
                    <div className="flex items-center justify-between mt-4">
                      <span className="font-bold text-accent">
                        ₹{item.books?.price}
                      </span>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive hover:text-destructive"
                        onClick={() => removeItem(item.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Order Summary */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2 }}
              className="lg:sticky lg:top-24 h-fit"
            >
              <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
                <h2 className="text-xl font-semibold text-foreground">
                  Order Summary
                </h2>

                <div className="space-y-3 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span className="font-medium text-foreground">₹{subtotal}</span>
                  </div>
                  <div className="flex justify-between text-accent">
                    <span className="flex items-center gap-1">
                      <Tag className="w-4 h-4" />
                      Discount (10%)
                    </span>
                    <span>-₹{discount}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Delivery</span>
                    <span className="text-accent font-medium">FREE</span>
                  </div>
                </div>

                <div className="border-t border-border pt-4">
                  <div className="flex justify-between text-lg font-bold">
                    <span className="text-foreground">Total</span>
                    <span className="text-accent">₹{total}</span>
                  </div>
                </div>

                <Button variant="warm" size="lg" className="w-full" asChild>
                  <Link to="/checkout">
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5 ml-2" />
                  </Link>
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Free delivery on orders above ₹499
                </p>
              </div>
            </motion.div>
          </div>
        )}
      </main>
    </div>
  );
}