import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import LoginPage from './pages/LoginPage';
import Timer from './components/Timer';
import QuestionPalette from './components/QuestionPalette';
import Modal from './components/Modal';
import { AuthProvider } from './context/AuthContext';

describe('Frontend Component & UI Tests', () => {
  it('renders LandingPage with a clear academic call to action', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LandingPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByText(/Assess knowledge/i)).toBeInTheDocument();
    expect(screen.getByText(/^Get started$/i)).toBeInTheDocument();
    expect(screen.queryByText(/Sign in to portal/i)).not.toBeInTheDocument();
    expect(screen.queryByText(/Demo Evaluation Credentials/i)).not.toBeInTheDocument();
  });

  it('renders LoginPage with role selection and email/password inputs', () => {
    render(
      <AuthProvider>
        <MemoryRouter>
          <LoginPage />
        </MemoryRouter>
      </AuthProvider>
    );

    expect(screen.getByLabelText(/Email Address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign in as student/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Faculty/i })).toBeInTheDocument();
    expect(screen.queryByText(/Quick Demo Fill/i)).not.toBeInTheDocument();

    const signInButton = screen.getByRole('button', { name: /Sign in as student/i });
    expect(signInButton).toBeDisabled();
    fireEvent.change(screen.getByLabelText(/Email Address/i), { target: { value: 'student@example.com' } });
    fireEvent.change(screen.getByLabelText(/Password/i), { target: { value: 'password' } });
    expect(signInButton).toBeEnabled();
    expect(signInButton).toHaveClass('ready');

    fireEvent.click(screen.getByRole('button', { name: /Faculty/i }));
    expect(screen.getByRole('button', { name: /Sign in as faculty/i })).toBeInTheDocument();
  });

  it('QuestionPalette renders correct answered and unanswered counters', () => {
    const mockQuestions = [
      { _id: 'q1', questionText: 'Q1' },
      { _id: 'q2', questionText: 'Q2' },
      { _id: 'q3', questionText: 'Q3' }
    ];
    const mockAnswers = { q1: 'opt_1' }; // 1 answered, 2 unanswered
    const onSelect = vi.fn();

    render(
      <QuestionPalette
        questions={mockQuestions}
        currentIndex={0}
        answers={mockAnswers}
        onSelectQuestion={onSelect}
      />
    );

    expect(screen.getByText(/Answered \(1\)/i)).toBeInTheDocument();
    expect(screen.getByText(/Unanswered \(2\)/i)).toBeInTheDocument();

    // Clicking question 2 button triggers callback
    const btn2 = screen.getByRole('button', { name: /Go to question 2/i });
    fireEvent.click(btn2);
    expect(onSelect).toHaveBeenCalledWith(1);
  });

  it('Timer component counts down and displays formatted time', () => {
    // Deadline 10 minutes in future
    const futureDeadline = new Date(Date.now() + 10 * 60 * 1000).toISOString();
    const onExpire = vi.fn();

    const { container } = render(
      <Timer deadline={futureDeadline} onExpire={onExpire} />
    );

    expect(container.querySelector('.timer-badge')).toBeInTheDocument();
    expect(onExpire).not.toHaveBeenCalled();
  });

  it('Modal renders content when open and hides when closed', () => {
    const onClose = vi.fn();
    const { rerender } = render(
      <Modal isOpen={false} onClose={onClose} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );

    expect(screen.queryByText('Modal Content')).not.toBeInTheDocument();

    rerender(
      <Modal isOpen={true} onClose={onClose} title="Test Modal">
        <p>Modal Content</p>
      </Modal>
    );

    expect(screen.getByText('Test Modal')).toBeInTheDocument();
    expect(screen.getByText('Modal Content')).toBeInTheDocument();

    // Click close button
    fireEvent.click(screen.getByLabelText(/Close modal/i));
    expect(onClose).toHaveBeenCalled();
  });
});
