import React, { useState } from 'react';
import { SignIn, SignUp } from '@clerk/clerk-react';
import Galaxy from './Galaxy';

export const AuthScreen: React.FC = () => {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');

  return (
    <div className="min-h-screen bg-[#0B0F19] text-[#F1F5F9] flex flex-col justify-between p-4 md:p-8 font-sans animate-fade-in-up relative">
      {/* Interactive Galaxy Background */}
      <div className="fixed inset-0 z-0 opacity-40 pointer-events-none overflow-hidden">
        <Galaxy 
          mouseRepulsion
          mouseInteraction
          density={1}
          glowIntensity={0.3}
          saturation={0}
          hueShift={140}
          twinkleIntensity={0.3}
          rotationSpeed={0.1}
          repulsionStrength={2}
          autoCenterRepulsion={0}
          starSpeed={0.5}
          speed={1}
        />
      </div>
      {/* Top Bar */}
      <header className="max-w-7xl w-full mx-auto flex items-center justify-between py-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-indigo-500 to-purple-500 flex items-center justify-center shadow-lg shadow-indigo-500/25">
            <span className="material-symbols-outlined text-white text-2xl">pie_chart</span>
          </div>
          <div className="flex flex-col">
            <span className="text-2xl font-extrabold tracking-tight gradient-text-indigo leading-none">SplitStay</span>
            <span className="text-[10px] tracking-wider font-semibold text-indigo-300 uppercase opacity-80">Shared Living</span>
          </div>
        </div>
        <div className="text-xs text-slate-300 bg-slate-900/90 px-3.5 py-1.5 rounded-full border border-slate-700/60 shadow-sm flex items-center gap-1.5">
          <span className="material-symbols-outlined text-xs text-emerald-400">lock</span>
          <span>Secure Authentication by Clerk</span>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="max-w-7xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-10 items-center my-auto py-8">
        {/* Left Column: Product Value Proposition */}
        <div className="lg:col-span-6 space-y-6">
          <div className="inline-flex items-center gap-2 bg-indigo-500/10 border border-indigo-500/30 text-indigo-300 px-3.5 py-1 rounded-full text-xs font-bold">
            <span className="material-symbols-outlined text-sm text-indigo-400">bolt</span>
            <span>Smart Expense Splitting & Live SMS Alerts</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-extrabold tracking-tight text-slate-100 leading-tight">
            Split household bills <span className="gradient-text-indigo">without awkwardness.</span>
          </h1>

          <p className="text-base text-slate-400 leading-relaxed max-w-xl">
            SplitStay helps roommates and groups track shared expenses, calculate exact balances, and notify members automatically via instant SMS alerts.
          </p>

          {/* Feature List */}
          <div className="space-y-4 pt-2">
            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-xl">account_balance_wallet</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Automated Roommate Balances</h3>
                <p className="text-xs text-slate-400">Instant breakdown of who owes whom in each group.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/15 border border-indigo-500/30 text-indigo-400 flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-xl">sms</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">SMS & WhatsApp Alerts</h3>
                <p className="text-xs text-slate-400">Notify roommates when expenses are added or settled.</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400 flex items-center justify-center shrink-0 shadow-sm">
                <span className="material-symbols-outlined text-xl">payments</span>
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-200">Seamless Settle Up</h3>
                <p className="text-xs text-slate-400">Connect Venmo & Cash App handles for zero-friction payments.</p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Clerk Sign In / Sign Up Component */}
        <div className="lg:col-span-6 flex flex-col items-center justify-center w-full">
          <div className="w-full max-w-md glass-panel border border-slate-700/80 rounded-3xl p-6 shadow-2xl flex flex-col items-center">
            {/* Auth Mode Selector Header */}
            <div className="flex w-full bg-slate-900/90 p-1.5 rounded-2xl border border-slate-800 mb-6">
              <button
                onClick={() => setMode('signin')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signin'
                    ? 'btn-gradient-primary text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                Sign In
              </button>
              <button
                onClick={() => setMode('signup')}
                className={`flex-1 py-2.5 text-xs font-bold rounded-xl transition-all ${
                  mode === 'signup'
                    ? 'btn-gradient-primary text-white shadow-lg shadow-indigo-500/25'
                    : 'text-slate-400 hover:text-slate-200'
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
                      headerTitle: 'text-slate-100 font-bold text-xl',
                      headerSubtitle: 'text-slate-400 text-xs',
                      socialButtonsBlockButton: 'border-slate-700 text-slate-200 hover:bg-slate-800',
                      formButtonPrimary: 'btn-gradient-primary text-white font-bold py-2.5 rounded-xl shadow-lg',
                      formFieldLabel: 'text-slate-400 text-xs font-semibold',
                      formFieldInput: 'bg-slate-900/90 border-slate-700 text-slate-100 rounded-xl focus:border-indigo-500',
                      footerActionLink: 'text-indigo-400 hover:underline font-semibold'
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
                      headerTitle: 'text-slate-100 font-bold text-xl',
                      headerSubtitle: 'text-slate-400 text-xs',
                      socialButtonsBlockButton: 'border-slate-700 text-slate-200 hover:bg-slate-800',
                      formButtonPrimary: 'btn-gradient-primary text-white font-bold py-2.5 rounded-xl shadow-lg',
                      formFieldLabel: 'text-slate-400 text-xs font-semibold',
                      formFieldInput: 'bg-slate-900/90 border-slate-700 text-slate-100 rounded-xl focus:border-indigo-500',
                      footerActionLink: 'text-indigo-400 hover:underline font-semibold'
                    }
                  }}
                />
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="max-w-7xl w-full mx-auto text-center py-4 border-t border-slate-800/60 text-xs text-slate-500">
        SplitStay &copy; {new Date().getFullYear()} • Financial Clarity for Shared Living
      </footer>
    </div>
  );
};
