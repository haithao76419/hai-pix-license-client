import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = { onLoggedIn: (user: any) => void };

export default function AuthForm({ onLoggedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");

  async function signUp() {
    setMsg("Đang đăng ký...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(`❌ ${error.message}`);
    setMsg("✅ Đăng ký thành công. Kiểm tra email để xác thực rồi đăng nhập.");
  }

  async function signIn() {
    setMsg("Đang đăng nhập...");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return setMsg(`❌ ${error.message}`);
    onLoggedIn(data.user);
    setMsg("✅ Đăng nhập thành công!");
  }

  return (
    <div className="space-y-3">
      <input className="border rounded w-full p-2" placeholder="Email"
        value={email} onChange={(e) => setEmail(e.target.value)} />
      <input className="border rounded w-full p-2" type="password" placeholder="Mật khẩu (≥8 ký tự)"
        value={password} onChange={(e) => setPassword(e.target.value)} />

      <div className="flex gap-2">
        <button onClick={signIn} className="bg-blue-600 text-white px-4 py-2 rounded">
          Đăng nhập
        </button>
        <button onClick={signUp} className="bg-gray-200 px-4 py-2 rounded">
          Đăng ký
        </button>
      </div>

      {msg && <p className="text-sm text-gray-600">{msg}</p>}
    </div>
  );
}
