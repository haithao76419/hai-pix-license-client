import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = { user: any; onSignOut: () => void };

export default function LicensePanel({ user, onSignOut }: Props) {
  const [licenseKey, setLicenseKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // 🧩 In ra access_token để test Postman
  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      if (data?.session?.access_token) {
        console.log("🔑 ACCESS TOKEN:", data.session.access_token);
      } else {
        console.warn("⚠️ Chưa có token, hãy đăng nhập Supabase trước.");
      }
    })();
  }, []);

  // ✅ Lấy token đăng nhập hiện tại
  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  // ✅ Gọi API Supabase Function
  async function callEdgeFunction(endpoint: string, payload: any) {
    const token = await getAccessToken();
    if (!token) throw new Error("Chưa đăng nhập Supabase");

    const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/${endpoint}`;

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Lỗi từ server Supabase");
    return data;
  }

  // ✅ Kích hoạt license
  async function activate() {
    if (!licenseKey) return setMsg("⚠️ Vui lòng nhập license key.");
    setBusy(true);
    setMsg("🔄 Đang kích hoạt license...");

    try {
      const data = await callEdgeFunction("activate-license", {
        license_key: licenseKey.trim(),
        user_id: user.id,
        device_id: deviceId || null,
      });

      if (!data.success) throw new Error(data.error || "Kích hoạt thất bại.");

      setMsg(
        `✅ Kích hoạt thành công!\nKey: ${licenseKey}\nHết hạn: ${
          data.expires_at || data.license?.expires_at || "Không rõ"
        }`
      );
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  // ✅ Kiểm tra license
  async function check() {
    if (!licenseKey) return setMsg("⚠️ Vui lòng nhập license key.");
    setBusy(true);
    setMsg("🔎 Đang kiểm tra license...");

    try {
      const data = await callEdgeFunction("check-license", {
        license_key: licenseKey.trim(),
        user_id: user.id,
        device_id: deviceId || null,
      });

      if (!data.success)
        throw new Error(data.error || "License không hợp lệ hoặc đã hết hạn.");

      if (data.status === "used") {
        setMsg(`❌ License đã được sử dụng bởi: ${data.email}`);
      } else {
        setMsg(
          `✅ License hợp lệ.\nKey: ${licenseKey}\nHết hạn: ${data.expires_at}\nNgười dùng: ${
            data.email || "Chưa gán email"
          }`
        );
      }
    } catch (err: any) {
      setMsg(`❌ ${err.message}`);
    } finally {
      setBusy(false);
    }
  }

  // ✅ Đăng xuất
  async function signOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  // ✅ Giao diện (theme Hải Soft)
  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-[#f5f5f5] font-[Inter]">
      <div className="bg-[#141414] border border-[#b51e23] rounded-2xl shadow-2xl p-6 w-[380px] animate-fade-in">
        <h1 className="text-2xl font-bold text-center mb-4 text-[#b51e23] tracking-wide">
          🔒 HẢI SOFT LICENSE MANAGER
        </h1>

        <div className="flex items-center justify-between mb-4">
          <div>
            <div className="font-medium">{user.email}</div>
            <div className="text-xs text-gray-400">UID: {user.id}</div>
          </div>
          <button
            onClick={signOut}
            className="text-sm text-[#b51e23] hover:underline"
          >
            Đăng xuất
          </button>
        </div>

        <input
          className="w-full mb-3 p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white placeholder-gray-500 focus:border-[#b51e23] outline-none"
          placeholder="Nhập License Key (vd: HAISOFT-2025-TEST)"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
        />

        <input
          className="w-full mb-4 p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white placeholder-gray-500 focus:border-[#b51e23] outline-none"
          placeholder="Nhập Device ID (tùy chọn)"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={check}
            disabled={busy}
            className="flex-1 bg-gradient-to-r from-[#b51e23] to-[#d83c3c] py-2 rounded-md font-semibold text-white hover:brightness-110 transition-all disabled:opacity-60"
          >
            Kiểm tra License
          </button>

          <button
            onClick={activate}
            disabled={busy}
            className="flex-1 bg-[#222] border border-[#b51e23] py-2 rounded-md text-[#b51e23] hover:bg-[#b51e23] hover:text-white transition-all disabled:opacity-60"
          >
            Kích hoạt License
          </button>
        </div>

        {msg && (
          <p
            className={`mt-4 text-sm text-center border-t border-[#333] pt-3 whitespace-pre-line ${
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
