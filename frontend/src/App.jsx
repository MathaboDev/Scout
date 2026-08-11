import { BrowserRouter, Routes, Route } from "react-router-dom";

import Landing from "./Pages/Landing";
import SignIn from "./Pages/SignIn";
import Register from "./Pages/Register";
import Profile from "./Pages/Profile";
import Eligible from "./Pages/Eligible";
import Watchlist from "./Pages/Watchlist";
import Apply from "./Pages/Apply";

function App() {
  return (
    <BrowserRouter>
      <Routes>

        <Route path="/" element={<Landing />} />

        <Route path="/signin" element={<SignIn />} />

        <Route path="/register" element={<Register />} />

        <Route path="/profile" element={<Profile />} />

        <Route path="/eligible" element={<Eligible />} />

        <Route path="/watchlist" element={<Watchlist />} />

         <Route path="/apply" element={<Apply />} />

      </Routes>
    </BrowserRouter>
  );
}

export default App;