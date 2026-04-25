import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  CreditCard,
  Smartphone,
  Building2,
  Wallet,
  Check,
  MapPin,
  ArrowLeft,
  Shield,
  Loader2,
  X,
  Lock,
  AlertCircle,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { supabase } from "../lib/supabase";
import { toast } from "sonner";

const paymentMethods = [
  { id: "upi", name: "UPI", icon: Smartphone, description: "Google Pay, PhonePe, Paytm" },
  { id: "card", name: "Debit / Credit Card", icon: CreditCard, description: "Visa, Mastercard, RuPay" },
  { id: "netbanking", name: "Net Banking", icon: Building2, description: "All major banks" },
  { id: "cod", name: "Cash on Delivery", icon: Wallet, description: "Pay when you receive" },
];

const banks = [
  "State Bank of India",
  "HDFC Bank",
  "ICICI Bank",
  "Axis Bank",
  "Kotak Mahindra Bank",
  "Punjab National Bank",
];

// ── Inline error component ──
function FieldError({ message }: { message: string }) {
  if (!message) return null;
  return (
    <motion.p
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center gap-1 text-red-500 text-xs mt-1"
    >
      <AlertCircle className="w-3 h-3 flex-shrink-0" />
      {message}
    </motion.p>
  );
}

// ── Fake Payment Modal ──
function PaymentModal({
  method,
  total,
  onSuccess,
  onClose,
}: {
  method: string;
  total: number;
  onSuccess: () => void;
  onClose: () => void;
}) {
  const [step, setStep] = useState<"input" | "processing" | "success">("input");
  const [upiId, setUpiId] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [cardExpiry, setCardExpiry] = useState("");
  const [cardCvv, setCardCvv] = useState("");
  const [cardName, setCardName] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const formatCardNumber = (val: string) =>
    val.replace(/\D/g, "").slice(0, 16).replace(/(.{4})/g, "$1 ").trim();

  const formatExpiry = (val: string) => {
    const clean = val.replace(/\D/g, "").slice(0, 4);
    if (clean.length >= 3) return clean.slice(0, 2) + "/" + clean.slice(2);
    return clean;
  };

  const handleConfirm = () => {
    const newErrors: Record<string, string> = {};

    if (method === "upi") {
      if (!upiId.trim()) newErrors.upiId = "UPI ID is required";
      else if (!upiId.includes("@")) newErrors.upiId = "Enter a valid UPI ID (e.g. name@upi)";
    }

    if (method === "card") {
      if (!cardNumber.trim()) newErrors.cardNumber = "Card number is required";
      else if (cardNumber.replace(/\s/g, "").length < 16) newErrors.cardNumber = "Enter a valid 16-digit card number";

      if (!cardExpiry.trim()) newErrors.cardExpiry = "Expiry date is required";
      else if (cardExpiry.length < 5) newErrors.cardExpiry = "Enter a valid expiry (MM/YY)";

      if (!cardCvv.trim()) newErrors.cardCvv = "CVV is required";
      else if (cardCvv.length < 3) newErrors.cardCvv = "CVV must be 3 digits";

      if (!cardName.trim()) newErrors.cardName = "Cardholder name is required";
    }

    if (method === "netbanking") {
      if (!selectedBank) newErrors.bank = "Please select your bank";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    setErrors({});
    setStep("processing");
    setTimeout(() => {
      setStep("success");
      setTimeout(() => onSuccess(), 1500);
    }, 2500);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.9, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.9, y: 20 }}
        className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-400 p-5 text-white">
          <div className="flex items-center justify-between mb-1">
            <div className="flex items-center gap-2">
              <Lock className="w-4 h-4" />
              <span className="text-sm font-medium opacity-90">Secure Payment</span>
            </div>
            {step === "input" && (
              <button onClick={onClose} className="opacity-80 hover:opacity-100">
                <X className="w-5 h-5" />
              </button>
            )}
          </div>
          <p className="text-2xl font-bold">₹{total}</p>
          <p className="text-sm opacity-80 mt-1">BookBuddies</p>
        </div>

        <div className="p-6">
          <AnimatePresence mode="wait">

            {/* Processing */}
            {step === "processing" && (
              <motion.div key="processing" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="py-10 text-center space-y-4">
                <div className="relative w-20 h-20 mx-auto">
                  <motion.div
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                    className="w-20 h-20 rounded-full border-4 border-orange-200 border-t-orange-500"
                  />
                  <Lock className="absolute inset-0 m-auto w-7 h-7 text-orange-500" />
                </div>
                <p className="font-semibold text-foreground text-lg">Processing Payment...</p>
                <p className="text-sm text-muted-foreground">Please do not close this window</p>
                <div className="flex justify-center gap-1 pt-2">
                  {[0, 1, 2].map((i) => (
                    <motion.div
                      key={i}
                      animate={{ opacity: [0.3, 1, 0.3] }}
                      transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.4 }}
                      className="w-2 h-2 rounded-full bg-orange-400"
                    />
                  ))}
                </div>
              </motion.div>
            )}

            {/* Success */}
            {step === "success" && (
              <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-10 text-center space-y-4">
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: "spring", stiffness: 200, damping: 15 }}
                  className="w-20 h-20 rounded-full bg-green-500 flex items-center justify-center mx-auto"
                >
                  <Check className="w-10 h-10 text-white" />
                </motion.div>
                <p className="font-bold text-xl text-foreground">Payment Successful!</p>
                <p className="text-sm text-muted-foreground">₹{total} paid to BookBuddies</p>
              </motion.div>
            )}

            {/* UPI */}
            {step === "input" && method === "upi" && (
              <motion.div key="upi" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                <div>
                  <p className="font-semibold text-foreground mb-1">Pay via UPI</p>
                  <p className="text-sm text-muted-foreground">Enter your UPI ID to pay ₹{total}</p>
                </div>
                <div className="space-y-1">
                  <Label>UPI ID</Label>
                  <div className="relative">
                    <Smartphone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="yourname@upi"
                      className={cn("pl-10", errors.upiId && "border-red-500 focus-visible:ring-red-500")}
                      value={upiId}
                      onChange={(e) => { setUpiId(e.target.value); setErrors((p) => ({ ...p, upiId: "" })); }}
                    />
                  </div>
                  <FieldError message={errors.upiId} />
                  <p className="text-xs text-muted-foreground">Supports Google Pay, PhonePe, Paytm, BHIM</p>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={handleConfirm}>
                  Pay ₹{total}
                </Button>
              </motion.div>
            )}

            {/* Card */}
            {step === "input" && method === "card" && (
              <motion.div key="card" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-1">Debit / Credit Card</p>
                  <p className="text-sm text-muted-foreground">Enter your card details</p>
                </div>
                <div className="space-y-3">
                  <div>
                    <Label>Card Number</Label>
                    <Input
                      placeholder="1234 5678 9012 3456"
                      className={cn("mt-1 font-mono", errors.cardNumber && "border-red-500 focus-visible:ring-red-500")}
                      value={cardNumber}
                      onChange={(e) => { setCardNumber(formatCardNumber(e.target.value)); setErrors((p) => ({ ...p, cardNumber: "" })); }}
                      maxLength={19}
                    />
                    <FieldError message={errors.cardNumber} />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label>Expiry</Label>
                      <Input
                        placeholder="MM/YY"
                        className={cn("mt-1", errors.cardExpiry && "border-red-500 focus-visible:ring-red-500")}
                        value={cardExpiry}
                        onChange={(e) => { setCardExpiry(formatExpiry(e.target.value)); setErrors((p) => ({ ...p, cardExpiry: "" })); }}
                        maxLength={5}
                      />
                      <FieldError message={errors.cardExpiry} />
                    </div>
                    <div>
                      <Label>CVV</Label>
                      <Input
                        placeholder="•••"
                        className={cn("mt-1", errors.cardCvv && "border-red-500 focus-visible:ring-red-500")}
                        type="password"
                        value={cardCvv}
                        onChange={(e) => { setCardCvv(e.target.value.replace(/\D/g, "").slice(0, 3)); setErrors((p) => ({ ...p, cardCvv: "" })); }}
                        maxLength={3}
                      />
                      <FieldError message={errors.cardCvv} />
                    </div>
                  </div>
                  <div>
                    <Label>Cardholder Name</Label>
                    <Input
                      placeholder="Name on card"
                      className={cn("mt-1", errors.cardName && "border-red-500 focus-visible:ring-red-500")}
                      value={cardName}
                      onChange={(e) => { setCardName(e.target.value); setErrors((p) => ({ ...p, cardName: "" })); }}
                    />
                    <FieldError message={errors.cardName} />
                  </div>
                </div>
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={handleConfirm}>
                  <Lock className="w-4 h-4 mr-2" /> Pay ₹{total} Securely
                </Button>
              </motion.div>
            )}

            {/* Net Banking */}
            {step === "input" && method === "netbanking" && (
              <motion.div key="netbanking" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-4">
                <div>
                  <p className="font-semibold text-foreground mb-1">Net Banking</p>
                  <p className="text-sm text-muted-foreground">Select your bank to continue</p>
                </div>
                <div className="space-y-2 max-h-60 overflow-y-auto">
                  {banks.map((bank) => (
                    <button
                      key={bank}
                      onClick={() => { setSelectedBank(bank); setErrors((p) => ({ ...p, bank: "" })); }}
                      className={cn(
                        "w-full text-left px-4 py-3 rounded-xl border-2 text-sm font-medium transition-all",
                        selectedBank === bank
                          ? "border-orange-500 bg-orange-50 dark:bg-orange-950 text-orange-600"
                          : "border-border hover:border-orange-300"
                      )}
                    >
                      {bank}
                    </button>
                  ))}
                </div>
                <FieldError message={errors.bank} />
                <Button className="w-full bg-orange-500 hover:bg-orange-600 text-white" onClick={handleConfirm}>
                  Proceed to Bank →
                </Button>
              </motion.div>
            )}

          </AnimatePresence>
        </div>

        {step === "input" && (
          <div className="px-6 pb-4 flex items-center justify-center gap-2 text-xs text-muted-foreground">
            <Shield className="w-3 h-3" />
            256-bit SSL encrypted · Powered by BookBuddies Pay
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

// ── Main Checkout Page ──
export default function Checkout() {
  const navigate = useNavigate();

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [address, setAddress] = useState("");
  const [city, setCity] = useState("");
  const [pincode, setPincode] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedPayment, setSelectedPayment] = useState("upi");

  // Inline field errors for delivery form
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});

  const [cartItems, setCartItems] = useState<any[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<any>(null);

  useEffect(() => {
    const fetchCart = async () => {
      setIsLoading(true);
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { navigate("/login"); return; }
      setCurrentUser(user);
      const { data, error } = await supabase
        .from("cart")
        .select("id, quantity, books(id, title, author, price, seller_id)")
        .eq("user_id", user.id);
      if (error) toast.error("Failed to load cart");
      else setCartItems(data || []);
      setIsLoading(false);
    };
    fetchCart();
  }, []);

  const subtotal = cartItems.reduce((sum, item) => sum + (item.books?.price || 0) * item.quantity, 0);
  const discount = Math.floor(subtotal * 0.1);
  const total = subtotal - discount;

  // Clear a field error when user starts typing
  const clearError = (field: string) =>
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {};
    const nameRegex = /^[a-zA-Z\s]+$/;
    const phoneRegex = /^[6-9]\d{9}$/;
    const pincodeRegex = /^\d{6}$/;

    if (!firstName.trim()) errors.firstName = "First name is required";
    else if (!nameRegex.test(firstName)) errors.firstName = "First name should contain letters only";

    if (!lastName.trim()) errors.lastName = "Last name is required";
    else if (!nameRegex.test(lastName)) errors.lastName = "Last name should contain letters only";

    if (!address.trim()) errors.address = "Address is required";

    if (!city.trim()) errors.city = "City is required";

    if (!pincode.trim()) errors.pincode = "Pincode is required";
    else if (!pincodeRegex.test(pincode)) errors.pincode = "Pincode must be exactly 6 digits (numbers only)";

    if (!phone.trim()) errors.phone = "Phone number is required";
    else if (!phoneRegex.test(phone.replace(/\s+/g, ""))) errors.phone = "Enter a valid 10-digit Indian mobile number (starts with 6-9)";

    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Scroll to top of form so user sees errors
      window.scrollTo({ top: 200, behavior: "smooth" });
      return false;
    }
    return true;
  };

  const saveOrder = async () => {
    const shippingAddress = `${firstName} ${lastName}, ${address}, ${city} - ${pincode}, Phone: ${phone}`;
    const orderPromises = cartItems.map((item) =>
      supabase.from("orders").insert({
        buyer_id: currentUser.id,
        seller_id: item.books?.seller_id,
        book_id: item.books?.id,
        status: selectedPayment === "cod" ? "pending" : "confirmed",
        total_price: item.books?.price * item.quantity,
        shipping_address: shippingAddress,
      }).select().single()
    );
    const results = await Promise.all(orderPromises);
    if (results.some((r) => r.error)) throw new Error("Failed to save orders");
    await Promise.all(cartItems.map((item) =>
      supabase.from("books").update({ is_sold: true }).eq("id", item.books?.id)
    ));
    await supabase.from("cart").delete().eq("user_id", currentUser.id);
    return results[0].data;
  };

  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    setIsProcessing(true);
    try {
      const firstOrder = await saveOrder();
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => navigate("/order-tracking", { state: { orderId: firstOrder?.id } }), 2000);
    } catch (err: any) {
      toast.error("Order save failed: " + err.message);
      setIsProcessing(false);
    }
  };

  const handleCOD = async () => {
    setIsProcessing(true);
    try {
      const firstOrder = await saveOrder();
      setIsProcessing(false);
      setShowSuccess(true);
      setTimeout(() => navigate("/order-tracking", { state: { orderId: firstOrder?.id } }), 2000);
    } catch (err: any) {
      toast.error("Failed to place order: " + err.message);
      setIsProcessing(false);
    }
  };

  const handlePayNow = () => {
    if (!validateForm()) return;
    if (!currentUser) { toast.error("Please login first"); return; }
    if (cartItems.length === 0) { toast.error("Your cart is empty"); return; }
    if (selectedPayment === "cod") handleCOD();
    else setShowPaymentModal(true);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <AnimatePresence>
        {showPaymentModal && (
          <PaymentModal
            method={selectedPayment}
            total={total}
            onSuccess={handlePaymentSuccess}
            onClose={() => setShowPaymentModal(false)}
          />
        )}
      </AnimatePresence>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <AnimatePresence mode="wait">
          {showSuccess ? (
            <motion.div key="success" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="py-20 text-center">
              <motion.div
                initial={{ scale: 0 }} animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
                className="w-32 h-32 rounded-full gradient-warm flex items-center justify-center mx-auto mb-8 shadow-glow"
              >
                <Check className="w-16 h-16 text-white" />
              </motion.div>
              <motion.h2 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="text-3xl font-bold text-foreground mb-4">
                {selectedPayment === "cod" ? "Order Placed! 🚚" : "Payment Successful! 🎉"}
              </motion.h2>
              <motion.p initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }} className="text-muted-foreground text-lg">
                {selectedPayment === "cod" ? `Pay ₹${total} when your book arrives` : `₹${total} paid successfully`}
              </motion.p>
              <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }} className="text-sm text-muted-foreground mt-2">
                Redirecting to order tracking...
              </motion.p>
            </motion.div>
          ) : (
            <motion.div key="checkout" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} className="mb-6">
                <button onClick={() => navigate("/cart")} className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground transition-colors">
                  <ArrowLeft className="w-4 h-4" /> Back to Cart
                </button>
              </motion.div>

              <motion.h1 initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-3xl font-bold text-foreground mb-8">
                Checkout
              </motion.h1>

              <div className="grid lg:grid-cols-2 gap-8">
                <div className="space-y-6">

                  {/* Delivery Address */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card rounded-2xl p-6 shadow-soft">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-accent" /> Delivery Address
                    </h2>
                    <div className="space-y-4">

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="firstName">First Name</Label>
                          <Input
                            id="firstName" placeholder="John" className={cn("mt-1", fieldErrors.firstName && "border-red-500 focus-visible:ring-red-500")}
                            value={firstName} onChange={(e) => { setFirstName(e.target.value); clearError("firstName"); }}
                          />
                          <FieldError message={fieldErrors.firstName} />
                        </div>
                        <div>
                          <Label htmlFor="lastName">Last Name</Label>
                          <Input
                            id="lastName" placeholder="Doe" className={cn("mt-1", fieldErrors.lastName && "border-red-500 focus-visible:ring-red-500")}
                            value={lastName} onChange={(e) => { setLastName(e.target.value); clearError("lastName"); }}
                          />
                          <FieldError message={fieldErrors.lastName} />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="address">Address</Label>
                        <Input
                          id="address" placeholder="123 Book Street" className={cn("mt-1", fieldErrors.address && "border-red-500 focus-visible:ring-red-500")}
                          value={address} onChange={(e) => { setAddress(e.target.value); clearError("address"); }}
                        />
                        <FieldError message={fieldErrors.address} />
                      </div>

                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <Label htmlFor="city">City</Label>
                          <Input
                            id="city" placeholder="Mumbai" className={cn("mt-1", fieldErrors.city && "border-red-500 focus-visible:ring-red-500")}
                            value={city} onChange={(e) => { setCity(e.target.value); clearError("city"); }}
                          />
                          <FieldError message={fieldErrors.city} />
                        </div>
                        <div>
                          <Label htmlFor="pincode">Pincode</Label>
                          <Input
                            id="pincode" placeholder="400001" className={cn("mt-1", fieldErrors.pincode && "border-red-500 focus-visible:ring-red-500")}
                            value={pincode} onChange={(e) => { setPincode(e.target.value); clearError("pincode"); }}
                          />
                          <FieldError message={fieldErrors.pincode} />
                        </div>
                      </div>

                      <div>
                        <Label htmlFor="phone">Phone Number</Label>
                        <Input
                          id="phone" placeholder="9876543210" className={cn("mt-1", fieldErrors.phone && "border-red-500 focus-visible:ring-red-500")}
                          value={phone} onChange={(e) => { setPhone(e.target.value); clearError("phone"); }}
                        />
                        <FieldError message={fieldErrors.phone} />
                      </div>

                    </div>
                  </motion.div>

                  {/* Payment Methods */}
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card rounded-2xl p-6 shadow-soft">
                    <h2 className="text-lg font-semibold text-foreground mb-4 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-accent" /> Payment Method
                    </h2>
                    <div className="space-y-3">
                      {paymentMethods.map((method) => {
                        const Icon = method.icon;
                        return (
                          <button
                            key={method.id}
                            onClick={() => setSelectedPayment(method.id)}
                            className={cn(
                              "w-full flex items-center gap-4 p-4 rounded-xl border-2 transition-all",
                              selectedPayment === method.id ? "border-accent bg-accent/5" : "border-border hover:border-accent/50"
                            )}
                          >
                            <div className={cn("w-10 h-10 rounded-full flex items-center justify-center", selectedPayment === method.id ? "gradient-warm" : "bg-secondary")}>
                              <Icon className={cn("w-5 h-5", selectedPayment === method.id ? "text-white" : "text-foreground")} />
                            </div>
                            <div className="flex-1 text-left">
                              <p className="font-medium text-foreground">{method.name}</p>
                              <p className="text-sm text-muted-foreground">{method.description}</p>
                            </div>
                            <div className={cn("w-5 h-5 rounded-full border-2 flex items-center justify-center", selectedPayment === method.id ? "border-accent bg-accent" : "border-muted-foreground")}>
                              {selectedPayment === method.id && <Check className="w-3 h-3 text-white" />}
                            </div>
                          </button>
                        );
                      })}
                    </div>
                  </motion.div>
                </div>

                {/* Order Summary */}
                <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="lg:sticky lg:top-24 h-fit">
                  <div className="bg-card rounded-2xl p-6 shadow-card space-y-4">
                    <h2 className="text-xl font-semibold text-foreground">Order Summary</h2>

                    {isLoading ? (
                      <div className="space-y-2">{[1, 2].map((i) => <div key={i} className="h-10 bg-secondary rounded animate-pulse" />)}</div>
                    ) : (
                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {cartItems.map((item) => (
                          <div key={item.id} className="flex justify-between items-center text-sm py-1 border-b border-border last:border-0">
                            <div>
                              <p className="font-medium text-foreground line-clamp-1">{item.books?.title}</p>
                              <p className="text-xs text-muted-foreground">{item.books?.author}</p>
                            </div>
                            <span className="text-accent font-medium ml-2">₹{item.books?.price}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    <div className="space-y-3 text-sm pt-2">
                      <div className="flex justify-between">
                        <span className="text-muted-foreground">Subtotal ({cartItems.length} items)</span>
                        <span className="font-medium text-foreground">₹{subtotal}</span>
                      </div>
                      <div className="flex justify-between text-accent">
                        <span>Discount (10%)</span>
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

                    <Button
                      variant="warm"
                      size="lg"
                      className="w-full"
                      onClick={handlePayNow}
                      disabled={isProcessing || isLoading || cartItems.length === 0}
                    >
                      {isProcessing ? (
                        <><Loader2 className="w-5 h-5 animate-spin mr-2" />Processing...</>
                      ) : selectedPayment === "cod" ? (
                        <>Place Order (COD) 🚚</>
                      ) : (
                        <>Pay Now ₹{total}</>
                      )}
                    </Button>

                    {cartItems.length === 0 && !isLoading && (
                      <p className="text-center text-sm text-muted-foreground">Your cart is empty</p>
                    )}

                    <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
                      <Shield className="w-4 h-4" />
                      Secure payment powered by BookBuddies Pay
                    </div>
                  </div>
                </motion.div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}