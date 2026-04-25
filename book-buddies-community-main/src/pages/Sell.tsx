import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Camera,
  Upload,
  BookOpen,
  Tag,
  DollarSign,
  FileText,
  Check,
} from "lucide-react";
import { Navbar } from "@/components/layout/Navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { genres } from "@/data/books";
import { supabase } from "../lib/supabase";

export default function Sell() {
  const navigate = useNavigate();

  const [step, setStep] = useState(1);
  const [bookImage, setBookImage] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [author, setAuthor] = useState("");
  const [price, setPrice] = useState("");
  const [description, setDescription] = useState("");
  const [genre, setGenre] = useState("");
  const [condition, setCondition] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setBookImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleListBook = async () => {
    setIsLoading(true);
    setError("");

    try {
      // Get current logged in user
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        setError("You must be logged in to sell a book.");
        setIsLoading(false);
        return;
      }

      let imageUrl = null;

      // Upload image to Supabase Storage if image selected
      if (imageFile) {
        const fileExt = imageFile.name.split(".").pop();
        const fileName = `books/${user.id}-${Date.now()}.${fileExt}`;

        const { error: uploadError } = await supabase.storage
          .from("book-images")
          .upload(fileName, imageFile);

        if (uploadError) {
          setError("Image upload failed: " + uploadError.message);
          setIsLoading(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("book-images")
          .getPublicUrl(fileName);

        imageUrl = urlData.publicUrl;
      }

      // Save book to Supabase database
      const { error: insertError } = await supabase.from("books").insert({
        seller_id: user.id,
        title,
        author,
        description,
        price: parseFloat(price),
        category: genre,
        condition: condition,
        image_url: imageUrl,
        book_type: "sell",
        is_sold: false,
      });

      if (insertError) {
        setError("Failed to list book: " + insertError.message);
        setIsLoading(false);
        return;
      }

      // Success - go to home
      navigate("/home");

    } catch (err: any) {
      setError("Something went wrong: " + err.message);
    }

    setIsLoading(false);
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-8"
        >
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Sell Your Book 📖
          </h1>
          <p className="text-muted-foreground">
            List your pre-loved books and connect with readers
          </p>
        </motion.div>

        {/* Progress Steps */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="flex items-center justify-center mb-8"
        >
          {[1, 2, 3].map((s) => (
            <div key={s} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-all ${
                  step >= s
                    ? "gradient-warm text-white shadow-glow"
                    : "bg-secondary text-muted-foreground"
                }`}
              >
                {step > s ? <Check className="w-5 h-5" /> : s}
              </div>
              {s < 3 && (
                <div
                  className={`w-16 h-1 mx-2 rounded-full transition-all ${
                    step > s ? "bg-accent" : "bg-secondary"
                  }`}
                />
              )}
            </div>
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card rounded-3xl p-8 shadow-card"
        >
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Camera className="w-5 h-5 text-accent" />
                Book Photo
              </h2>

              <div className="flex flex-col items-center justify-center">
                <label
                  htmlFor="book-image"
                  className={`w-full aspect-[3/4] max-w-xs rounded-2xl border-2 border-dashed cursor-pointer transition-all hover:border-accent ${
                    bookImage ? "border-accent" : "border-border"
                  } overflow-hidden`}
                >
                  {bookImage ? (
                    <img
                      src={bookImage}
                      alt="Book preview"
                      className="w-full h-full object-cover rounded-2xl"
                />
                  ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-muted-foreground">
                      <Upload className="w-12 h-12 mb-4" />
                      <p className="font-medium">Upload book cover</p>
                      <p className="text-sm">JPG, PNG up to 5MB</p>
                    </div>
                  )}
                </label>
                <input
                  id="book-image"
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </div>

              <Button
  variant="warm"
  size="lg"
  className="w-full"
  onClick={() => {
    if (!imageFile) {
      setError("Please upload a book cover image to continue.");
      return;
    }
    setError("");
    setStep(2);
  }}
>
  Continue
</Button>
            </div>
          )}

          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-accent" />
                Book Details
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="title">Book Title</Label>
                  <Input
                    id="title"
                    placeholder="Enter book title"
                    className="mt-1"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>

                <div>
                  <Label htmlFor="author">Author</Label>
                  <Input
                    id="author"
                    placeholder="Enter author name"
                    className="mt-1"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Genre</Label>
                    <Select onValueChange={(val) => setGenre(val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select genre" />
                      </SelectTrigger>
                      <SelectContent>
                        {genres
                          .filter((g) => g !== "All")
                          .map((genre) => (
                            <SelectItem key={genre} value={genre.toLowerCase()}>
                              {genre}
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div>
                    <Label>Condition</Label>
                    <Select onValueChange={(val) => setCondition(val)}>
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select condition" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="new">New</SelectItem>
                        <SelectItem value="like_new">Like New</SelectItem>
                        <SelectItem value="good">Good</SelectItem>
                        <SelectItem value="fair">Fair</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe your book..."
                    className="mt-1 min-h-[100px]"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex gap-4">
                <Button variant="outline" size="lg" onClick={() => setStep(1)}>
                  Back
                </Button>
                <Button
  variant="warm"
  size="lg"
  className="flex-1"
  onClick={() => {
    if (!title.trim()) { setError("Please enter the book title."); return; }
    if (!author.trim()) { setError("Please enter the author name."); return; }
    if (!genre) { setError("Please select a genre."); return; }
    if (!condition) { setError("Please select the book condition."); return; }
    setError("");
    setStep(3);
  }}
>
  Continue
</Button>
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-xl font-semibold text-foreground flex items-center gap-2">
                <Tag className="w-5 h-5 text-accent" />
                Pricing
              </h2>

              <div className="space-y-4">
                <div>
                  <Label htmlFor="price">Your Price (₹)</Label>
                  <div className="relative mt-1">
                    <DollarSign className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <Input
                      id="price"
                      type="number"
                      placeholder="299"
                      className="pl-12"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    💡 Similar books are listed between ₹150 - ₹400
                  </p>
                </div>

                <div className="bg-secondary/50 rounded-xl p-4">
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Your price</span>
                    <span className="font-medium text-foreground">
                      ₹{price || "0"}
                    </span>
                  </div>
                  <div className="flex justify-between mb-2">
                    <span className="text-muted-foreground">Platform fee (5%)</span>
                    <span className="font-medium text-foreground">
                      -₹{price ? (parseFloat(price) * 0.05).toFixed(0) : "0"}
                    </span>
                  </div>
                  <div className="border-t border-border pt-2 mt-2">
                    <div className="flex justify-between">
                      <span className="font-medium text-foreground">
                        You'll receive
                      </span>
                      <span className="font-bold text-accent">
                        ₹{price ? (parseFloat(price) * 0.95).toFixed(0) : "0"}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {error && <p className="text-red-500 text-sm">{error}</p>}

              <div className="flex gap-4">
                <Button variant="outline" size="lg" onClick={() => setStep(2)}>
                  Back
                </Button>
                <Button
                  variant="warm"
                  size="lg"
                  className="flex-1"
                  onClick={handleListBook}
                  disabled={isLoading}
                >
                  <FileText className="w-5 h-5 mr-2" />
                  {isLoading ? "Listing..." : "List My Book"}
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
    </div>
  );
}


