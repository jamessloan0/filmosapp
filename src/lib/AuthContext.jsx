import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        loadUser(session.user);
      } else {
        setUser(null);
        setIsAuthenticated(false);
        setIsLoadingAuth(false);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUser = async (authUser) => {
    try {
      // First try to read the existing row — this preserves role/plan set manually
      const { data: existing } = await supabase
        .from('users')
        .select('*')
        .eq('email', authUser.email)
        .single();

      if (existing) {
        // Row exists — just use it, don't overwrite role/plan
        setUser(existing);
        setIsAuthenticated(true);
        setIsLoadingAuth(false);
        return;
      }

      // No row yet — create one with defaults
      const { data: created, error } = await supabase
        .from('users')
        .insert({
          email: authUser.email,
          full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          role: 'user',
          plan: 'free',
        })
        .select()
        .single();

      if (error) throw error;

      setUser(created);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to load user profile:', err.message);
      // Don't block the app — fall back to a minimal user object
      setUser({ email: authUser.email, role: 'user', plan: 'free' });
      setIsAuthenticated(true);
    } finally {
      setIsLoadingAuth(false);
    }
  };

  const logout = async (shouldRedirect = true) => {
    await supabase.auth.signOut();
    setUser(null);
    setIsAuthenticated(false);
    if (shouldRedirect) window.location.href = '/';
  };

  const navigateToLogin = () => {
    window.location.href = '/';
  };

  return (
    <AuthContext.Provider value={{
      user,
      isAuthenticated,
      isLoadingAuth,
      isLoadingPublicSettings: false,
      authError: null,
      appPublicSettings: null,
      logout,
      navigateToLogin,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
