import book1 from "@/assets/book-1.jpg";
import book2 from "@/assets/book-2.jpg";
import book3 from "@/assets/book-3.jpg";
import book4 from "@/assets/book-4.jpg";
import book5 from "@/assets/book-5.jpg";
import book6 from "@/assets/book-6.jpg";

export interface Book {
  id: string;
  title: string;
  author: string;
  genre: string;
  price: number;
  condition: "New" | "Like New" | "Good" | "Fair";
  cover: string;
  description: string;
  seller: {
    id: string;
    name: string;
    avatar: string;
  };
  hasCommunity: boolean;
  communityMembers?: number;
}

export const books: Book[] = [
  {
    id: "1",
    title: "The Silent Echo",
    author: "Eleanor Wright",
    genre: "Fiction",
    price: 299,
    condition: "Like New",
    cover: book1,
    description: "A captivating tale of mystery and self-discovery set in a small coastal town. When Sarah returns to her childhood home, she uncovers secrets that have been buried for decades.",
    seller: {
      id: "s1",
      name: "Priya Sharma",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Priya",
    },
    hasCommunity: true,
    communityMembers: 128,
  },
  {
    id: "2",
    title: "Hearts in Bloom",
    author: "Sophia Chen",
    genre: "Romance",
    price: 199,
    condition: "Good",
    cover: book2,
    description: "A heartwarming romance about two florists who compete for the same wedding contract, only to discover that love blooms in the most unexpected places.",
    seller: {
      id: "s2",
      name: "Rahul Patel",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Rahul",
    },
    hasCommunity: true,
    communityMembers: 256,
  },
  {
    id: "3",
    title: "Dragon's Crown",
    author: "Marcus Blackwood",
    genre: "Fantasy",
    price: 349,
    condition: "New",
    cover: book3,
    description: "An epic fantasy adventure following a young prince who must reclaim his kingdom from an ancient dragon lord while discovering his own magical heritage.",
    seller: {
      id: "s3",
      name: "Anita Desai",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Anita",
    },
    hasCommunity: true,
    communityMembers: 512,
  },
  {
    id: "4",
    title: "Mindful Success",
    author: "Dr. James Miller",
    genre: "Self-Help",
    price: 449,
    condition: "New",
    cover: book4,
    description: "Transform your mindset and achieve your goals with proven strategies from leading psychologists. This practical guide will help you unlock your full potential.",
    seller: {
      id: "s4",
      name: "Vikram Singh",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Vikram",
    },
    hasCommunity: false,
  },
  {
    id: "5",
    title: "Engineering Fundamentals",
    author: "Prof. Robert Chen",
    genre: "Academic",
    price: 599,
    condition: "Fair",
    cover: book5,
    description: "Comprehensive textbook covering core engineering principles including mechanics, thermodynamics, and materials science. Essential for all engineering students.",
    seller: {
      id: "s5",
      name: "Meera Gupta",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Meera",
    },
    hasCommunity: true,
    communityMembers: 89,
  },
  {
    id: "6",
    title: "The Great Innovators",
    author: "Michael Stevens",
    genre: "Non-Fiction",
    price: 399,
    condition: "Like New",
    cover: book6,
    description: "Discover the stories behind the world's most revolutionary thinkers and entrepreneurs. From Edison to Musk, learn what drives true innovation.",
    seller: {
      id: "s6",
      name: "Arjun Reddy",
      avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Arjun",
    },
    hasCommunity: false,
  },
];

export const genres = [
  "All",
  "Fiction",
  "Non-Fiction",
  "Romance",
  "Academic",
  "Fantasy",
  "Self-Help",
];

export const getBookById = (id: string): Book | undefined => {
  return books.find((book) => book.id === id);
};

export const getBooksByGenre = (genre: string): Book[] => {
  if (genre === "All") return books;
  return books.filter((book) => book.genre === genre);
};
