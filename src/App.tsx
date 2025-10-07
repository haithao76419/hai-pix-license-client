import { useEffect, useState } from "react";
import { supabase } from "./lib/supabaseClient";
import AuthForm from "./components/AuthForm";
import LicensePanel from "./components/LicensePanel";

export default function App() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // ✅ Kiểm tra trạng thái đăng nhập khi khởi động
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      setUser(data?.session?.user ?? null);
      setLoading(false);
    })();

    // Theo dõi sự thay đổi đăng nhập
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      listener.subscription.unsubscribe();
    };
  }, []);

  if (loading)
    return (
      <div className="flex items-center justify-center h-screen bg-black text-white text-lg">
        🔄 Đang tải ứng dụng Hải Soft...
      </div>
    );

  return (
    <div className="min-h-screen bg-black text-white flex items-center justify-center">
      {!user ? (
        <AuthForm onLoggedIn={(u) => setUser(u)} />
      ) : (
        <LicensePanel user={user} onSignOut={() => setUser(null)} />
      )}
    </div>
  );
}
