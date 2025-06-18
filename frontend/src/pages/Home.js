import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { FaHeart, FaArrowRight, FaUsers, FaStar, FaShieldAlt, FaMobile, FaPlay, FaLinkedin, FaEnvelope, FaGithub } from 'react-icons/fa';
import '../styles/Home.css';
import founderImage from '../pics/WhatsApp Image 2025-04-18 at 00.29.35_da736d55.jpg';

const Home = () => {
  const navigate = useNavigate();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
    
    // Auto-slide testimonials
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % 3);
    }, 5000);

    return () => clearInterval(interval);
  }, []);

  const testimonials = [
    {
      name: "Rickey & Priya",
      text: "Date2Mate helped us find true love. We're getting married next month! 💕",
      rating: 5
    },
    {
      name: "thiru & sujitha",
      text: "The mindful approach really works. We've been together for 2 years now!",
      rating: 5
    },
    {
      name: "arjun & clara",
      text: "Finally found someone who understands me. Thank you Date2Mate!",
      rating: 5
    }
  ];

  const features = [
    {
      icon: <FaHeart />,
      title: "Daily Matches",
      description: "Get one carefully curated match every day based on compatibility"
    },
    {
      icon: <FaShieldAlt />,
      title: "Safe & Secure",
      description: "Your privacy and safety are our top priorities"
    },
    {
      icon: <FaUsers />,
      title: "Mindful Dating",
      description: "Focus on quality connections, not endless swiping"
    },
    {
      icon: <FaStar />,
      title: "Compatibility Score",
      description: "Advanced algorithm matches you based on personality and values"
    }
  ];

  const stats = [
    { number: "10,000+", label: "Happy Couples" },
    { number: "95%", label: "Success Rate" },
    { number: "50+", label: "Cities" },
    { number: "24/7", label: "Support" }
  ];

  return (
    <div className="home-container">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-background">
          <div className="floating-hearts">
            <div className="heart heart-1">💕</div>
            <div className="heart heart-2">💖</div>
            <div className="heart heart-3">💝</div>
            <div className="heart heart-4">💕</div>
            <div className="heart heart-5">💖</div>
          </div>
        </div>
        
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Find Your Perfect Match with
              <span className="brand-name"> Date2Mate</span>
            </h1>
            <p className="hero-subtitle">
              Discover meaningful connections through mindful dating. 
              One match per day, focused on quality over quantity.
            </p>
            <div className="hero-buttons">
              <button 
                className="cta-button primary"
                onClick={() => navigate('/register')}
              >
                Start Your Journey
                <FaArrowRight className="button-icon" />
              </button>
              <button 
                className="cta-button secondary"
                onClick={() => navigate('/login')}
              >
                Sign In
              </button>
            </div>
          </div>
          
          <div className="hero-visual">
            <div className="phone-mockup">
              <div className="phone-screen">
                <div className="app-preview">
                  <div className="preview-header">
                    <FaHeart className="preview-logo" />
                    <span>Date2Mate</span>
                  </div>
                  <div className="preview-content">
                    <div className="preview-match">
                      <div className="preview-avatar"></div>
                      <div className="preview-info">
                        <h4>PK, 25</h4>
                        <p>Compatibility: 94%</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose Date2Mate?</h2>
          <div className="features-grid">
            {features.map((feature, index) => (
              <div key={index} className="feature-card">
                <div className="feature-icon">
                  {feature.icon}
                </div>
                <h3>{feature.title}</h3>
                <p>{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            {stats.map((stat, index) => (
              <div key={index} className="stat-item">
                <h3 className="stat-number">{stat.number}</h3>
                <p className="stat-label">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="testimonials-section">
        <div className="container">
          <h2 className="section-title">Success Stories</h2>
          <div className="testimonials-container">
            <div className="testimonials-slider">
              {testimonials.map((testimonial, index) => (
                <div 
                  key={index} 
                  className={`testimonial-card ${index === currentSlide ? 'active' : ''}`}
                >
                  <div className="testimonial-content">
                    <p>"{testimonial.text}"</p>
                    <div className="testimonial-author">
                      <h4>{testimonial.name}</h4>
                      <div className="rating">
                        {[...Array(testimonial.rating)].map((_, i) => (
                          <FaStar key={i} className="star" />
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
            <div className="testimonial-dots">
              {testimonials.map((_, index) => (
                <button
                  key={index}
                  className={`dot ${index === currentSlide ? 'active' : ''}`}
                  onClick={() => setCurrentSlide(index)}
                />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Founder Section */}
      <section className="founder-section">
        <div className="container">
          <div className="founder-content">
            <div className="founder-info">
              <h2>Meet Our Founder</h2>
              <div className="founder-card">
                <div className="founder-avatar">
                  <img 
                    src={founderImage} 
                    alt="Praveen Kumar M - Founder of Date2Mate" 
                    className="founder-image"
                  />
                </div>
                <div className="founder-details">
                  <h3>Praveen Kumar M</h3>
                  <p className="founder-title">Founder & CEO</p>
                  <p className="founder-education">B.Tech CSE, PES University, Bangalore</p>
                  <p className="founder-description">
                    Passionate about creating meaningful connections through technology. 
                    Date2Mate was born from the belief that love should be intentional, 
                    mindful, and based on genuine compatibility.
                  </p>
                  <div className="founder-social">
                    <a 
                      href="https://www.linkedin.com/in/praveen-kumar-m-730780305/" 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="social-link linkedin"
                    >
                      <FaLinkedin />
                      <span>LinkedIn</span>
                    </a>
                    <a 
                      href="mailto:muniganpraveen@gmail.com" 
                      className="social-link email"
                    >
                      <FaEnvelope />
                      <span>Email</span>
                    </a>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <div className="container">
          <div className="cta-content">
            <h2>Ready to Find Your Perfect Match?</h2>
            <p>Join thousands of people who have found love through mindful dating</p>
            <button 
              className="cta-button primary large"
              onClick={() => navigate('/register')}
            >
              Get Started Today
              <FaArrowRight className="button-icon" />
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="footer">
        <div className="container">
          <div className="footer-content">
            <div className="footer-brand">
              <FaHeart className="footer-logo" />
              <h3>Date2Mate</h3>
              <p>Mindful dating for meaningful connections</p>
            </div>
            <div className="footer-links">
              <div className="footer-section">
                <h4>Product</h4>
                <a href="#features">Features</a>
                <a href="#pricing">Pricing</a>
                <a href="#safety">Safety</a>
              </div>
              <div className="footer-section">
                <h4>Company</h4>
                <a href="#about">About</a>
                <a href="#careers">Careers</a>
                <a href="#contact">Contact</a>
              </div>
              <div className="footer-section">
                <h4>Support</h4>
                <a href="#help">Help Center</a>
                <a href="#privacy">Privacy Policy</a>
                <a href="#terms">Terms of Service</a>
              </div>
            </div>
          </div>
          <div className="footer-bottom">
            <p>&copy; 2024 Date2Mate. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home; 