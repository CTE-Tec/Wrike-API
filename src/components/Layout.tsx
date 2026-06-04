'use client';

import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Login from '../pages/Login';

interface LayoutProps {
  breadcrumb: { label: string; active?: boolean }[];
  children: React.ReactNode;
  toolbar?: React.ReactNode;
}

const useMockData = process.env.NEXT_PUBLIC_USE_MOCKS === 'true' || !supabase;

export default function Layout({ breadcrumb, children, toolbar }: LayoutProps) {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(!useMockData);

  useEffect(() => {
    if (useMockData || !supabase) {
      setLoading(false);
      return;
    }

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: currentSession } }) => {
      setSession(currentSession);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, currentSession) => {
      setSession(currentSession);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#001725] flex items-center justify-center text-white text-xs font-bold font-sans">
        <div className="flex flex-col items-center gap-3">
          <div className="w-6 h-6 border-2 border-sky-500 border-t-transparent rounded-full animate-spin" />
          <span>Verificando Autenticação...</span>
        </div>
      </div>
    );
  }

  // If using live Supabase and not logged in, render the login page instead of the layout content
  if (!useMockData && !session) {
    return <Login onLoginSuccess={() => {}} />;
  }

  return (
    <>
      <Topbar breadcrumb={breadcrumb} />
      <div className="app-body">
        <Sidebar />
        <div className="main">
          {toolbar}
          <div className="content">
            {children}
          </div>
        </div>
      </div>
    </>
  );
}
