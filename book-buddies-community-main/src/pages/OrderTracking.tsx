import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Link, useLocation } from "react-router-dom";
import {
  Package,
  Truck,
  CheckCircle2,
  MapPin,
  ArrowLeft,
  Home as HomeIcon,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const STATUS_STEPS = [
  { key: "pending",   label: "Order Placed", icon: CheckCircle2 },
  { key: "confirmed", label: "Packed",        icon: Package      },
  { key: "shipped",   label: "Shipped",       icon: Truck        },
  { key: "delivered", label: "Delivered",     icon: MapPin       },
];

// Which index each status maps to
const STATUS_INDEX: Record<string, number> = {
  pending:   0,
  confirmed: 1,
  shipped:   2,
  delivered: 3,
  cancelled: -1,
};

export default function OrderTracking() {
  const location = useLocation();
  const passedOrderId = location.state?.orderId;

  const [orders, setOrders] = useState<any[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setIsLoading(false); return; }

    const { data, error } = await supabase
      .from("orders")
      .select("*, books(title, author, image_url, price)")
      .eq("buyer_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      toast.error("Failed to load orders");
    } else {
      setOrders(data || []);
      // Auto select passed order or latest
      if (passedOrderId) {
        const found = (data || []).find((o) => o.id === passedOrderId);
        setSelectedOrder(found || data?.[0] || null);
      } else {
        setSelectedOrder(data?.[0] || null);
      }
    }
    setIsLoading(false);
  };

  const currentStepIndex = selectedOrder
    ? STATUS_INDEX[selectedOrder.status] ?? 0
    : 0;

  const formatDate = (dateStr: string) =>
    new Date(dateStr).toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });

  const getExpectedDelivery = (createdAt: string) => {
    const date = new Date(createdAt);
    date.setDate(date.getDate() + 5);
    return date.toLocaleDateString("en-IN", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-3xl">
        {/* Back */}
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
            Back to Home
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="space-y-4">
            {[1, 2].map((i) => (
              <div key={i} className="bg-card rounded-2xl h-32 animate-pulse" />
            ))}
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-5xl mb-4">📦</p>
            <h2 className="text-2xl font-bold text-foreground mb-2">No orders yet</h2>
            <p className="text-muted-foreground mb-6">
              Start shopping for books!
            </p>
            <Button variant="warm" asChild>
              <Link to="/home">Explore Books</Link>
            </Button>
          </div>
        ) : (
          <>
            {/* Order selector if multiple orders */}
            {orders.length > 1 && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6 flex gap-2 overflow-x-auto pb-2"
              >
                {orders.map((order) => (
                  <button
                    key={order.id}
                    onClick={() => setSelectedOrder(order)}
                    className={cn(
                      "shrink-0 px-4 py-2 rounded-full text-sm font-medium border transition-all",
                      selectedOrder?.id === order.id
                        ? "bg-accent text-white border-accent"
                        : "border-border text-muted-foreground hover:border-accent"
                    )}
                  >
                    #{order.id.slice(0, 8).toUpperCase()}
                  </button>
                ))}
              </motion.div>
            )}

            {selectedOrder && (
              <>
                {/* Header */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center mb-12"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-accent/10 text-accent text-sm mb-4">
                    <Truck className="w-4 h-4" />
                    Order #{selectedOrder.id.slice(0, 8).toUpperCase()}
                  </div>
                  <h1 className="text-3xl font-bold text-foreground mb-2">
                    {selectedOrder.status === "delivered"
                      ? "Order Delivered! 🎉"
                      : selectedOrder.status === "cancelled"
                      ? "Order Cancelled 😔"
                      : "Your Order is on the Way! 📦"}
                  </h1>
                  <p className="text-muted-foreground">
                    {selectedOrder.status === "delivered"
                      ? `Delivered on ${formatDate(selectedOrder.updated_at || selectedOrder.created_at)}`
                      : `Expected delivery: ${getExpectedDelivery(selectedOrder.created_at)}`}
                  </p>
                </motion.div>

                {/* Progress Steps */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.2 }}
                  className="bg-card rounded-3xl p-8 shadow-card mb-8"
                >
                  <div className="relative">
                    {STATUS_STEPS.map((step, index) => {
                      const Icon = step.icon;
                      const isCompleted = index <= currentStepIndex;
                      const isLast = index === STATUS_STEPS.length - 1;

                      return (
                        <div key={step.key} className="relative">
                          <div className="flex items-start gap-4">
                            {/* Icon */}
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                              transition={{ delay: 0.3 + index * 0.15 }}
                              className={cn(
                                "relative z-10 w-12 h-12 rounded-full flex items-center justify-center shrink-0",
                                isCompleted
                                  ? "gradient-warm shadow-glow"
                                  : "bg-secondary border-2 border-dashed border-muted-foreground"
                              )}
                            >
                              <Icon
                                className={cn(
                                  "w-6 h-6",
                                  isCompleted ? "text-white" : "text-muted-foreground"
                                )}
                              />
                            </motion.div>

                            {/* Label */}
                            <div className="flex-1 pb-8">
                              <motion.div
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.4 + index * 0.15 }}
                              >
                                <h3
                                  className={cn(
                                    "font-semibold",
                                    isCompleted
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {step.label}
                                </h3>
                                <p className="text-sm text-muted-foreground">
                                  {index === 0
                                    ? formatDate(selectedOrder.created_at)
                                    : isCompleted
                                    ? "Completed"
                                    : "Pending"}
                                </p>
                              </motion.div>
                            </div>
                          </div>

                          {/* Line */}
                          {!isLast && (
                            <div className="absolute left-6 top-12 w-0.5 h-8 -translate-x-1/2">
                              <motion.div
                                initial={{ height: 0 }}
                                animate={{ height: "100%" }}
                                transition={{
                                  delay: 0.5 + index * 0.15,
                                  duration: 0.3,
                                }}
                                className={cn(
                                  "w-full",
                                  isCompleted ? "bg-accent" : "bg-muted"
                                )}
                              />
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </motion.div>

                {/* Order Item */}
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="bg-card rounded-2xl p-6 shadow-soft mb-8"
                >
                  <h2 className="text-lg font-semibold text-foreground mb-4">
                    Order Item
                  </h2>

                  <div className="flex items-center gap-4 py-2 border-b border-border">
                    <img
                      src={
                        selectedOrder.books?.image_url ||
                        "https://via.placeholder.com/60x80?text=Book"
                      }
                      alt={selectedOrder.books?.title}
                      className="w-14 h-20 object-cover rounded-lg"
                    />
                    <div className="flex-1">
                      <p className="font-medium text-foreground">
                        {selectedOrder.books?.title || "Book"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.books?.author}
                      </p>
                    </div>
                    <span className="font-semibold text-accent">
                      ₹{selectedOrder.total_price}
                    </span>
                  </div>

                  {/* Shipping address */}
                  {selectedOrder.shipping_address && (
                    <div className="mt-4 pt-2">
                      <p className="text-sm font-medium text-foreground flex items-center gap-1 mb-1">
                        <MapPin className="w-4 h-4 text-accent" />
                        Delivery Address
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {selectedOrder.shipping_address}
                      </p>
                    </div>
                  )}

                  <div className="flex justify-between items-center pt-4 border-t border-border mt-4">
                    <span className="font-semibold text-foreground">Total Paid</span>
                    <span className="text-xl font-bold text-accent">
                      ₹{selectedOrder.total_price}
                    </span>
                  </div>
                </motion.div>
              </>
            )}

            {/* Actions */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.6 }}
              className="flex gap-4"
            >
              <Button variant="outline" className="flex-1" asChild>
                <Link to="/profile">View All Orders</Link>
              </Button>
              <Button variant="warm" className="flex-1" asChild>
                <Link to="/home">
                  <HomeIcon className="w-4 h-4 mr-2" />
                  Continue Shopping
                </Link>
              </Button>
            </motion.div>
          </>
        )}
      </main>
    </div>
  );
}