import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const features = [
  {
    icon: '01',
    title: 'Take exams with confidence',
    text: 'A focused, distraction-free workspace keeps every assessment clear and easy to navigate.'
  },
  {
    icon: '02',
    title: 'Track your progress',
    text: 'Review scores, attempt history, and performance insights from one student dashboard.'
  },
  {
    icon: '03',
    title: 'Teach with better insight',
    text: 'Faculty get the tools to create assessments, manage questions, and understand results.'
  }
];

const LandingPage = () => {
  const { isAuthenticated, isTeacher } = useAuth();
  const dashboardPath = isTeacher ? '/teacher/dashboard' : '/student/dashboard';

  return (
    <div className="landing-page">
      <section className="landing-hero">
        <div className="landing-hero-copy">
          <div className="eyebrow">
            <span className="eyebrow-dot" />
            A smarter way to assess learning
          </div>
          <h1>
            Assess knowledge.
            <span> Inspire progress.</span>
          </h1>
          <p className="landing-lead">
            Study Check brings students and faculty together in one secure, simple space for meaningful online assessments.
          </p>
          <div className="landing-actions">
            <Link to={isAuthenticated ? dashboardPath : '/login'} className="btn btn-primary btn-lg">
              {isAuthenticated ? 'Open your dashboard' : 'Get started'}
              <span aria-hidden="true">→</span>
            </Link>
          </div>
          <div className="landing-proof">
            <div className="proof-avatars" aria-hidden="true">
              <span>ST</span>
              <span>FC</span>
              <span>+</span>
            </div>
            <span>Built for focused learning and fair assessment</span>
          </div>
        </div>

        <div className="landing-hero-art" aria-label="Assessment dashboard preview">
          <div className="hero-glow" />
          <div className="preview-window">
            <div className="preview-topbar">
              <span className="preview-brand"><span /> Study Check</span>
              <span className="preview-status">Live assessment</span>
            </div>
            <div className="preview-content">
              <div className="preview-heading">
                <div>
                  <span className="preview-kicker">Student workspace</span>
                  <strong>Keep learning forward</strong>
                </div>
                <span className="preview-avatar">AK</span>
              </div>
              <div className="preview-score">
                <div className="score-ring"><strong>86</strong><span>%</span></div>
                <div><span className="preview-kicker">Average score</span><strong>Great momentum</strong><small>↑ 12% this month</small></div>
              </div>
              <div className="preview-bars" aria-hidden="true">
                <span className="bar bar-one" /><span className="bar bar-two" /><span className="bar bar-three" /><span className="bar bar-four" /><span className="bar bar-five" />
              </div>
              <div className="preview-list">
                <div><span className="list-icon">✓</span><span><strong>Web Development Basics</strong><small>Completed · 25 questions</small></span><b>92%</b></div>
                <div><span className="list-icon list-icon-open">→</span><span><strong>Database Systems</strong><small>Ready to begin · 40 minutes</small></span><b>Start</b></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section className="landing-metrics" aria-label="Platform highlights">
        <div><strong>Secure by design</strong><span>Protected assessments and role-based access</span></div>
        <div><strong>Made for both sides</strong><span>One connected experience for students and faculty</span></div>
        <div><strong>Always in sync</strong><span>Reliable timing, saving, and instant results</span></div>
      </section>

      <section className="landing-features">
        <div className="section-intro">
          <span className="eyebrow">Everything in one place</span>
          <h2>Less administration.<br /><span>More learning.</span></h2>
          <p>Designed to make assessment feel organized, transparent, and genuinely useful.</p>
        </div>
        <div className="feature-grid">
          {features.map((feature) => (
            <article className="feature-card" key={feature.icon}>
              <span className="feature-number">{feature.icon}</span>
              <h3>{feature.title}</h3>
              <p>{feature.text}</p>
              <span className="feature-arrow" aria-hidden="true">↗</span>
            </article>
          ))}
        </div>
      </section>
    </div>
  );
};

export default LandingPage;
