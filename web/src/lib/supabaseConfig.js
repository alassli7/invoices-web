// إعداد Supabase (المجاني). استخدم المفتاح العام (publishable) فقط في تطبيق الويب.
// ⚠️ مفتاح السر (SUPABASE_SECRET_KEY) يبقى في الخادم/Edge Function ولا يُكتب هنا أبداً.
export const SUPABASE_URL = "https://ohwreqztjzkpgoihkvgb.supabase.co"
export const SUPABASE_PUBLISHABLE_KEY =
  "sb_publishable_sjcUOeAVGeGMr4Urtz6NtQ_aWMA7_e7"

export const isSupabaseEnabled = Boolean(SUPABASE_URL && SUPABASE_PUBLISHABLE_KEY)

// الرابط العام للتطبيق (يُستخدم في روابط المشاركة/الدفع).
// اضبطه عبر متغيّر البيئة VITE_PUBLIC_BASE_URL عند النشر ليكون رابط موقعك
// الحقيقي بدل localhost. إن تُرك فارغاً يُستخدم رابط الصفحة الحالية تلقائياً.
export const PUBLIC_BASE_URL =
  (typeof import.meta !== "undefined" &&
    import.meta.env &&
    import.meta.env.VITE_PUBLIC_BASE_URL) ||
  (typeof window !== "undefined"
    ? window.location.origin + window.location.pathname
    : "")
