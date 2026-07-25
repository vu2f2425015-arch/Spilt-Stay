import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen bg-background text-on-background flex flex-col justify-between p-4 md:p-8 font-sans">
      {/* Top Bar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-2">
          <span className="material-symbols-outlined text-primary text-3xl">pie_chart</span>
          <span className="text-2xl font-bold tracking-tight text-primary">SplitStay</span>
        </div>
        <div className="text-xs text-on-surface-variant bg-surface-container-low px-3 py-1.5 rounded-full border border-outline-variant/40">
          🔒 Secure Authentication by Clerk
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center my-auto py-6">
        {/* Left Column: Product Value Proposition */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 bg-primary/10 border border-primary/30 text-primary px-3 py-1 rounded-full text-xs font-semibold">
            <span className="material-symbols-outlined text-sm">bolt</span>
            Smart Expense Splitting & SMS Alerts
          </div>

          <h1 className="text-3xl md:text-5xl font-extrabold tracking-tight text-on-surface leading-tight">
            Split household bills without the awkwardness.
          </h1>

          <p className="text-base text-on-surface-variant leading-relaxed max-w-xl">
            SplitStay helps roommates and groups track shared expenses, calculate exact balances, and notify members automatically via instant SMS alerts.
          </p>

          {/* Feature List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant/40 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Automated Balances</h3>
                <p className="text-xs text-on-surface-variant">Instant breakdown of who owes whom in each group.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant/40 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">sms</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">SMS & WhatsApp Alerts</h3>
                <p className="text-xs text-on-surface-variant">Notify members when expenses are added or settled.</p>
              </div>
            </div>

            <div className="flex items-start gap-3">
              <div className="w-9 h-9 rounded-xl bg-surface-container-high border border-outline-variant/40 text-primary flex items-center justify-center shrink-0">
                <span className="material-symbols-outlined text-lg">payments</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-on-surface">Seamless Settle Up</h3>
                <p className="text-xs text-on-surface-variant">Connect Venmo & Cash App handles for zero-friction payments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clerk Sign In / Sign Up Component */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-md bg-surface-container/80 border border-outline-variant rounded-2xl p-6 shadow-2xl backdrop-blur-md flex flex-col items-center">
            {/* Auth Mode Selector Header */}
            <div className="flex w-full bg-surface-container-low p-1 rounded-xl border border-outline-variant/40 mb-6">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signin'
                    ? 'bg-primary-container text-on-primary-container shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2 text-xs font-semibold rounded-lg transition-all ${
                  mode === 'signup'
                    ? 'bg-primary-container text-on-primary-container shadow'
                    : 'text-on-surface-variant hover:text-on-surface'
                }`}
              >
                Create Account
              </button>
            </div>

            {/* Clerk Component Container */}
            <div className="w-full flex justify-center clerk-auth-wrapper min-h-[380px]">
              {mode === 'signin' ? (
                <SignIn
                  routing="hash"
                  signUpUrl="#signup"
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'bg-transparent shadow-none p-0 w-full',
                      headerTitle: 'text-on-surface font-bold text-xl',
                      headerSubtitle: 'text-on-surface-variant text-xs',
                      socialButtonsBlockButton: 'border-outline-variant text-on-surface hover:bg-surface-container-high',
                      formButtonPrimary: 'bg-primary hover:bg-primary-hover text-on-primary font-bold py-2.5 rounded-xl shadow-lg',
                      formFieldLabel: 'text-on-surface-variant text-xs font-semibold',
                      formFieldInput: 'bg-surface-container-low border-outline-variant text-on-surface rounded-xl focus:border-primary',
                      footerActionLink: 'text-primary hover:underline font-semibold'
                    }
                  }}
                />
              ) : (
                <SignUp
                  routing="hash"
                  signInUrl="#signin"
                  appearance={{
                    elements: {
                      rootBox: 'w-full',
                      card: 'bg-transparent shadow-none p-0 w-full',
                      headerTitle: 'text-on-surface font-bold text-xl',
                      headerSubtitle: 'text-on-surface-variant text-xs',
                      socialButtonsBlockButton: 'border-outline-variant text-on-surface hover:bg-surface-container-high',
                      formButtonPrimary: 'bg-primary hover:bg-primary-hover text-on-primary font-bold py-2.5 rounded-xl shadow-lg',
                      formFieldLabel: 'text-on-surface-variant text-xs font-semibold',
                      formFieldInput: 'bg-surface-container-low border-outline-variant text-on-surface rounded-xl focus:border-primary',
                      footerActionLink: 'text-primary hover:underline font-semibold'
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto text-center py-4 border-t border-outline-variant/20 text-xs text-on-surface-variant">
        SplitStay &copy; {new Date().getFullYear()} • Powered by Clerk & Supabase
      </footer>
    </div>
  );
};
