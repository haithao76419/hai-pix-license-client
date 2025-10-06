import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import AuthForm from "./components/AuthForm";
import LicensePanel from "./components/LicensePanel";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUser(data.session?.user ?? null);
      setReady(true);
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e: any, session: any) => {
      setUser(session?.user ?? null);
    });
    return () => sub?.subscription?.unsubscribe();
  }, []);

  if (!ready) return <div className="p-6">Đang tải...</div>;

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="w-full max-w-2xl border rounded-2xl p-6 shadow-sm">
        <h1 className="text-2xl font-bold mb-4">🔐 License Manager</h1>
        {!user ? (
          <AuthForm onLoggedIn={(u) => setUser(u)} />
        ) : (
          <LicensePanel user={user} onSignOut={() => setUser(null)} />
        )}
        <p className="text-xs text-gray-400 mt-6">
          * Yêu cầu đã bật Email/Password trong Supabase Auth Providers.
        </p>
      </div>
    </div>
  );
}
