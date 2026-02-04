import { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../services/supabaseClient';

export type User = {
  id: string;
  email: string;
  [key: string]: any;
} | null;

const UserContext = createContext<{ user: User; setUser: (u: User) => void }>({ user: null, setUser: () => {} });

export function useUser() {
  return useContext(UserContext);
}

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User>(null);

  useEffect(() => {
    const session = supabase.auth.getSession().then(({ data }) => {
      if (data?.session?.user) {
        setUser({ id: data.session.user.id, email: data.session.user.email });
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser({ id: session.user.id, email: session.user.email });
      } else {
        setUser(null);
      }
    });
    return () => {
      listener?.subscription.unsubscribe();
    };
  }, []);

  return (
    <UserContext.Provider value={{ user, setUser }}>
      {children}
    </UserContext.Provider>
  );
}
