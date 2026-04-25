import { motion } from "framer-motion";
import { genres } from "@/data/books";
import { cn } from "@/lib/utils";

interface GenreFilterProps {
  selectedGenre: string;
  onSelectGenre: (genre: string) => void;
}

export function GenreFilter({ selectedGenre, onSelectGenre }: GenreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {genres.map((genre, index) => (
        <motion.button
          key={genre}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: index * 0.05 }}
          onClick={() => onSelectGenre(genre)}
          className={cn(
            "chip",
            selectedGenre === genre ? "chip-active" : "chip-inactive"
          )}
        >
          {genre}
        </motion.button>
      ))}
    </div>
  );
}
