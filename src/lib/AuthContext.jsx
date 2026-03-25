import React, { createContext, useState, useContext, useEffect } from 'react';
import { supabase } from '@/api/supabaseClient';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoadingAuth, setIsLoadingAuth] = useState(true);

  useEffect(() => {
    // Check for existing session on mount
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        loadUser(session.user);
      } else {
        setIsLoadingAuth(false);
      }
    });

    // Listen for sign-in / sign-out events
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
      // Upsert so first-login and returning login both work in one call
      const { data, error } = await supabase
        .from('users')
        .upsert(
          {
            email: authUser.email,
            full_name: authUser.user_metadata?.full_name || authUser.email.split('@')[0],
          },
          {
            onConflict: 'email',
            ignoreDuplicates: false,   // update full_name if it changed
          }
        )
        .select()
        .single();

      if (error) throw error;

      setUser(data);
      setIsAuthenticated(true);
    } catch (err) {
      console.error('Failed to load/create user profile:', err.message);
      // Still mark as authenticated — don't block the app on a DB error
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
