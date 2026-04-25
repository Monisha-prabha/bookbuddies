import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { motion } from "framer-motion";
import { BookOpen, Home, ArrowLeft, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error(
      "404 Error: User attempted to access non-existent route:",
      location.pathname
    );
  }, [location.pathname]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <div className="text-center max-w-md">

        {/* Animated Book */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="flex justify-center mb-8"
        >
          <div className="relative">
            {/* Floating book icon */}
            <motion.div
              animate={{ y: [0, -12, 0] }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
              className="w-32 h-32 rounded-3xl gradient-warm flex items-center justify-center shadow-glow"
            >
              <BookOpen className="w-16 h-16 text-white" />
            </motion.div>

            {/* Floating question marks */}
            {["?", "?", "?"].map((q, i) => (
              <motion.span
                key={i}
                className="absolute text-2xl font-bold text-accent"
                style={{
                  top: i === 0 ? "-10px" : i === 1 ? "10px" : "-5px",
                  left: i === 0 ? "-20px" : i === 1 ? "130px" : "110px",
                }}
                animate={{ opacity: [0, 1, 0], y: [0, -10, 0] }}
                transition={{
                  repeat: Infinity,
                  duration: 2,
                  delay: i * 0.4,
                  ease: "easeInOut",
                }}
              >
                {q}
              </motion.span>
            ))}
          </div>
        </motion.div>

        {/* 404 Text */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
        >
          <h1 className="text-8xl font-bold text-accent mb-2">404</h1>
          <h2 className="text-2xl font-bold text-foreground mb-3">
            This Page is Missing! 📚
          </h2>
          <p className="text-muted-foreground mb-2">
            Looks like this page went on a reading adventure
          </p>
          <p className="text-muted-foreground mb-8">
            and forgot to come back.
          </p>
        </motion.div>

        {/* Tried to access */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="bg-card rounded-xl px-4 py-3 mb-8 shadow-soft"
        >
          <p className="text-sm text-muted-foreground">
            You tried to visit:{" "}
            <span className="font-mono text-accent font-medium">
              {location.pathname}
            </span>
          </p>
        </motion.div>

        {/* Action Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
          className="flex flex-col sm:flex-row gap-3 justify-center"
        >
          <Button
            variant="warm"
            size="lg"
            onClick={() => navigate("/home")}
            className="flex items-center gap-2"
          >
            <Home className="w-5 h-5" />
            Go to Home
          </Button>

          <Button
            variant="outline"
            size="lg"
            onClick={() => navigate(-1)}
            className="flex items-center gap-2"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </Button>

          <Button
            variant="secondary"
            size="lg"
            onClick={() => navigate("/home")}
            className="flex items-center gap-2"
          >
            <Search className="w-5 h-5" />
            Browse Books
          </Button>
        </motion.div>

        {/* Fun quote */}
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
          className="text-sm text-muted-foreground mt-10 italic"
        >
          "Not all those who wander are lost — but this page definitely is." 📖
        </motion.p>
      </div>
    </div>
  );
};

export default NotFound;