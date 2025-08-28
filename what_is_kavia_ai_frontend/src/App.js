import React, { useEffect, useMemo, useState } from 'react';
import './App.css';

/**
 * Kavia AI Info SPA
 * - Single page with navigation to sections: About, FAQ, Contact
 * - Modern minimalistic light theme using provided palette
 * - Integrates with backend:
 *   - GET /api/info -> About content
 *   - GET /api/faqs -> FAQ items
 *   - POST /api/contact -> Contact submission
 */

// Color palette from request
const PALETTE = {
  primary: '#003366',
  secondary: '#ffffff',
  accent: '#ff9900',
};

// Simple utility to fetch JSON with error handling
async function fetchJSON(url, options = {}) {
  const res = await fetch(url, {
    headers: { 'Accept': 'application/json', ...(options.headers || {}) },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Request failed (${res.status}): ${text || res.statusText}`);
  }
  const ct = res.headers.get('content-type') || '';
  if (ct.includes('application/json')) {
    return res.json();
  }
  // Fallback for plain text About endpoints
  const text = await res.text();
  return { content: text };
}

// PUBLIC_INTERFACE
function App() {
  const [active, setActive] = useState('about');
  const [info, setInfo] = useState({ title: 'Kavia AI', content: '' });
  const [faqs, setFaqs] = useState([]);
  const [expanded, setExpanded] = useState({});
  const [contact, setContact] = useState({ name: '', email: '', message: '' });
  const [contactStatus, setContactStatus] = useState({ state: 'idle', message: '' });
  const [theme] = useState('light'); // enforce light theme per requirement

  // Apply CSS vars for palette
  const cssVars = useMemo(
    () => ({
      '--bg-primary': '#ffffff',
      '--bg-secondary': '#f7f9fc',
      '--text-primary': '#1a1a1a',
      '--text-muted': '#4a5568',
      '--primary': PALETTE.primary,
      '--secondary': PALETTE.secondary,
      '--accent': PALETTE.accent,
      '--card-border': '#e6ebf2',
      '--shadow': '0 8px 24px rgba(0,0,0,0.08)',
      '--radius': '14px',
      '--focus': '0 0 0 3px rgba(255,153,0,0.35)',
    }),
    []
  );

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
  }, [theme]);

  // Load About and FAQs on mount
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const about = await fetchJSON('/api/info');
        if (mounted) {
          setInfo({
            title: about.title || 'About Kavia AI',
            content: about.content || about.description || '',
          });
        }
      } catch (e) {
        if (mounted) {
          setInfo((prev) => ({
            ...prev,
            content:
              prev.content ||
              'We could not load the About information at this time. Please try again later.',
          }));
        }
      }
      try {
        const faqData = await fetchJSON('/api/faqs');
        if (mounted) {
          // Expect array of { question, answer }
          setFaqs(Array.isArray(faqData) ? faqData : faqData.items || []);
        }
      } catch (e) {
        if (mounted) setFaqs([]);
      }
    })();
    return () => {
      mounted = false;
    };
  }, []);

  // PUBLIC_INTERFACE
  const handleToggleFaq = (idx) => {
    setExpanded((prev) => ({ ...prev, [idx]: !prev[idx] }));
  };

  // PUBLIC_INTERFACE
  const handleContactChange = (e) => {
    const { name, value } = e.target;
    setContact((c) => ({ ...c, [name]: value }));
  };

  const validateEmail = (email) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email).toLowerCase());

  // PUBLIC_INTERFACE
  const handleSubmitContact = async (e) => {
    e.preventDefault();
    // Basic validation
    if (!contact.name.trim()) {
      setContactStatus({ state: 'error', message: 'Please enter your name.' });
      return;
    }
    if (!validateEmail(contact.email)) {
      setContactStatus({ state: 'error', message: 'Please enter a valid email.' });
      return;
    }
    if (!contact.message.trim() || contact.message.trim().length < 10) {
      setContactStatus({
        state: 'error',
        message: 'Please enter a message of at least 10 characters.',
      });
      return;
    }

    try {
      setContactStatus({ state: 'loading', message: 'Sending...' });
      await fetchJSON('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(contact),
      });
      setContactStatus({
        state: 'success',
        message: 'Thank you! Your message has been sent successfully.',
      });
      setContact({ name: '', email: '', message: '' });
    } catch (err) {
      setContactStatus({
        state: 'error',
        message:
          'We could not submit your message at this time. Please try again later.',
      });
    }
  };

  const NavButton = ({ id, label }) => (
    <button
      className={`nav-btn ${active === id ? 'active' : ''}`}
      onClick={() => setActive(id)}
      aria-current={active === id ? 'page' : undefined}
    >
      {label}
    </button>
  );

  return (
    <div className="App" style={cssVars}>
      <div className="layout">
        <nav className="navbar" role="navigation" aria-label="Main">
          <div className="brand">
            <div className="logo-dot" aria-hidden />
            <span className="brand-name">Kavia AI</span>
          </div>
          <div className="nav-group" role="tablist" aria-label="Sections">
            <NavButton id="about" label="About" />
            <NavButton id="faq" label="FAQ" />
            <NavButton id="contact" label="Contact" />
          </div>
        </nav>

        <main className="content">
          {active === 'about' && (
            <section className="card" aria-labelledby="about-title">
              <h1 id="about-title" className="title" style={{ color: 'var(--primary)' }}>
                {info.title || 'About Kavia AI'}
              </h1>
              <p className="lead">
                Empowering developers with smart, collaborative code generation.
              </p>
              <div className="divider" />
              <article className="prose">
                {info.content ? (
                  <p>{info.content}</p>
                ) : (
                  <p>
                    Kavia AI streamlines software development with intelligent agents
                    that plan, code, test, and document. Explore FAQs or contact us to
                    learn how Kavia can accelerate your delivery.
                  </p>
                )}
              </article>
              <div className="cta-row">
                <button className="btn primary" onClick={() => setActive('contact')}>
                  Get in touch
                </button>
                <button className="btn ghost" onClick={() => setActive('faq')}>
                  Read FAQs
                </button>
              </div>
            </section>
          )}

          {active === 'faq' && (
            <section className="card" aria-labelledby="faq-title">
              <h2 id="faq-title" className="title">Frequently Asked Questions</h2>
              <p className="muted">Click a question to expand the answer.</p>
              <div className="divider" />
              <div className="faq-list">
                {faqs.length === 0 && (
                  <div className="empty">No FAQs available right now.</div>
                )}
                {faqs.map((item, idx) => (
                  <div className="faq-item" key={`${idx}-${item.question}`}>
                    <button
                      className="faq-question"
                      aria-expanded={!!expanded[idx]}
                      aria-controls={`faq-${idx}`}
                      onClick={() => handleToggleFaq(idx)}
                    >
                      <span>{item.question}</span>
                      <span className="chevron" aria-hidden>
                        {expanded[idx] ? '▾' : '▸'}
                      </span>
                    </button>
                    {expanded[idx] && (
                      <div id={`faq-${idx}`} className="faq-answer">
                        <p>{item.answer}</p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          )}

          {active === 'contact' && (
            <section className="card" aria-labelledby="contact-title">
              <h2 id="contact-title" className="title">Contact Us</h2>
              <p className="muted">
                Have questions or want to collaborate? Send us a message.
              </p>
              <div className="divider" />
              <form className="form" onSubmit={handleSubmitContact} noValidate>
                <div className="form-row">
                  <label htmlFor="name">Name</label>
                  <input
                    id="name"
                    name="name"
                    type="text"
                    placeholder="Your full name"
                    value={contact.name}
                    onChange={handleContactChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="email">Email</label>
                  <input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="you@example.com"
                    value={contact.email}
                    onChange={handleContactChange}
                    required
                  />
                </div>
                <div className="form-row">
                  <label htmlFor="message">Message</label>
                  <textarea
                    id="message"
                    name="message"
                    rows="5"
                    placeholder="How can we help?"
                    value={contact.message}
                    onChange={handleContactChange}
                    required
                  />
                </div>
                <div className="form-actions">
                  <button
                    className="btn primary"
                    type="submit"
                    disabled={contactStatus.state === 'loading'}
                  >
                    {contactStatus.state === 'loading' ? 'Sending...' : 'Send Message'}
                  </button>
                </div>
                {contactStatus.state !== 'idle' && (
                  <div
                    className={`alert ${
                      contactStatus.state === 'success'
                        ? 'success'
                        : contactStatus.state === 'error'
                        ? 'error'
                        : ''
                    }`}
                    role="status"
                    aria-live="polite"
                  >
                    {contactStatus.message}
                  </div>
                )}
              </form>
            </section>
          )}
        </main>

        <footer className="footer">
          <span>© {new Date().getFullYear()} Kavia AI</span>
          <span className="dot" aria-hidden />
          <a
            href="#about"
            onClick={(e) => {
              e.preventDefault();
              setActive('about');
            }}
          >
            About
          </a>
          <a
            href="#faq"
            onClick={(e) => {
              e.preventDefault();
              setActive('faq');
            }}
          >
            FAQ
          </a>
          <a
            href="#contact"
            onClick={(e) => {
              e.preventDefault();
              setActive('contact');
            }}
          >
            Contact
          </a>
        </footer>
      </div>
    </div>
  );
}

export default App;
