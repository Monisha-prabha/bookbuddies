import { Link } from "react-router-dom";

interface BookCardProps {
  id: number;
  title: string;
  price: string;
}

function BookCard({ id, title, price }: BookCardProps) {
  return (
    <div
      style={{
        border: "1px solid #ddd",
        padding: "15px",
        borderRadius: "10px",
        textAlign: "center"
      }}
    >
      <img
        src="https://via.placeholder.com/150"
        alt="book"
        style={{ width: "100%" }}
      />

      <h3>{title}</h3>
      <p>{price}</p>

      <Link to={`/book/${id}`}>
        <button>View Details</button>
      </Link>
    </div>
  );
}

export default BookCard;