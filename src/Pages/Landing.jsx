import React from "react";
import {Link} from "react-router-dom";
import "./Landing.css";

function Landing() {
    return(
   <div className="landing-page">

      <div className="landing-logo">
        <div className="logo-circle">S</div>
        <span>Scout</span>
      </div>

      <div className="landing-content">
        <h1>Find opportunities<br />made for you.</h1>

        <p>
          Discover internships, learnerships, graduate programmes
          and other opportunities designed for students.
        </p>

        <div className="landing-buttons">
          <Link to="/register" className="primary-button">
            Get started
          </Link>

          <Link to="/signin" className="secondary-button">
            Sign in
          </Link>
        </div>
      </div>

    </div>
  










  







    );
}
export default Landing;