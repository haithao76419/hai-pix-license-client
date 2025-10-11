import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";

type Props = { user: any; onSignOut: () => void };

export default function LicensePanel({ user, onSignOut }: Props) {
  const [licenseKey, setLicenseKey] = useState("");
  const [deviceId, setDeviceId] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);

  // show remaining days and expiry
  const [remainingDays, setRemainingDays] = useState<number | null>(null);
  const [expiresAt, setExpiresAt] = useState<string | null>(null);
  const [ownerEmail, setOwnerEmail] = useState<string | null>(null);

  // AI link (gốc) - server allowed list should include this
  const AI_LINK =
    "https://ai.studio/apps/drive/1tu3ufG_VF9LoCzsnWaSA-f0eKlDXn7x9?showPreview=true&showAssistant=true";

  // Helper: get access token
  async function getAccessToken() {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token || null;
  }

  // Generic call to Supabase Edge Function
  async function callEdgeFunction(endpoint: string, payload: any = {}) {
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

    const data = await res.json().catch(() => ({}));
    if (!res.ok) throw new Error(data.error || `Lỗi từ function ${endpoint}`);
    return data;
  }

  // Create one-time redirect token (via Edge Function)
  async function createRedirectToken(target: string) {
    // call via callEdgeFunction to reuse auth
    const data = await callEdgeFunction("create-redirect-token", { target });
    if (!data || !data.id) throw new Error("No redirect id returned");
    return data.id as string;
  }

  // Redirect same tab via Vercel serverless route (consume token)
  function redirectToId(id: string) {
    const origin = window.location.origin;
    window.location.href = `${origin}/api/go/${id}`;
  }

  // Helper format date
  function prettyDate(iso?: string | null) {
    if (!iso) return "—";
    try {
      const d = new Date(iso);
      return d.toLocaleString();
    } catch {
      return iso;
    }
  }

  // Auto-check license on login: check assigned license for this user
  useEffect(() => {
    (async () => {
      try {
        const token = await getAccessToken();
        if (!token) return;

        setMsg("🔎 Kiểm tra giấy phép của bạn...");

        // call check-license with empty payload to look up assigned license
        const data = await callEdgeFunction("check-license", {});

        // The check-license function returns:
        // - success: true/false
        // - status: "valid" | "unused" | "used" | "expired"
        if (!data) {
          setMsg("❌ Lỗi khi kiểm tra license (không có phản hồi).");
          return;
        }

        if (!data.success) {
          // may be expired or not found
          if (data.status === "expired") {
            setMsg("⚠️ License đã hết hạn. Vui lòng gia hạn hoặc nhập key mới.");
            setRemainingDays(null);
            setExpiresAt(data.expires_at ?? null);
            setOwnerEmail(data.email ?? null);
          } else {
            setMsg("⚠️ Chưa có license hợp lệ. Vui lòng nhập key để kích hoạt.");
            setRemainingDays(null);
            setExpiresAt(null);
            setOwnerEmail(null);
          }
          return;
        }

        // success true
        const status = data.status;
        if (status === "valid") {
          // user has an active license
          setRemainingDays(Number(data.remaining_days ?? null) || 0);
          setExpiresAt(data.expires_at ?? null);
          setOwnerEmail(data.email ?? null);
          setMsg(`✅ License hợp lệ. Còn ${data.remaining_days} ngày. Đang mở phần mềm...`);

          // create one-time redirect token then redirect same tab
          try {
            const id = await createRedirectToken(AI_LINK);
            // redirect same tab to /api/go/<id>
            redirectToId(id);
          } catch (err: any) {
            console.warn("Không tạo redirect token:", err);
            // fallback direct (less secure)
            window.location.href = AI_LINK;
          }
        } else if (status === "unused") {
          setMsg("⚠️ License chưa được kích hoạt. Vui lòng nhập key.");
          setRemainingDays(null);
          setExpiresAt(null);
          setOwnerEmail(data.email ?? null);
          if (data.license_key) setLicenseKey(data.license_key);
        } else if (status === "used") {
          // used by other user
          setMsg(`❌ License đã được sử dụng bởi: ${data.email || "Người khác"}`);
          setOwnerEmail(data.email ?? null);
          setRemainingDays(null);
          setExpiresAt(data.expires_at ?? null);
        } else {
          setMsg("⚠️ Trạng thái license không xác định.");
        }
      } catch (err: any) {
        console.error("Auto check error:", err);
        setMsg("❌ Lỗi khi kiểm tra giấy phép. Vui lòng thử lại.");
      }
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Activate license handler
  async function activate() {
    if (!licenseKey) return setMsg("⚠️ Vui lòng nhập license key.");
    setBusy(true);
    setMsg("🔄 Đang kích hoạt license...");

    try {
      const payload = { license_key: licenseKey.trim(), device_id: deviceId || null };
      const data = await callEdgeFunction("activate-license", payload);

      if (!data || !data.success) {
        throw new Error(data?.error || "Kích hoạt thất bại");
      }

      // Update UI with new expiry / remaining days
      setExpiresAt(data.expires_at ?? null);
      setRemainingDays(Number(data.remaining_days ?? null) || 0);
      setMsg(`✅ Kích hoạt thành công! Còn ${data.remaining_days} ngày (Hết hạn: ${prettyDate(data.expires_at)})`);

      // Create redirect token then redirect same tab
      try {
        const id = await createRedirectToken(AI_LINK);
        redirectToId(id);
      } catch (err: any) {
        console.warn("Không tạo redirect token:", err);
        // fallback
        window.location.href = AI_LINK;
      }
    } catch (err: any) {
      console.error("Activate error:", err);
      setMsg(`❌ ${err.message || "Kích hoạt thất bại"}`);
    } finally {
      setBusy(false);
    }
  }

  // Manual check by key
  async function check() {
    if (!licenseKey) return setMsg("⚠️ Vui lòng nhập license key.");
    setBusy(true);
    setMsg("🔎 Đang kiểm tra license...");

    try {
      const data = await callEdgeFunction("check-license", {
        license_key: licenseKey.trim(),
      });

      if (!data) throw new Error("Không có phản hồi");

      if (!data.success) {
        if (data.status === "expired") {
          setMsg(`❌ License đã hết hạn (Hết hạn: ${prettyDate(data.expires_at)})`);
          setRemainingDays(null);
          setExpiresAt(data.expires_at ?? null);
        } else {
          setMsg(`⚠️ ${data.error || "License chưa kích hoạt hoặc không hợp lệ."}`);
          setRemainingDays(null);
          setExpiresAt(null);
        }
        return;
      }

      // success true -> status can be unused|used|valid
      if (data.status === "valid") {
        setRemainingDays(Number(data.remaining_days ?? null) || 0);
        setExpiresAt(data.expires_at ?? null);
        setOwnerEmail(data.email ?? null);
        setMsg(`✅ License hợp lệ.\nKey: ${data.license_key}\nCòn: ${data.remaining_days} ngày\nHết hạn: ${prettyDate(data.expires_at)}`);
      } else if (data.status === "unused") {
        setMsg("⚠️ License chưa kích hoạt. Bạn có thể nhấn Kích hoạt License.");
        setRemainingDays(null);
        setExpiresAt(null);
        if (data.license_key) setLicenseKey(data.license_key);
      } else if (data.status === "used") {
        setMsg(`❌ License đã được sử dụng bởi: ${data.email || "Người khác"}`);
        setOwnerEmail(data.email ?? null);
        setRemainingDays(null);
        setExpiresAt(data.expires_at ?? null);
      } else {
        setMsg("⚠️ Trạng thái license không xác định.");
      }
    } catch (err: any) {
      console.error("Check error:", err);
      setMsg(`❌ ${err.message || "Lỗi kiểm tra"}`);
    } finally {
      setBusy(false);
    }
  }

  async function signOut() {
    await supabase.auth.signOut();
    onSignOut();
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#0d0d0d] text-[#f5f5f5] font-[Inter]">
      <div className="bg-[#141414] border border-[#b51e23] rounded-2xl shadow-2xl p-6 w-[420px] animate-fade-in">
        <h1 className="text-2xl font-bold text-center mb-4 text-[#b51e23] tracking-wide">
          🔒 HẢI PHẦN MỀM QUẢN LÝ CẤP PHÉP
        </h1>

        <div className="flex items-center justify-between mb-3">
          <div>
            <div className="font-medium">{user.email}</div>
            <div className="text-xs text-gray-400">UID: {user.id}</div>
          </div>
          <button onClick={signOut} className="text-sm text-[#b51e23] hover:underline">
            Đăng xuất
          </button>
        </div>

        {/* Remaining days box */}
        {remainingDays !== null && expiresAt ? (
          <div className="mb-3 p-3 rounded-md border border-green-700 bg-[#07140b] text-green-300">
            <div className="font-semibold">🟢 Giấy phép hoạt động</div>
            <div className="text-sm">Còn: <strong>{remainingDays}</strong> ngày</div>
            <div className="text-xs mt-1">Hết hạn: {prettyDate(expiresAt)}</div>
          </div>
        ) : ownerEmail ? (
          <div className="mb-3 p-3 rounded-md border border-yellow-600 bg-[#1a120b] text-yellow-300">
            <div className="font-semibold">⚠️ Giấy phép đã được gán</div>
            <div className="text-sm">Đã gán cho: {ownerEmail}</div>
            {expiresAt && <div className="text-xs mt-1">Hết hạn: {prettyDate(expiresAt)}</div>}
          </div>
        ) : (
          <div className="mb-3 p-3 rounded-md border border-[#333] bg-[#0f0f0f] text-gray-400">
            <div className="text-sm">Bạn chưa có giấy phép hợp lệ. Nhập key để kích hoạt.</div>
          </div>
        )}

        <input
          className="w-full mb-3 p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white placeholder-gray-500 focus:border-[#b51e23] outline-none"
          placeholder="Nhập License Key (vd: HAISOFT-2025-TEST)"
          value={licenseKey}
          onChange={(e) => setLicenseKey(e.target.value)}
        />

        <input
          className="w-full mb-4 p-3 bg-[#1a1a1a] border border-[#333] rounded-md text-white placeholder-gray-500 focus:border-[#b51e23] outline-none"
          placeholder="Nhập ID thiết bị (tùy chọn)"
          value={deviceId}
          onChange={(e) => setDeviceId(e.target.value)}
        />

        <div className="flex gap-3">
          <button
            onClick={check}
            disabled={busy}
            className="flex-1 bg-gradient-to-r from-[#b51e23] to-[#d83c3c] py-2 rounded-md font-semibold text-white hover:brightness-110 transition-all disabled:opacity-60"
          >
            Kiểm tra Giấy phép
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
