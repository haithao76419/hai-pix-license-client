import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = { user: any; onSignOut: () => void };

export default function LicensePanel({ user, onSignOut }: Props) {
  const [licenseKey, setLicenseKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  }

  async function activate() {
    if (!licenseKey) return setMsg("⚠️ Nhập license key trước.");
    setBusy(true); setMsg("Đang kích hoạt...");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Chưa đăng nhập");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/activate-license`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({
          license_key: licenseKey,
          user_id: user.id,
          email: user.email,
          device_id: deviceId || undefined
        }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "Kích hoạt thất bại");
      setMsg(`✅ Kích hoạt thành công! Hết hạn: ${data.expires_at || data.license?.expires_at || ""}`);
    } catch (e: any) {
      setMsg(`❌ ${e.message || e}`);
    } finally { setBusy(false); }
  }

  async function check() {
    if (!licenseKey) return setMsg("⚠️ Nhập license key trước.");
    setBusy(true); setMsg("Đang kiểm tra license...");
    try {
      const token = await getAccessToken();
      if (!token) throw new Error("Chưa đăng nhập");

      const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/check-license`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json", "Authorization": `Bearer ${token}` },
        body: JSON.stringify({ license_key: licenseKey, user_id: user.id, device_id: deviceId || undefined }),
      });

      const data = await res.json();
      if (!res.ok || !data.success) throw new Error(data.error || "License không hợp lệ/hết hạn");
      setMsg(`✅ License hợp lệ. Hết hạn: ${data.expires_at}. Email: ${data.email}`);
    } catch (e: any) {
      setMsg(`❌ ${e.message || e}`);
    } finally { setBusy(false); }
  }

  async function signOut() { await supabase.auth.signOut(); onSignOut(); }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <div className="font-medium">Xin chào, {user.email}</div>
          <div className="text-xs text-gray-500">UID: {user.id}</div>
        </div>
        <button onClick={signOut} className="text-sm underline">Đăng xuất</button>
      </div>

      <input className="border rounded w-full p-2"
        placeholder="Nhập License Key (vd: TEST-7DAYS-001)"
        value={licenseKey} onChange={(e) => setLicenseKey(e.target.value)} />

      <input className="border rounded w-full p-2"
        placeholder="Nhập Device ID (tuỳ chọn)"
        value={deviceId} onChange={(e) => setDeviceId(e.target.value)} />

      <div className="flex gap-2">
        <button onClick={check} disabled={busy}
          className="bg-blue-600 text-white px-4 py-2 rounded disabled:opacity-60">
          Kiểm tra License
        </button>

        <button onClick={activate} disabled={busy}
          className="bg-green-600 text-white px-4 py-2 rounded disabled:opacity-60">
          Kích hoạt License
        </button>
      </div>

      {msg && <p className="text-sm text-gray-700">{msg}</p>}
    </div>
  );
}
