import { createClient } from "@supabase/supabase-js";

// Thông tin từ Supabase Project của bạn
const supabaseUrl = "https://ahqlhseqsdkzzlbdppvj.supabase.co";
const supabaseAnonKey =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImFocWxoc2Vxc2RrenpsYmRwcHZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTkzODU0MzQsImV4cCI6MjA3NDk2MTQzNH0.1ENptMYi8kMDAHYP7H6aOnhEk3d5ee6Zap5C23tbRwA";

// Tạo client Supabase
export const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Kiểm tra kết nối
console.log("✅ Supabase connected:", supabaseUrl);
