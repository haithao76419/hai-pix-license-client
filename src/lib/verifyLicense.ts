export async function verifyLicense(license: string, deviceId: string) {
  try {
    const url = import.meta.env.VITE_SUPABASE_URL + "/functions/v1/verify-license";

    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        license,
        device_id: deviceId,
      }),
    });

    const data = await res.json();
    console.log("🔎 verify-license response:", data);
    return data;
  } catch (err) {
    console.error("❌ Lỗi kết nối verify-license:", err);
    return { success: false, message: "Lỗi kết nối máy chủ." };
  }
}
