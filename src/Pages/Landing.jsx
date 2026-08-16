import React from "react";
import { Link } from "react-router-dom";
import "./Landing.css";

function Landing() {
  return (
    <div className="landing-page">

      {/* Header */}
      <header className="landing-header">
        <Link to="/" className="landing-logo">
          <div className="logo-circle">S</div>
          <span>Scout</span>
        </Link>

        <nav className="landing-nav">
          <a href="#how-it-works">How it works</a>
          <a href="#opportunities">Opportunities</a>
          <a href="#providers">For providers</a>

          <Link to="/signin" className="login-link">
            Log in
          </Link>

          <Link to="/register" className="header-button">
            Get started <span>→</span>
          </Link>
        </nav>
      </header>


      {/* Hero Section */}
      <section className="hero-section">

        <div className="hero-content">

          <h1>
            Find and apply for
            <br />
            <span>opportunities</span> faster.
          </h1>

          <p>
            Scout builds one verified student profile and uses it to
            match, assists with application submission, and track
            applications so nothing gets missed and nothing gets
            re-typed.
          </p>

          <div className="hero-buttons">
            <Link to="/register" className="primary-button">
              Get started <span>→</span>
            </Link>

            <a href="#how-it-works" className="learn-button">
              Learn more
            </a>
          </div>

        </div>

        <div className="hero-image-placeholder">
          {/* Image/video can be added here later */}
        </div>

      </section>


      {/* Feature Bar */}
      <section className="feature-bar">

        <div>Eligibility matching</div>
        <span>=</span>

        <div>One profile, every application</div>
        <span>=</span>

        <div>Deadline reminders</div>
        <span>=</span>

        <div>POPIA compliant</div>
        <span>=</span>

        <div>Verified listings</div>
        <span>=</span>

      </section>


      {/* Why Scout */}
      <section className="why-scout" id="how-it-works">

        <div className="why-text">

          <span className="section-label">
            WHY SCOUT
          </span>

          <h2>
            Built around the problems
            <br />
            students actually
            <br />
            described
          </h2>

          <p>
            No re-entering the same documents. No outdated listings.
            Every feature below traces back to a specific frustration
            from our respondent research.
          </p>

        </div>


        <div className="feature-cards">

          <div className="feature-card">

            <div className="feature-icon">◎</div>

            <h3>Only see what fits</h3>

            <p>
              Eligibility-based matching, no irrelevant listings
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">ϟ</div>

            <h3>Assisted apply</h3>

            <p>
              Pre-filled, reviewed before it ever submits
            </p>

          </div>


          <div className="feature-card">

            <div className="feature-icon">◉</div>

            <h3>Application tracking</h3>

            <p>
              Status updates without checking five portals
            </p>

          </div>

        </div>

      </section>


      {/* Opportunities section */}
      <section className="landing-extra-section" id="opportunities">

        <span className="section-label">
          OPPORTUNITIES
        </span>

        <h2>
          Find opportunities that
          <br />
          match your profile.
        </h2>

        <p>
          Scout helps students discover internships, learnerships
          and graduate programmes that are relevant to them.
        </p>

      </section>


      {/* Providers section */}
      <section className="landing-extra-section providers" id="providers">

        <span className="section-label">
          FOR PROVIDERS
        </span>

        <h2>
          Connect opportunities
          <br />
          with the right students.
        </h2>

        <p>
          Employers and opportunity providers can reach students
          who meet their requirements.
        </p>

      </section>


      {/* Footer */}
      <footer className="landing-footer">

        <div className="landing-logo">
          <div className="logo-circle">S</div>
          <span>Scout</span>
        </div>

        <p>
          Helping South African students find opportunities faster.
        </p>

      </footer>

    </div>
  );
}

export default Landing;
  










  







