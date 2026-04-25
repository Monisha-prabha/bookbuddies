import { Routes, Route } from "react-router-dom";
import Settings from "./pages/Settings";
import Feed from "./pages/Feed";
import Home from "./pages/Home";
import Profile from "./pages/Profile";
import EditProfile from "./pages/EditProfile";
import Login from "./pages/Login";
import Landing from "./pages/Landing";
import BookDetails from "./pages/BookDetails";
import Cart from "./pages/Cart";
import Checkout from "./pages/Checkout";
import Chat from "./pages/Chat";
import Communities from "./pages/Communities";
import OrderTracking from "./pages/OrderTracking";
import Sell from "./pages/Sell";
import NotFound from "./pages/NotFound";
import { MobileNav } from "./components/layout/MobileNav";

function App() {
  return (
    <>
      <Routes>
        <Route path="/"               element={<Landing />}       />
        <Route path="/home"           element={<Home />}          />
        <Route path="/login"          element={<Login />}         />
        <Route path="/profile"        element={<Profile />}       />
        <Route path="/edit-profile"   element={<EditProfile />}   />
        <Route path="/sell"           element={<Sell />}          />
        <Route path="/feed"           element={<Feed />}          />
        <Route path="/cart"           element={<Cart />}          />
        <Route path="/checkout"       element={<Checkout />}      />
        <Route path="/chat"           element={<Chat />}          />
        <Route path="/communities"    element={<Communities />}   />
        <Route path="/order-tracking" element={<OrderTracking />} />
        <Route path="/book/:id"       element={<BookDetails />}   />
        <Route path="/settings"       element={<Settings />}      />
        <Route path="*"               element={<NotFound />}      />
      </Routes>

      {/* Mobile bottom nav — shows on all pages except / and /login */}
      <MobileNav />
    </>
  );
}

export default App;