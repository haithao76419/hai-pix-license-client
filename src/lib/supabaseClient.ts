// lib/supabaseClient.ts

import { createClient } from "@supabase/supabase-js";

// ✅ Lấy từ biến môi trường theo cách của Vite
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL!;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY!;

// ✅ Tạo client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// (Tùy chọn) Kiểm tra kết nối
console.log("✅ Supabase connected:", supabaseUrl);
