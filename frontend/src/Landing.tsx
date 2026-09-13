import { useState } from "react";

interface LandingProps {
  onGetStarted: () => void;
}

const features = [
  {
    icon: "👁",
    title: "Sentiment Analysis",
    desc: "Decode emotional tone across platforms. Positive, negative, or neutral — every voice measured."
  },
  {
    icon: "🕸",
    title: "Network Analysis",
    desc: "Map influence flows. Identify key connectors and trending voices in your social ecosystem."
  },
  {
    icon: "📈",
    title: "Trend Detection",
    desc: "Surface emerging narratives before they peak. Real-time trend velocity and trajectory analysis."
  },
  {
    icon: "🌍",
    title: "Geographic Insights",
    desc: "Understand regional sentiment variations. Segment and target by geography and platform."
  },
  {
    icon: "📡",
    title: "Multi-Platform Aggregation",
    desc: "Unified view across platforms. Consistent metrics, comparable data, single dashboard."
  },
  {
    icon: "⚡",
    title: "Real-Time Refresh",
    desc: "Live polling every 10 seconds. Dashboard stays current as conversation unfolds."
  }
];

export default function Landing({ onGetStarted }: LandingProps) {
  const [carouselIndex, setCarouselIndex] = useState(0);

  const nextCarousel = () => {
    setCarouselIndex((prev) => (prev + 1) % features.length);
  };

  const prevCarousel = () => {
    setCarouselIndex((prev) => (prev - 1 + features.length) % features.length);
  };
  return (
    <div className="landing-page">
      {/* Hero Section */}
      <section className="landing-hero">
        <div className="landing-hero-content">
          <h1 className="landing-display-title">
            Social Intelligence, Crystallized
          </h1>
          <p className="landing-subheading">
            Real-time analytics that transforms raw social data into strategic insight. 
            Discover what your audience actually thinks.
          </p>
          <button 
            className="landing-cta-button"
            onClick={onGetStarted}
          >
            Get Started
          </button>
        </div>
        
        {/* Gradient Background Accent */}
        <div className="landing-hero-gradient" />
      </section>

      {/* Features Section */}
      <section className="landing-features">
        <div className="landing-container">
          <h2 className="landing-heading">Core Intelligence</h2>
          
          {/* Feature Carousel */}
          <div className="landing-carousel">
            <button 
              className="carousel-button carousel-prev"
              onClick={prevCarousel}
              aria-label="Previous feature"
            >
              ←
            </button>

            <div className="carousel-viewport">
              <div className="carousel-track" style={{ transform: `translateX(-${carouselIndex * 100}%)` }}>
                {features.map((feature, idx) => (
                  <div key={idx} className="carousel-slide">
                    <div className="carousel-card">
                      <div className="carousel-icon">{feature.icon}</div>
                      <h3 className="carousel-title">{feature.title}</h3>
                      <p className="carousel-text">{feature.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <button 
              className="carousel-button carousel-next"
              onClick={nextCarousel}
              aria-label="Next feature"
            >
              →
            </button>
          </div>

          {/* Carousel Indicators */}
          <div className="carousel-indicators">
            {features.map((_, idx) => (
              <button
                key={idx}
                className={`carousel-dot ${idx === carouselIndex ? "active" : ""}`}
                onClick={() => setCarouselIndex(idx)}
                aria-label={`Go to feature ${idx + 1}`}
              />
            ))}
          </div>

          {/* Static Grid Below (Desktop View) */}
          <div className="landing-features-grid">
            {features.map((feature, idx) => (
              <div key={idx} className="landing-feature-card">
                <div className="landing-feature-icon">{feature.icon}</div>
                <h3 className="landing-feature-title">{feature.title}</h3>
                <p className="landing-feature-text">{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Value Proposition */}
      <section className="landing-value">
        <div className="landing-container">
          <div className="landing-value-split">
            <div className="landing-value-text">
              <h2 className="landing-heading">Why Intelligence Matters</h2>
              <p className="landing-body-text">
                Social data without insight is just noise. The Intelligence Hub transforms millions of posts 
                into actionable signals. See what trends drive engagement. Understand where sentiment clusters. 
                Identify who influences whom.
              </p>
              <p className="landing-body-text">
                Built for analysts, strategists, and decision-makers who need social intelligence now.
              </p>
            </div>
            <div className="landing-value-accent">
              <div className="landing-accent-card">
                <p className="landing-accent-stat">7 Pages</p>
                <p className="landing-accent-label">Comprehensive Analytics</p>
              </div>
              <div className="landing-accent-card accent-card-2">
                <p className="landing-accent-stat">Real-Time</p>
                <p className="landing-accent-label">Live Data Updates</p>
              </div>
              <div className="landing-accent-card accent-card-3">
                <p className="landing-accent-stat">Semantic</p>
                <p className="landing-accent-label">AI-Powered Insights</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer CTA Section */}
      <section className="landing-footer-cta">
        <div className="landing-container">
          <h2 className="landing-footer-title">Ready to understand your audience?</h2>
          <button 
            className="landing-cta-button landing-cta-large"
            onClick={onGetStarted}
          >
            Enter the Dashboard
          </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="landing-container">
          <div className="footer-content">
            <div className="footer-section footer-brand">
              <div className="footer-logo">SI</div>
              <h4 className="footer-brand-name">Social Intelligence Hub</h4>
              <p className="footer-brand-desc">Real-time analytics for social media intelligence</p>
            </div>

            <div className="footer-section footer-links">
              <h5 className="footer-section-title">Features</h5>
              <a href="#features" className="footer-link">Analytics</a>
              <a href="#features" className="footer-link">Network Analysis</a>
              <a href="#features" className="footer-link">Real-Time Data</a>
              <a href="#features" className="footer-link">Insights</a>
            </div>

            <div className="footer-section footer-links">
              <h5 className="footer-section-title">Product</h5>
              <a href="#about" className="footer-link">About</a>
              <a href="#pricing" className="footer-link">Pricing</a>
              <a href="#docs" className="footer-link">Documentation</a>
              <a href="#api" className="footer-link">API</a>
            </div>

            <div className="footer-section footer-links">
              <h5 className="footer-section-title">Company</h5>
              <a href="#privacy" className="footer-link">Privacy</a>
              <a href="#terms" className="footer-link">Terms</a>
              <a href="#contact" className="footer-link">Contact</a>
              <a href="#blog" className="footer-link">Blog</a>
            </div>
          </div>

          <div className="footer-bottom">
            <p className="footer-copyright">© 2026 Social Intelligence Hub. All rights reserved.</p>
            <div className="footer-social">
              <a href="#twitter" className="footer-social-link">Twitter</a>
              <a href="#linkedin" className="footer-social-link">LinkedIn</a>
              <a href="#github" className="footer-social-link">GitHub</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
