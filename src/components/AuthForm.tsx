import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = { onLoggedIn: (user: any) => void };

export default function AuthForm({ onLoggedIn }: Props) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function signUp() {
    setMsg("🔄 Đang đăng ký...");
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) return setMsg(`❌ ${error.message}`);
    setMsg("✅ Đăng ký thành công! Vui lòng kiểm tra email để xác thực tài khoản.");
  }

  async function signIn() {
    setMsg("🔑 Đang đăng nhập...");
    setBusy(true);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMsg(`❌ ${error.message}`);
      setBusy(false);
      return;
    }
    onLoggedIn(data.user);
    setMsg("✅ Đăng nhập thành công!");
    setBusy(false);
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-white font-[Inter]">
      <div className="bg-[#141414] border border-[#b51e23] rounded-2xl shadow-2xl p-8 w-[380px] animate-fade-in">
        <h1 className="text-2xl font-bold text-center mb-6 text-[#b51e23] tracking-wide">
          🔒 ĐĂNG NHẬP HẢI SOFT
        </h1>

        <input
          className="w-full mb-3 p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white placeholder-gray-500 focus:border-[#b51e23] outline-none"
          placeholder="Email đăng nhập"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <input
          type="password"
          className="w-full mb-5 p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white placeholder-gray-500 focus:border-[#b51e23] outline-none"
          placeholder="Mật khẩu (tối thiểu 8 ký tự)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={signIn}
            disabled={busy}
            className="flex-1 bg-gradient-to-r from-[#b51e23] to-[#d83c3c] py-2 rounded-md font-semibold text-white hover:brightness-110 transition-all disabled:opacity-60"
          >
            Đăng nhập
          </button>
          <button
            onClick={signUp}
            disabled={busy}
            className="flex-1 bg-[#222] border border-[#b51e23] py-2 rounded-md text-[#b51e23] hover:bg-[#b51e23] hover:text-white transition-all disabled:opacity-60"
          >
            Đăng ký
          </button>
        </div>

        {msg && (
          <p
            className={`mt-4 text-sm text-center border-t border-[#333] pt-3 ${
              msg.includes("✅")
                ? "text-green-400"
                : msg.includes("❌")
                ? "text-red-400"
                : "text-gray-400"
            }`}
          >
            {msg}
          </p>
        )}

        <p className="text-[11px] text-center text-gray-500 mt-3">
          * Bản quyền © 2025 – Hải Soft
        </p>
      </div>
    </div>
  );
}
