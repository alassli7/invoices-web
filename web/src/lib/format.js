import { isSupabaseEnabled, SUPABASE_URL, PUBLIC_BASE_URL } from "./supabaseConfig.js"

export const defaultProfile = {
  businessName: "نشاطي الحر",
  freelanceLogo: "",
  companyLogo: "",
  docType: "freelance",
  docNumber: "",
  businessCategory: "service",
  bankId: "alrajhi_business",
  bankName: "الراجحي أعمال",
  iban: "",
  accountNumber: "",
  accountName: "عبدالله خليفه السعدون",
  phone: "",
  email: "",
  address: "",
  note: "هذه الفاتورة غير خاضسة لضريبة القيمة المضافة.",
  payMethods: {
    bank: true,
    bankLogo: "",
    applePay: false,
    applePayPhone: "",
    applePayLogo: "",
    mastercard: false,
    mastercardLogo: "",
    taxNumber: "",
    vatRate: 0
  }
}

// أصناف افتراضية حسب نوع النشاط
export const defaultCatalogByCategory = {
  service: [
    { desc: "برمجة تطبيقات الجوال (أندرويد / آيفون)", price: 0, qty: 1, type: "service" },
    { desc: "برمجة مواقع الإنترنت", price: 0, qty: 1, type: "service" },
    { desc: "إنشاء متجر إلكتروني", price: 0, qty: 1, type: "service" },
    { desc: "لوحة تحكم إدارية للموقع", price: 0, qty: 1, type: "service" },
    { desc: "ربط بوابات الدفع (مدى / Apple Pay)", price: 0, qty: 1, type: "service" },
    { desc: "تطوير برامج سطح المكتب للشركات", price: 0, qty: 1, type: "service" },
    { desc: "صيانة وتحديث المواقع والتطبيقات", price: 0, qty: 1, type: "service" },
    { desc: "حجز اسم نطاق واستضافة", price: 0, qty: 1, type: "service" },
    { desc: "إعداد الشبكات السلكية واللاسلكية", price: 0, qty: 1, type: "service" },
    { desc: "تركيب الراوتر والواي فاي", price: 0, qty: 1, type: "service" },
    { desc: "تأمين الشبكة وحماية البيانات", price: 0, qty: 1, type: "service" },
    { desc: "تركيب وضبط كاميرات المراقبة", price: 0, qty: 1, type: "service" },
    { desc: "إعداد السيرفرات والنسخ الاحتياطي", price: 0, qty: 1, type: "service" }
  ],
  restaurant: [
    { desc: "برجر لحم", price: 25, qty: 1, type: "restaurant" },
    { desc: "برجر دجاج", price: 22, qty: 1, type: "restaurant" },
    { desc: "بيتزا مارغريتا", price: 30, qty: 1, type: "restaurant" },
    { desc: "بيتزا دجاج", price: 35, qty: 1, type: "restaurant" },
    { desc: "شاورما لحم", price: 20, qty: 1, type: "restaurant" },
    { desc: "شاورما دجاج", price: 18, qty: 1, type: "restaurant" },
    { desc: "سندوتش فلافل", price: 10, qty: 1, type: "restaurant" },
    { desc: "سلطة خضراء", price: 12, qty: 1, type: "restaurant" },
    { desc: "بطاطس مقلية", price: 10, qty: 1, type: "restaurant" },
    { desc: "عصير برتقال", price: 8, qty: 1, type: "restaurant" },
    { desc: "ماء معدني", price: 3, qty: 1, type: "restaurant" },
    { desc: "مشروب غازي", price: 5, qty: 1, type: "restaurant" }
  ],
  cafeteria: [
    { desc: "قهوة أمريكي", price: 8, qty: 1, type: "cafeteria" },
    { desc: "قهوة لاتيه", price: 12, qty: 1, type: "cafeteria" },
    { desc: "قهوة كابتشينو", price: 12, qty: 1, type: "cafeteria" },
    { desc: "شاي", price: 5, qty: 1, type: "cafeteria" },
    { desc: "عصير طازج", price: 10, qty: 1, type: "cafeteria" },
    { desc: "كيكة شوكولاتة", price: 15, qty: 1, type: "cafeteria" },
    { desc: "سندوتش دجاج", price: 18, qty: 1, type: "cafeteria" },
    { desc: "سندوتش تونة", price: 15, qty: 1, type: "cafeteria" },
    { desc: "سلطة سيزر", price: 20, qty: 1, type: "cafeteria" },
    { desc: "ماء معدني", price: 3, qty: 1, type: "cafeteria" },
    { desc: "مشروب غازي", price: 5, qty: 1, type: "cafeteria" }
  ],
  supermarket: [
    { desc: "خبز توست", price: 5, qty: 1, type: "supermarket" },
    { desc: "حليب طازج", price: 8, qty: 1, type: "supermarket" },
    { desc: "بيض (كرتونة 30)", price: 25, qty: 1, type: "supermarket" },
    { desc: "أرز بسمتي 5 كيلو", price: 35, qty: 1, type: "supermarket" },
    { desc: "زيت نباتي 1.5 لتر", price: 18, qty: 1, type: "supermarket" },
    { desc: "سكر 2 كيلو", price: 12, qty: 1, type: "supermarket" },
    { desc: "شاي أكياس", price: 15, qty: 1, type: "supermarket" },
    { desc: "معكرونة 500 جرام", price: 6, qty: 1, type: "supermarket" },
    { desc: "معلبات تونة", price: 10, qty: 1, type: "supermarket" },
    { desc: "مياه معدنية (كرتون)", price: 20, qty: 1, type: "supermarket" }
  ],
  paint_shop: [
    { desc: "دهان أبيض داخلي (4 لتر)", price: 45, qty: 1, type: "paint_shop" },
    { desc: "دهان خارجي (4 لتر)", price: 65, qty: 1, type: "paint_shop" },
    { desc: "دهان بلاستيك (جالون)", price: 120, qty: 1, type: "paint_shop" },
    { desc: "فرشاة دهان كبيرة", price: 15, qty: 1, type: "paint_shop" },
    { desc: "رولة دهان", price: 20, qty: 1, type: "paint_shop" },
    { desc: "ورق جدران", price: 80, qty: 1, type: "paint_shop" },
    { desc: "معجون تسوية", price: 35, qty: 1, type: "paint_shop" },
    { desc: "تينر (لتر)", price: 12, qty: 1, type: "paint_shop" }
  ],
  other: []
}

// أصناف جاهزة مقترحة للأعمال البرمجية والشبكات (للتوافق مع الكود القديم)
export const defaultCatalogItems = defaultCatalogByCategory.service

// التحقق الآلي من صيغة وثيقة النشاط
// docType: "cr" (رقم الشركة/سجل تجاري) أو "freelance" (وثيقة العمل الحر)
export function validateDoc(docType, value) {
  const v = (value || "").trim()
  if (!v) return { valid: false, message: "هذا الحقل مطلوب" }
  if (docType === "cr") {
    if (!/^7\d{9}$/.test(v))
      return { valid: false, message: "الرقم الموحد يجب أن يبدأ بـ 7 ويتكون من 10 أرقام" }
    return { valid: true, message: "صيغة صحيحة ✓" }
  }
  // وثيقة العمل الحر: FL-xxxxxxxx
  if (!/^FL-/i.test(v))
    return { valid: false, message: "يجب أن يبدأ الرقم بـ FL-" }
  if (!/^FL-[A-Za-z0-9]{4,}$/i.test(v))
    return { valid: false, message: "الصيغة الصحيحة: FL-XXXXXXXX" }
  return { valid: true, message: "صيغة صحيحة ✓" }
}

// اسم الوثيقة بالعربية
export function docLabel(docType) {
  return docType === "cr" ? "رقم الشركة (السجل التجاري)" : "وثيقة العمل الحر"
}

// شعارات الوثيقة من Supabase Storage
export const DOC_LOGOS = {
  freelance: "https://ohwreqztjzkpgoihkvgb.supabase.co/storage/v1/object/public/logos/freelance-logo.webp",
  cr: "https://ohwreqztjzkpgoihkvgb.supabase.co/storage/v1/object/public/logos/commerce-logo.png"
}

// ---------- بنوك السعودية مع أسماء ملفات الشعارات في Supabase Storage (bucket: banks) ----------
// اسم الـ bucket في Supabase Storage الذي يحتوي شعارات البنوك
export const BANKS_BUCKET = "banks"

// شعار افتراضي (SVG placeholder) عند عدم توفر شعار البنك
export const BANK_PLACEHOLDER =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    `<svg xmlns='http://www.w3.org/2000/svg' width='120' height='60' viewBox='0 0 120 60'><rect width='120' height='60' rx='8' fill='#f6f7f0' stroke='#cdc9b2'/><text x='60' y='34' text-anchor='middle' font-family='IBM Plex Sans Arabic, sans-serif' font-size='11' fill='#1f4d3a' font-weight='700'>شعار البنك</text></svg>`
  )

export const SAUDI_BANKS = [
  { id: "alrajhi_business", name: "الراجحي أعمال", logoFile: "alrajhi-business.png", ibanPrefix: "SA" },
  { id: "alrajhi", name: "مصرف الراجحي", logoFile: "alrajhi.png", ibanPrefix: "SA" },
  // aliases للتوافق مع البيانات القديمة
  { id: "snb", name: "البنك الأهلي السعودي", logoFile: "snb.png", ibanPrefix: "SA" },
  { id: "snbbank", name: "البنك الأهلي السعودي", logoFile: "snb.png", ibanPrefix: "SA" },
  { id: "riyad", name: "بنك الرياض", logoFile: "riyad.png", ibanPrefix: "SA" },
  { id: "riyadbank", name: "بنك الرياض", logoFile: "riyad.png", ibanPrefix: "SA" },
  { id: "alinma", name: "مصرف الإنماء", logoFile: "alinma.png", ibanPrefix: "SA" },
  { id: "albilad", name: "بنك البلاد", logoFile: "albilad.png", ibanPrefix: "SA" },
  { id: "aljazira", name: "بنك الجزيرة", logoFile: "aljazira.png", ibanPrefix: "SA" },
  { id: "sabb", name: "بنك ساب", logoFile: "sabb.png", ibanPrefix: "SA" },
  { id: "bsf", name: "البنك السعودي الفرنسي", logoFile: "bsf.png", ibanPrefix: "SA" },
  { id: "anb", name: "البنك العربي الوطني", logoFile: "anb.png", ibanPrefix: "SA" },
  { id: "fransi", name: "البنك السعودي الفرنسي", logoFile: "bsf.png", ibanPrefix: "SA" },
  // بنوك قديمة للتوافق (ستظهر نفس الشعار أو placeholder)
  { id: "samba", name: "سامبا (مدمج مع الأهلي)", logoFile: "snb.png", ibanPrefix: "SA" },
  { id: "alawwal", name: "البنك الأول (مدمج مع ساب)", logoFile: "sabb.png", ibanPrefix: "SA" },
  { id: "custom", name: "بنك آخر (إدخال يدوي)", logoFile: "", ibanPrefix: "" }
]

// بناء رابط شعار البنك من Supabase Storage (bucket: banks)
// يعمل سواء كان الـ bucket موجوداً أم لا — في حال عدم وجوده ستفشل الصورة وسيُعرض الـ placeholder عبر onError
export function getBankLogoUrl(bankId) {
  if (!bankId || bankId === "custom") return ""
  const bank = SAUDI_BANKS.find(b => b.id === bankId)
  if (!bank || !bank.logoFile) return ""
  // دائماً نبني رابط Supabase حتى لو isSupabaseEnabled = false — الرابط يعمل كـ public URL
  return `${SUPABASE_URL}/storage/v1/object/public/${BANKS_BUCKET}/${bank.logoFile}`
}

export function docLogo(docType) {
  return DOC_LOGOS[docType] || DOC_LOGOS.freelance
}

export function getBankById(id) {
  return SAUDI_BANKS.find(b => b.id === id)
}

export function getBankLogo(bankId) {
  return getBankLogoUrl(bankId)
}

// قائمة البنوك للعرض في القوائم المنسدلة (بدون تكرار الأسماء)
export function getDisplayBanks() {
  const seen = new Set()
  const out = []
  for (const b of SAUDI_BANKS) {
    if (b.id === "custom") continue
    if (seen.has(b.name)) continue
    // فضّل المعرّف الأساسي (بدون alias)
    seen.add(b.name)
    out.push(b)
  }
  out.push(SAUDI_BANKS.find(b => b.id === "custom"))
  return out
}

// يُرجع شعار البنك الفعّال للعرض: أولاً payMethods.bankLogo (مخصص)، ثم شعار الـ bucket حسب bankId، ثم placeholder
export function getEffectiveBankLogo(profile = {}) {
  const custom = profile?.payMethods?.bankLogo
  if (custom && typeof custom === "string" && custom.trim() !== "") return custom.trim()
  const bankId = profile?.bankId || profile?.payMethods?.bankId || ""
  const url = getBankLogoUrl(bankId)
  return url || ""
}

// يُرجع اسم البنك للعرض مع fallback
export function getEffectiveBankName(profile = {}) {
  if (profile?.bankName && profile.bankName.trim() !== "") return profile.bankName.trim()
  const bankId = profile?.bankId || profile?.payMethods?.bankId
  const bank = getBankById(bankId)
  return bank ? bank.name : profile?.bankName || ""
}

// حلّ alias للتوافق: snbbank→snb, riyadbank→riyad
export function normalizeBankId(bankId) {
  if (bankId === "snbbank") return "snb"
  if (bankId === "riyadbank") return "riyad"
  return bankId
}

export function formatCurrency(n) {
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    minimumFractionDigits: 2,
    maximumFractionDigits: 6
  }).format(Number(n) || 0)
}

// الإجمالي بريال صحيح بدون كسور (مُقرّب لأقرب ريال)
export function formatTotal(n) {
  const v = Math.round(Number(n) || 0)
  return new Intl.NumberFormat("ar-SA", {
    style: "currency",
    currency: "SAR",
    maximumFractionDigits: 0
  }).format(v)
}

export function formatDate(value) {
  if (!value) return ""
  const dt = new Date(value)
  if (isNaN(dt.getTime())) return value
  // تقويم ميلادي لتجنب الهجري الافتراضي لـ ar-SA
  try {
    return dt.toLocaleDateString("ar-EG-u-ca-gregory", { year: "numeric", month: "numeric", day: "numeric" })
  } catch {
    return dt.toLocaleDateString("ar-EG")
  }
}

export function genId() {
  return (
    "INV-" +
    Date.now().toString(36).toUpperCase() +
    Math.random().toString(36).slice(2, 6).toUpperCase()
  )
}

// يولّد رقم فاتورة متسلسل حسب السنة: INV-2026-0001
export function nextInvoiceNumber(invoices = []) {
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  let max = 0
  for (const inv of invoices) {
    if (typeof inv.number === "string" && inv.number.startsWith(prefix)) {
      const n = parseInt(inv.number.slice(prefix.length), 10)
      if (!isNaN(n) && n > max) max = n
    }
  }
  return `${prefix}${String(max + 1).padStart(4, "0")}`
}

// إجمالي البند: (الكمية × سعر الوجبة) + (الكمية × مجموع أسعار المكوّنات المختارة)
export function itemExtrasTotal(it = {}) {
  return (it.extras || []).reduce(
    (s, e) => s + (Number(e.price) || 0),
    0
  )
}

export function itemTotal(it = {}) {
  const qty = Number(it.qty) || 0
  return qty * (Number(it.price) || 0) + qty * itemExtrasTotal(it)
}

export function itemExtrasNames(it = {}) {
  return (it.extras || []).map((e) => e.name)
}

export function calcSubtotal(items = []) {
  return items.reduce(
    (sum, it) => sum + (it.cancelled ? 0 : itemTotal(it)),
    0
  )
}

// مكوّنات جاهزة للفئات الغذائية (مطعم / مأكولات)
export const foodExtras = [
  { name: "كاتشب", price: 1 },
  { name: "مايونيز", price: 1 },
  { name: "ثومية", price: 1 },
  { name: "صلصة حارة", price: 1 },
  { name: "بصل", price: 1 },
  { name: "خس", price: 1 },
  { name: "طماطم", price: 1 },
  { name: "مخلل", price: 1 },
  { name: "جبن ذائب", price: 2 },
  { name: "جبنة شيدر", price: 2 },
  { name: "بيضة", price: 2 },
  { name: "بطاطس", price: 3 }
]

// مكوّنات اختيارية لأنواع أخرى (لا تحتوي على طعام)
export const serviceExtras = []

// اختيارات العميل: إضافات موجبة (بسعر) للمطاعم
export const foodCustomerOptions = [
  { name: "كاتشب", price: 1 },
  { name: "مايونيز", price: 1 },
  { name: "ثومية", price: 1 },
  { name: "صلصة حارة", price: 1 },
  { name: "جبن ذائب", price: 2 },
  { name: "جبنة شيدر", price: 2 },
  { name: "بيضة", price: 2 },
  { name: "بدون مايونيز", price: 0 },
  { name: "بدون بصل", price: 0 },
  { name: "بدون كتشب", price: 0 },
  { name: "بدون ملح", price: 0 },
  { name: "بدون سكر", price: 0 },
  { name: "بدون جبن", price: 0 },
  { name: "بدون طماطم", price: 0 }
]

// اختيارات العميل لأنواع الخدمات (لا توجد خيارات طعام)
export const serviceCustomerOptions = []

// function to get customer options based on type
export function getCustomerOptions(type) {
  if (type === "service" || type === "app" || type === "super_brand" || type === "paint_shop") {
    return serviceCustomerOptions
  }
  return foodCustomerOptions
}

// function to get extras based on type
export function getExtrasForType(type) {
  if (type === "service" || type === "app" || type === "super_brand" || type === "paint_shop") {
    return serviceExtras
  }
  return foodExtras
}

// ---------- تصنيف الأصناف (مطعم / خدمات الكمبيوتر / تطبيقات / علامات تجارية / أصباغ) ----------
export const catalogTypes = [
  { value: "restaurant", label: "مطعم", tab: "مطعم" },
  { value: "food", label: "مأكولات", tab: "مأكولات" },
  { value: "service", label: "خدمات الكمبيوتر", tab: "خدمات الكمبيوتر" },
  { value: "app", label: "تطبيق", tab: "تطبيق" },
  { value: "super_brand", label: "سوبر ماركت", tab: "سوبر ماركت" },
  { value: "paint_shop", label: "محل اصباغ", tab: "محل اصباغ" }
]

export function catalogTypeLabel(value) {
  const t = catalogTypes.find((c) => c.value === value)
  return t ? t.label : ""
}

// determining if item is food type (has extras like ketchup, mayo)
export function isFoodItem(it = {}) {
  return it?.type === "food" || it?.type === "restaurant"
}

// determining if item is service type (computer services, no food extras)
export function isServiceItem(it = {}) {
  return it?.type === "service"
}

// determining if item is app type
export function isAppItem(it = {}) {
  return it?.type === "app"
}

// determining if item is super brand type
export function isSuperBrandItem(it = {}) {
  return it?.type === "super_brand"
}

// determining if item is paint shop type
export function isPaintShopItem(it = {}) {
  return it?.type === "paint_shop"
}
// وحدات حساب خدمات العمل الحر: ساعة / يوم / شهر (بالإضافة للأجهزة والمستخدمين للتوافق)
export const serviceUnits = [
  {
    value: "hour",
    label: "ساعة",
    countLabel: "عدد الساعات",
    oneLabel: "ساعة",
    manyLabel: "ساعات"
  },
  {
    value: "day",
    label: "يوم",
    countLabel: "عدد الأيام",
    oneLabel: "يوم",
    manyLabel: "أيام"
  },
  {
    value: "month",
    label: "شهر",
    countLabel: "عدد الأشهر",
    oneLabel: "شهر",
    manyLabel: "أشهر"
  },
  {
    value: "device",
    label: "أجهزة",
    countLabel: "عدد الأجهزة",
    oneLabel: "جهاز",
    manyLabel: "أجهزة"
  },
  {
    value: "user",
    label: "مستخدمين",
    countLabel: "عدد المستخدمين",
    oneLabel: "مستخدم",
    manyLabel: "مستخدمين"
  }
]

export function serviceUnitLabel(it = {}) {
  const u = serviceUnits.find((s) => s.value === (it?.unit || "hour"))
  return u ? u.label : "ساعة"
}

export function serviceCountLabel(it = {}) {
  const u = serviceUnits.find((s) => s.value === (it?.unit || "hour"))
  return `${(u ? u.countLabel : "عدد الساعات")}: ${it.qty}`
}

// عبارة الكمية المعروضة في الفاتورة: عدد عادي للمأكولات، وساعة/يوم/شهر للخدمات
export function itemQtyLabel(it = {}) {
  if (!isServiceItem(it)) return it.qty
  const n = Number(it.qty) || 0
  const u = serviceUnits.find((s) => s.value === (it?.unit || "hour"))
    || serviceUnits[0]
  return n <= 1 ? `${n} ${u.oneLabel}` : `${n} ${u.manyLabel}`
}

// تعرّف نوع الصنف تلقائياً عند التعديل
export function inferCatalogType(desc) {
  const d = (desc || "").trim().toLowerCase()
  // مطاعم وأكلات
  const foodKeywords = ["ك chop", "مايونيز", "ثومية", "صلصة", "بصل", "خس", "طماطم", "مخلل", "جبن", "بيضة", "بطاطس", "برجر", "بيتزا", "سندوتش", "كبه", "فرخة", "لحم", "سلطة", "مشويات"]
  if (foodKeywords.some(kw => d.includes(kw))) return "food"
  // خدمات الكمبيوتر
  const serviceKeywords = ["برمجة", "تطبيقات", "مواقع", "حجز نطاق", "استضافة", "شبكة", "راوتر", "كاميرا", "سيرفر", "بيانات", "صيانة", "تعريب", "إعداد"]
  if (serviceKeywords.some(kw => d.includes(kw))) return "service"
  
  // تطبيق ذكي / برنامج
  if (/app|برنامج|برمج/.test(d)) return "app"
  
  // سوبر ماركت / محل
  if (/سوبر|محل|تجزئة|بيع/.test(d)) return "super_brand"
  
  // الافتراضي: مأكولات (مطعم)
  return "food"
}

// ---------- ضريبة القيمة المضافة ----------
// تُخزَّن بيانات الضريبة (رقم ضريبي + نسبة 15% أو 5%) داخل payMethods (jsonb)
// لأن جدولي businesses/catalog لهما أعمدة ثابتة ولا يمكن إضافة أعمدة عبر مفتاح anon.
export function getTaxNumber(profile = {}) {
  return profile?.payMethods?.taxNumber || ""
}
export function getVatRate(profile = {}) {
  return Number(profile?.payMethods?.vatRate) || 0
}
// تُطبَّق الضريبة فقط إذا وُجد رقم ضريبي وكانت النسبة أكبر من صفر
export function hasVat(profile = {}) {
  return getTaxNumber(profile).trim() !== "" && getVatRate(profile) > 0
}
export function vatAmount(subtotal, profile = {}) {
  if (!hasVat(profile)) return 0
  return (Number(subtotal) || 0) * (getVatRate(profile) / 100)
}
export function invoiceTotal(subtotal, profile = {}) {
  return (Number(subtotal) || 0) + vatAmount(subtotal, profile)
}

// يحلّل أي نص رقمي (لاتيني أو عربي، مع فواصل) إلى رقم
const AR_DIGITS = {
  "٠": "0", "١": "1", "٢": "2", "٣": "3", "٤": "4",
  "٥": "5", "٦": "6", "٧": "7", "٨": "8", "٩": "9"
}
export function parseNum(v) {
  if (typeof v === "number") return v
  if (v === "" || v == null) return 0
  const s = String(v)
    .replace(/[٫،]/g, ".") // الفاصلة العربية/اللاتينية ← نقطة
    .replace(/[٠-٩]/g, (d) => AR_DIGITS[d])
    .replace(/[^\d.]/g, "")
  const n = parseFloat(s)
  return isNaN(n) ? 0 : n
}

// يبني رابط الفاتورة المشترك (يُستخدم في الباركود/QR)
export function buildShareUrl(id, invoice, profile) {
  const base = PUBLIC_BASE_URL
  if (isSupabaseEnabled) {
    return `${base}#/i/${id}`
  }
  const payload = btoa(
    unescape(encodeURIComponent(JSON.stringify({ invoice, profile })))
  )
  return `${base}#/i/${id}?d=${encodeURIComponent(payload)}`
}

// رابط مشاركة واتساب
export function whatsappShareUrl(url) {
  return `https://wa.me/?text=${encodeURIComponent("فاتورة: " + url)}`
}

// ---------- توليد XML للفوترة الإلكترونية (ZATCA - السعودية) ----------
function escapeXml(str) {
  return String(str || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&apos;")
}
export function generateInvoiceXML(invoice = {}, profile = {}) {
  const invNo = escapeXml(invoice.number || invoice.id || "")
  const issueDate = escapeXml(invoice.date || new Date().toISOString().slice(0, 10))
  const issueTime = escapeXml(invoice.time || "00:00")
  const supplierName = escapeXml(profile.businessName || "")
  const supplierDoc = escapeXml(profile.docNumber || "")
  const supplierTax = escapeXml(profile.payMethods?.taxNumber || "")
  const supplierAddress = escapeXml(profile.address || "")
  const supplierPhone = escapeXml(profile.phone || "")
  const supplierEmail = escapeXml(profile.email || "")
  const customerName = escapeXml(invoice.clientName || "")
  const customerAddress = escapeXml(invoice.clientAddress || "")
  const customerTax = escapeXml(invoice.clientTaxNumber || "")
  const customerPhone = escapeXml(invoice.clientPhone || "")
  const customerEmail = escapeXml(invoice.clientEmail || "")
  const subtotal = Number(calcSubtotal(invoice.items || [])) || 0
  const vat = Number(vatAmount(subtotal, profile)) || 0
  const total = subtotal + vat
  const vatRate = Number(getVatRate(profile)) || 0
  const lines = (invoice.items || []).map((it, idx) => {
    const lineTotal = Number(itemTotal(it)) || 0
    return `    <cac:InvoiceLine>
      <cbc:ID>${idx + 1}</cbc:ID>
      <cbc:InvoicedQuantity unitCode="PCE">${Number(it.qty) || 0}</cbc:InvoicedQuantity>
      <cbc:LineExtensionAmount currencyID="SAR">${lineTotal.toFixed(2)}</cbc:LineExtensionAmount>
      <cac:Item><cbc:Name>${escapeXml(it.desc || "")}</cbc:Name></cac:Item>
      <cac:Price><cbc:PriceAmount currencyID="SAR">${Number(it.price || 0).toFixed(2)}</cbc:PriceAmount></cac:Price>
    </cac:InvoiceLine>`
  }).join("\n")
  return `<?xml version="1.0" encoding="UTF-8"?>
<Invoice xmlns="urn:oasis:names:specification:ubl:schema:xsd:Invoice-2" xmlns:cac="urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2" xmlns:cbc="urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2">
  <cbc:ProfileID>reporting:1.0</cbc:ProfileID>
  <cbc:ID>${invNo}</cbc:ID>
  <cbc:UUID>${escapeXml(invoice.id || invNo)}</cbc:UUID>
  <cbc:IssueDate>${issueDate}</cbc:IssueDate>
  <cbc:IssueTime>${issueTime}:00Z</cbc:IssueTime>
  <cbc:InvoiceTypeCode name="0200000">388</cbc:InvoiceTypeCode>
  <cbc:DocumentCurrencyCode>SAR</cbc:DocumentCurrencyCode>
  <cac:AccountingSupplierParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${supplierName}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName>${supplierAddress}</cbc:StreetName></cac:PostalAddress>
      <cac:PartyIdentification><cbc:ID schemeID="CRN">${supplierDoc}</cbc:ID></cac:PartyIdentification>
      ${supplierTax ? `<cac:PartyTaxScheme><cbc:CompanyID>${supplierTax}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : ""}
      <cac:Contact><cbc:Telephone>${supplierPhone}</cbc:Telephone><cbc:ElectronicMail>${supplierEmail}</cbc:ElectronicMail></cac:Contact>
    </cac:Party>
  </cac:AccountingSupplierParty>
  <cac:AccountingCustomerParty>
    <cac:Party>
      <cac:PartyName><cbc:Name>${customerName}</cbc:Name></cac:PartyName>
      <cac:PostalAddress><cbc:StreetName>${customerAddress}</cbc:StreetName></cac:PostalAddress>
      ${customerTax ? `<cac:PartyTaxScheme><cbc:CompanyID>${customerTax}</cbc:CompanyID><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>` : `<cac:PartyTaxScheme><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:PartyTaxScheme>`}
      <cac:Contact><cbc:Telephone>${customerPhone}</cbc:Telephone><cbc:ElectronicMail>${customerEmail}</cbc:ElectronicMail></cac:Contact>
    </cac:Party>
  </cac:AccountingCustomerParty>
  <cac:TaxTotal>
    <cbc:TaxAmount currencyID="SAR">${vat.toFixed(2)}</cbc:TaxAmount>
    <cac:TaxSubtotal>
      <cbc:TaxableAmount currencyID="SAR">${subtotal.toFixed(2)}</cbc:TaxableAmount>
      <cbc:TaxAmount currencyID="SAR">${vat.toFixed(2)}</cbc:TaxAmount>
      <cac:TaxCategory><cbc:ID>${vatRate > 0 ? "S" : "O"}</cbc:ID><cbc:Percent>${vatRate.toFixed(2)}</cbc:Percent><cac:TaxScheme><cbc:ID>VAT</cbc:ID></cac:TaxScheme></cac:TaxCategory>
    </cac:TaxSubtotal>
  </cac:TaxTotal>
  <cac:LegalMonetaryTotal>
    <cbc:LineExtensionAmount currencyID="SAR">${subtotal.toFixed(2)}</cbc:LineExtensionAmount>
    <cbc:TaxExclusiveAmount currencyID="SAR">${subtotal.toFixed(2)}</cbc:TaxExclusiveAmount>
    <cbc:TaxInclusiveAmount currencyID="SAR">${total.toFixed(2)}</cbc:TaxInclusiveAmount>
    <cbc:PayableAmount currencyID="SAR">${total.toFixed(2)}</cbc:PayableAmount>
  </cac:LegalMonetaryTotal>
${lines}
</Invoice>`
}
export function downloadInvoiceXML(invoice, profile) {
  const xml = generateInvoiceXML(invoice, profile)
  const blob = new Blob([xml], { type: "application/xml;charset=utf-8" })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = `${invoice.number || invoice.id || "invoice"}.xml`
  a.click()
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
