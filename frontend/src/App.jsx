import { Routes, Route, Navigate } from "react-router-dom";
import Landing from "./pages/Landing.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import Eligible from "./pages/Eligible.jsx";
import JobDetails from "./pages/JobDetails.jsx";
import Apply from "./pages/Apply.jsx";
import Watchlist from "./pages/Watchlist.jsx";
import { useAuth } from "./context/AuthContext.jsx";
import PostListing from "./Pages/PostListing.jsx";
import ApplicantDetails from "./Pages/ApplicantDetails.jsx";
import Dashboard from "./Pages/Dashboard.jsx";

function RequireAuth({ children }) {
  const { isAuthenticated } = useAuth();
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return children;
}

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route
        path="/profile"
        element={
        
            <Profile />
       
        }
      />

       <Route 
       path="/eligible" element={
          
       <Eligible />
       
       }
       />

       <Route 
       path="/jobs/:id" element={
          
       <JobDetails />
        
      }
        />

       <Route
        path="/apply" element={
           
            <Apply />
            
       
      }
         />

       <Route 
       path ="/watchlist" element={
          
       <Watchlist />
     
      }
        />

  <Route 
       path ="/postlisting" element={
          
       <PostListing />
       }
        />


    <Route
         path="/applicantdetails" element ={
          <ApplicantDetails/>

         }
         /> 
         
      <Route 
       path ="/dashboard" element={
          
       <Dashboard />
     
      }
        />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
