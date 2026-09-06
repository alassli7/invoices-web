import { createClient } from "@supabase/supabase-js"
import {
  SUPABASE_URL,
  SUPABASE_PUBLISHABLE_KEY,
  isSupabaseEnabled
} from "./supabaseConfig.js"
import { defaultProfile, defaultCatalogItems, defaultCatalogByCategory } from "./format.js"
import { sha256 } from "js-sha256"

// ---------- عميل Supabase ----------
const supabase = isSupabaseEnabled
  ? createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY)
  : null

const LS = "invoiceapp:"
const BIZ_KEY = `${LS}businesses`
const SESSION_KEY = `${LS}session`
const invKey = (bid, id) => `${LS}inv:${bid}:${id}`

// ---------- تجزئة كلمة المرور (SHA-256) ----------
// ملاحظة: للاستخدام الشخصي. للإنتاج استخدم Supabase Auth أو خادم مع تمليح.
async function hashPassword(pw) {
  const input = String(pw || "")
  // 1) حاول استخدام Web Crypto (يتطلب HTTPS)
  try {
    const subtle = (globalThis.crypto && globalThis.crypto.subtle) || (typeof crypto !== 'undefined' && crypto.subtle)
    if (subtle && subtle.digest) {
      const enc = typeof TextEncoder !== 'undefined' ? new TextEncoder() : null
      const data = enc ? enc.encode(input) : Uint8Array.from(unescape(encodeURIComponent(input)), c => c.charCodeAt(0))
      const buf = await subtle.digest("SHA-256", data)
      return [...new Uint8Array(buf)].map(b => b.toString(16).padStart(2, "0")).join("")
    }
  } catch {}
  // 2) fallback نقي JS عبر js-sha256 (يعطي نفس نتيجة SHA-256)
  try {
    return sha256(input)
  } catch {}
  // 3) fallback أخير غير آمن لكن يمنع انهيار التطبيق
  let h = 0
  for (let i = 0; i < input.length; i++) { h = ((h << 5) - h + input.charCodeAt(i)) | 0 }
  return "fb-" + Math.abs(h).toString(16).padStart(8, "0")
}

function newId() {
  try {
    const c = globalThis.crypto || (typeof crypto !== 'undefined' ? crypto : null)
    if (isSupabaseEnabled && c && c.randomUUID) return c.randomUUID()
  } catch {}
  return "BIZ-" + Date.now().toString(36).toUpperCase() + Math.random().toString(36).slice(2, 6).toUpperCase()
}

// ---------- الجلسة ----------
export function getCurrentBusinessId() {
  return localStorage.getItem(SESSION_KEY) || null
}
export function setSession(id) {
  localStorage.setItem(SESSION_KEY, id)
}
export function logoutBusiness() {
  localStorage.removeItem(SESSION_KEY)
}

// يُرجع الـ business_id الفعلي (المالك) سواء كان المستخدم مالكاً أو موظفاً
export async function getEffectiveBizId() {
  const bid = getCurrentBusinessId()
  if (!bid) return null
  const biz = await getBusinessById(bid)
  if (!biz) return bid
  if (biz.role === "staff" && biz.owner_id) return biz.owner_id
  return bid
}

// ---------- الأنشطة (businesses) ----------
export async function registerBusiness({
  username,
  password,
  businessName,
  docType,
  docNumber,
  isAdmin
}) {
  const id = newId()
  const row = {
    id,
    username,
    password_hash: await hashPassword(password),
    ...defaultProfile,
    businessName: businessName || defaultProfile.businessName,
    docType: docType || "freelance",
    docNumber: (docNumber || "").trim(),
    isAdmin: Boolean(isAdmin),
    role: "owner",
    status: isAdmin ? "active" : "pending" // المشرفون يُفعَّلون تلقائياً، الباقي يحتاجون موافقة
  }
  if (supabase) {
    const { error } = await supabase.from("businesses").insert(row)
    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505")
        throw new Error("اسم المستخدم موجود مسبقاً")
      throw error
    }
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    if (list.some((b) => b.username === username))
      throw new Error("اسم المستخدم موجود مسبقاً")
    list.push(row)
    localStorage.setItem(BIZ_KEY, JSON.stringify(list))
  }
  if (!isAdmin) {
    // لا نُسجّل جلسة للحسابات المعلقة
    return { id, status: "pending" }
  }
  setSession(id)
  try {
    await seedDefaultCatalog(id)
  } catch {
    /* الأصناف الجاهزة اختيارية */
  }
  return { id, status: "active" }
}

export async function loginBusiness(username, password) {
  const hash = await hashPassword(password)
  let biz = null
  if (supabase) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("username", username)
      .maybeSingle()
    biz = data
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    biz = list.find((b) => b.username === username)
  }
  if (!biz || biz.password_hash !== hash) return null
  setSession(biz.id)
  return biz.id
}

// ---------- المستخدمون الفرعيون (staff) ----------
const MAX_STAFF = 5

export async function addStaff({ username, password }) {
  const ownerId = getCurrentBusinessId()
  if (!ownerId) throw new Error("لا توجد جلسة")
  const staff = await listStaff()
  if (staff.length >= MAX_STAFF) {
    throw new Error(`تم الوصول للحد الأقصى للموظفين (${MAX_STAFF})`)
  }
  const id = newId()
  const row = {
    id,
    username,
    password_hash: await hashPassword(password),
    ...defaultProfile,
    businessName: "",
    role: "staff",
    owner_id: ownerId,
    isAdmin: false
  }
  if (supabase) {
    const { error } = await supabase.from("businesses").insert(row)
    if (error) {
      if (error.message?.includes("duplicate") || error.code === "23505")
        throw new Error("اسم المستخدم موجود مسبقاً")
      throw error
    }
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    if (list.some((b) => b.username === username))
      throw new Error("اسم المستخدم موجود مسبقاً")
    list.push(row)
    localStorage.setItem(BIZ_KEY, JSON.stringify(list))
  }
  return id
}

export async function listStaff() {
  const ownerId = getCurrentBusinessId()
  if (!ownerId) return []
  if (supabase) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id,username,role,owner_id")
      .eq("owner_id", ownerId)
      .eq("role", "staff")
    if (error) throw error
    return data || []
  }
  const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
  return list.filter((b) => b.owner_id === ownerId && b.role === "staff")
}

export async function removeStaff(staffId) {
  if (supabase) {
    const { error } = await supabase
      .from("businesses")
      .delete()
      .eq("id", staffId)
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    localStorage.setItem(BIZ_KEY, JSON.stringify(list.filter((b) => b.id !== staffId)))
  }
}

// ---------- موافقة المشرف على الحسابات ----------
export async function listPendingBusinesses() {
  if (supabase) {
    const { data, error } = await supabase
      .from("businesses")
      .select("id,username,businessName,docType,docNumber,status,createdAt")
      .eq("status", "pending")
      .eq("role", "owner")
      .order("createdAt", { ascending: false })
    if (error) throw error
    return data || []
  }
  const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
  return list.filter((b) => b.status === "pending" && b.role === "owner")
}

export async function approveBusinessAccount(businessId) {
  if (supabase) {
    const { error } = await supabase
      .from("businesses")
      .update({ status: "active" })
      .eq("id", businessId)
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    const next = list.map((b) => (b.id === businessId ? { ...b, status: "active" } : b))
    localStorage.setItem(BIZ_KEY, JSON.stringify(next))
  }
}

export async function rejectBusinessAccount(businessId) {
  if (supabase) {
    const { error } = await supabase
      .from("businesses")
      .update({ status: "rejected" })
      .eq("id", businessId)
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    const next = list.map((b) => (b.id === businessId ? { ...b, status: "rejected" } : b))
    localStorage.setItem(BIZ_KEY, JSON.stringify(next))
  }
}

export async function getBusinessById(id) {
  if (!id) return null
  if (supabase) {
    const { data } = await supabase
      .from("businesses")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    return data
  }
  const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
  return list.find((b) => b.id === id) || null
}

export async function changePassword(newPw) {
  const bid = getCurrentBusinessId()
  if (!bid) throw new Error("لا توجد جلسة")
  const hash = await hashPassword(newPw)
  if (supabase) {
    const { error } = await supabase
      .from("businesses")
      .update({ password_hash: hash })
      .eq("id", bid)
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    const next = list.map((b) => (b.id === bid ? { ...b, password_hash: hash } : b))
    localStorage.setItem(BIZ_KEY, JSON.stringify(next))
  }
}

// ---------- الملف الشخصي للنشاط الحالي ----------
export async function getProfile() {
  const bid = getCurrentBusinessId()
  if (!bid) return defaultProfile
  const biz = await getBusinessById(bid)
  if (!biz) return defaultProfile
  // إذا كان المستخدم موظفاً → جلب بيانات المالك
  if (biz.role === "staff" && biz.owner_id) {
    const owner = await getBusinessById(biz.owner_id)
    if (owner) {
      const { password_hash, ...profile } = owner
      const merged = { ...defaultProfile, ...profile, role: "staff", staffId: bid }
      // مزامنة bankId و address بين العمود العلوي و payMethods
      const effectiveBankId = merged.bankId || merged.payMethods?.bankId || defaultProfile.bankId
      merged.bankId = effectiveBankId
      const effectiveAddress = merged.address || merged.payMethods?.address || defaultProfile.address || ""
      merged.address = effectiveAddress
      merged.payMethods = { ...defaultProfile.payMethods, ...(merged.payMethods || {}), bankId: effectiveBankId, address: effectiveAddress }
      return merged
    }
  }
  const { password_hash, ...profile } = biz
  const merged = { ...defaultProfile, ...profile }
  const effectiveBankId = merged.bankId || merged.payMethods?.bankId || defaultProfile.bankId
  merged.bankId = effectiveBankId
  const effectiveAddress = merged.address || merged.payMethods?.address || defaultProfile.address || ""
  merged.address = effectiveAddress
  merged.payMethods = { ...defaultProfile.payMethods, ...(merged.payMethods || {}), bankId: effectiveBankId, address: effectiveAddress }
  return merged
}

export async function saveProfile(profile) {
  const bid = getCurrentBusinessId()
  if (!bid) throw new Error("لا توجد جلسة — سجّل الدخول أولاً")
  // جلب البيانات الحالية للحفاظ على password_hash و username
  const existing = await getBusinessById(bid)
  if (!existing) throw new Error("لم يُعثر على بيانات النشاط")
  // مزامنة bankId للتوافق مع الجداول التي لا تملك عمود bankId
  const effectiveBankId = profile.bankId || profile.payMethods?.bankId || existing.bankId || existing.payMethods?.bankId || defaultProfile.bankId
  const normalizedProfile = {
    ...profile,
    bankId: effectiveBankId,
    payMethods: { ...(profile.payMethods || {}), bankId: effectiveBankId }
  }
  const data = {
    ...defaultProfile,
    ...existing,
    ...normalizedProfile,
    payMethods: { ...defaultProfile.payMethods, ...(existing.payMethods || {}), ...(normalizedProfile.payMethods || {}) },
    id: bid,
    username: existing.username,
    password_hash: existing.password_hash
  }
  // تأكد أن payMethods يحتوي bankId احتياطياً
  data.payMethods.bankId = effectiveBankId
  // احتياطي للعنوان إذا كان العمود غير موجود
  if (data.address !== undefined) data.payMethods.address = data.address
  if (supabase) {
    let { error } = await supabase.from("businesses").upsert(data)
    if (error && error.code === "PGRST204" && String(error.message).includes("bankId")) {
      // الجدول لا يملك عمود bankId → أعد المحاولة بدونه (يُحفظ داخل payMethods)
      const { bankId, ...dataWithoutBankId } = data
      dataWithoutBankId.payMethods = { ...data.payMethods, bankId: effectiveBankId }
      const { error: retryError } = await supabase.from("businesses").upsert(dataWithoutBankId)
      if (retryError) throw retryError
      error = null
    }
    if (error && error.code === "PGRST204" && String(error.message).includes("address")) {
      const { address, ...dataWithoutAddr } = data
      dataWithoutAddr.payMethods = { ...dataWithoutAddr.payMethods, address: data.address }
      const { error: retryError2 } = await supabase.from("businesses").upsert(dataWithoutAddr)
      if (retryError2) throw retryError2
      error = null
    }
    if (error) throw error
  } else {
    const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
    const next = list.map((b) => (b.id === bid ? { ...b, ...data } : b))
    localStorage.setItem(BIZ_KEY, JSON.stringify(next))
  }
}

// ---------- الفواتير (مُرتبطة بالنشاط) ----------
export async function saveInvoice(invoice) {
  const bid = await getEffectiveBizId()
  const inv = { ...invoice, business_id: bid }
  if (supabase) {
    let { error } = await supabase.from("invoices").upsert(inv)
    if (error && error.code === "PGRST204") {
      const msg = String(error.message || "")
      // أعمدة العميل الجديدة قد لا تكون موجودة في الجدول القديم → أعد المحاولة بدونها
      if (msg.includes("clientAddress") || msg.includes("clientTaxNumber")) {
        const { clientAddress, clientTaxNumber, ...invWithoutNew } = inv
        // احفظها احتياطياً داخل note إذا لزم (لمنع فقدان البيانات)
        let fallbackNote = invWithoutNew.note || ""
        if (clientAddress || clientTaxNumber) {
          const extra = ` | عنوان العميل: ${clientAddress || "-"} | الرقم الضريبي للعميل: ${clientTaxNumber || "-"}`
          if (!fallbackNote.includes("عنوان العميل")) fallbackNote += extra
          invWithoutNew.note = fallbackNote
        }
        const { error: retryError } = await supabase.from("invoices").upsert(invWithoutNew)
        if (retryError) throw retryError
        error = null
      }
    }
    if (error) throw error
  } else {
    localStorage.setItem(invKey(bid, invoice.id), JSON.stringify(inv))
  }
  return invoice.id
}

export async function getInvoice(id) {
  const bid = await getEffectiveBizId()
  if (supabase) {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    return data || null
  }
  const raw = localStorage.getItem(invKey(bid, id))
  return raw ? JSON.parse(raw) : null
}

// قراءة عامة للفاتورة (للعميل عبر الرابط) بغض النظر عن الجلسة
async function getInvoicePublic(id) {
  if (supabase) {
    const { data } = await supabase
      .from("invoices")
      .select("*")
      .eq("id", id)
      .maybeSingle()
    return data || null
  }
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(`${LS}inv:`)) {
      const obj = JSON.parse(localStorage.getItem(k))
      if (obj.id === id) return obj
    }
  }
  return null
}

export async function listInvoices() {
  const bid = await getEffectiveBizId()
  if (supabase) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .eq("business_id", bid)
      .order("createdAt", { ascending: false })
    if (error) throw error
    return data || []
  }
  const list = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(`${LS}inv:${bid}:`)) {
      list.push(JSON.parse(localStorage.getItem(k)))
    }
  }
  return list.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )
}

export async function deleteInvoice(id) {
  const bid = await getEffectiveBizId()
  if (supabase) {
    const { error } = await supabase.from("invoices").delete().eq("id", id)
    if (error) throw error
  } else {
    localStorage.removeItem(invKey(bid, id))
  }
}

// ---------- الأصناف المحفوظة (catalog) ----------
export async function listCatalog() {
  const bid = await getEffectiveBizId()
  if (supabase) {
    const { data, error } = await supabase
      .from("catalog")
      .select("*")
      .eq("business_id", bid)
      .order("createdAt", { ascending: false })
    if (error) throw error
    return data || []
  }
  const raw = localStorage.getItem(`${LS}catalog:${bid}`)
  return raw ? JSON.parse(raw) : []
}

export async function saveCatalogItem(item) {
  const bid = await getEffectiveBizId()
  const row = {
    ...item,
    id: item.id || newId(),
    business_id: bid,
    createdAt: item.createdAt || new Date().toISOString()
  }
  if (supabase) {
    const { error } = await supabase.from("catalog").upsert(row)
    if (error) throw error
  } else {
    const key = `${LS}catalog:${bid}`
    const list = JSON.parse(localStorage.getItem(key) || "[]")
    const next = list.some((i) => i.id === row.id)
      ? list.map((i) => (i.id === row.id ? row : i))
      : [...list, row]
    localStorage.setItem(key, JSON.stringify(next))
  }
  return row.id
}

export async function deleteCatalogItem(id) {
  const bid = await getEffectiveBizId()
  if (supabase) {
    const { error } = await supabase.from("catalog").delete().eq("id", id)
    if (error) throw error
  } else {
    const key = `${LS}catalog:${bid}`
    const list = JSON.parse(localStorage.getItem(key) || "[]")
    localStorage.setItem(key, JSON.stringify(list.filter((i) => i.id !== id)))
  }
}

// تحديث نوع جميع أصناف النشاط الحالي دفعةً واحدة
export async function updateCatalogType(newType) {
  const bid = getCurrentBusinessId()
  if (!bid) return
  if (supabase) {
    const { error } = await supabase
      .from("catalog")
      .update({ type: newType })
      .eq("business_id", bid)
    if (error) throw error
  } else {
    const key = `${LS}catalog:${bid}`
    const list = JSON.parse(localStorage.getItem(key) || "[]")
    localStorage.setItem(key, JSON.stringify(list.map((i) => ({ ...i, type: newType }))))
  }
}

// إضافة أصناف افتراضية حسب الفئة الجديدة (بدون حذف الأصناف الموجودة)
export async function seedCatalogForCategory(category) {
  const bid = getCurrentBusinessId()
  if (!bid) return
  const items = defaultCatalogByCategory[category] || []
  if (items.length === 0) return

  // جلب الأصناف الموجودة لتجنب التكرار
  let existing = []
  if (supabase) {
    const { data } = await supabase
      .from("catalog")
      .select("desc")
      .eq("business_id", bid)
    existing = data || []
  } else {
    existing = JSON.parse(localStorage.getItem(`${LS}catalog:${bid}`) || "[]")
  }
  const have = new Set(existing.map((i) => (i.desc || "").trim()))

  // أضف فقط الأصناف غير الموجودة
  const rows = items
    .filter((it) => !have.has(it.desc.trim()))
    .map((it, i) => ({
      ...it,
      id: newId(),
      business_id: bid,
      createdAt: new Date(Date.now() + i).toISOString()
    }))

  if (rows.length === 0) return

  if (supabase) {
    const { error } = await supabase.from("catalog").insert(rows)
    if (error) throw error
  } else {
    const key = `${LS}catalog:${bid}`
    const list = JSON.parse(localStorage.getItem(key) || "[]")
    localStorage.setItem(key, JSON.stringify([...list, ...rows]))
  }
}

// إضافة الأصناف الجاهزة (البرمجيات والشبكات) للحساب الحالي
export async function seedDefaultCatalog(bid) {
  const target = bid || getCurrentBusinessId()
  if (!target) return 0
  let existing = []
  if (supabase) {
    const { data } = await supabase
      .from("catalog")
      .select("desc")
      .eq("business_id", target)
    existing = data || []
  } else {
    existing = JSON.parse(localStorage.getItem(`${LS}catalog:${target}`) || "[]")
  }
  const have = new Set(existing.map((i) => (i.desc || "").trim()))
  const rows = defaultCatalogItems
    .filter((it) => !have.has(it.desc.trim()))
    .map((it) => ({
      ...it,
      id: newId(),
      business_id: target,
      createdAt: new Date().toISOString()
    }))
  if (rows.length === 0) return 0
  if (supabase) {
    const { error } = await supabase.from("catalog").insert(rows)
    if (error) throw error
  } else {
    const key = `${LS}catalog:${target}`
    const list = JSON.parse(localStorage.getItem(key) || "[]")
    localStorage.setItem(key, JSON.stringify([...list, ...rows]))
  }
  return rows.length
}

// ---------- مراقبة المسؤول (admin) ----------
export async function listAllBusinesses() {
  if (supabase) {
    const { data, error } = await supabase.from("businesses").select("*")
    if (error) throw error
    return (data || []).filter((b) => !b.isAdmin)
  }
  const list = JSON.parse(localStorage.getItem(BIZ_KEY) || "[]")
  return list.filter((b) => !b.isAdmin)
}

export async function listAllInvoices() {
  if (supabase) {
    const { data, error } = await supabase
      .from("invoices")
      .select("*")
      .order("createdAt", { ascending: false })
    if (error) throw error
    return data || []
  }
  const list = []
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(`${LS}inv:`)) {
      list.push(JSON.parse(localStorage.getItem(k)))
    }
  }
  return list.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )
}

// ---------- عرض الفاتورة العامة (للعميل) ----------
export async function getInvoiceView(id, embedded) {
  if (embedded) {
    return {
      invoice: embedded.invoice || null,
      profile: { ...defaultProfile, ...(embedded.profile || {}) }
    }
  }
  const invoice = await getInvoicePublic(id)
  if (!invoice) return { invoice: null, profile: defaultProfile }
  const biz = await getBusinessById(invoice.business_id)
  const { password_hash, ...profile } = biz || {}
  return { invoice, profile: { ...defaultProfile, ...profile } }
}

// ---------- طلب الأصناف من العميل (عام، بدون تسجيل دخول) ----------
// قراءة أصناف نشاط معيّن للطلب من طرف العميل
export async function listCatalogByBusiness(bid) {
  if (supabase) {
    const { data, error } = await supabase
      .from("catalog")
      .select("*")
      .eq("business_id", bid)
      .order("createdAt", { ascending: false })
    if (error) throw error
    return data || []
  }
  const raw = localStorage.getItem(`${LS}catalog:${bid}`)
  return raw ? JSON.parse(raw) : []
}

// أرقام فواتير نشاط معيّن (لتوليد رقم التسلسل)
export async function listPublicInvoices(bid) {
  if (supabase) {
    const { data, error } = await supabase
      .from("invoices")
      .select("number, createdAt")
      .eq("business_id", bid)
    if (error) throw error
    return data || []
  }
  const list = []
  const prefix = `${LS}inv:${bid}:`
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i)
    if (k && k.startsWith(prefix)) {
      const obj = JSON.parse(localStorage.getItem(k))
      if (obj && obj.number) list.push(obj)
    }
  }
  return list.sort(
    (a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0)
  )
}

// توليد رقم فاتورة متسلسل عبر RPC الموحّد generate_invoice_number
// RPC يأخذ p_business_id ويُرجع رقماً جاهزاً مثل "293-20260902-000001" أو "INV-2026-0001" حسب تعريفه في Supabase
export async function getNextInvoiceNumber() {
  const bid = await getEffectiveBizId()
  if (!bid) throw new Error("لا توجد جلسة")

  // المحاولة الأساسية: استدعاء الـ RPC المطلوب
  if (supabase) {
    try {
      const { data, error } = await supabase.rpc("generate_invoice_number", {
        p_business_id: bid
      })
      if (error) throw error
      if (data != null && String(data).trim() !== "") {
        return String(data).trim()
      }
      throw new Error("RPC returned empty data")
    } catch (e) {
      console.warn("[getNextInvoiceNumber] generate_invoice_number failed, fallback to local:", e?.message || e)
      // fallback إلى حساب محلي في حال فشل الـ RPC (مثلاً الدالة غير منشورة أو خطأ صلاحيات)
      try {
        const { data: invoices } = await supabase
          .from("invoices")
          .select("number")
          .eq("business_id", bid)
        const year = new Date().getFullYear()
        const prefix = `INV-${year}-`
        let max = 0
        for (const inv of invoices || []) {
          if (typeof inv.number === "string" && inv.number.startsWith(prefix)) {
            const n = parseInt(inv.number.slice(prefix.length), 10)
            if (!isNaN(n) && n > max) max = n
          }
        }
        // أيضاً جرّب قراءة invoice_sequences كـ fallback ثانوي
        if (max === 0) {
          const { data: seq } = await supabase
            .from("invoice_sequences")
            .select("last_number")
            .eq("business_id", bid)
            .maybeSingle()
          if (seq?.last_number) max = Number(seq.last_number) || 0
        }
        return `${prefix}${String(max + 1).padStart(4, "0")}`
      } catch (fallbackErr) {
        console.warn("[getNextInvoiceNumber] fallback query failed:", fallbackErr?.message)
      }
    }
  }

  // fallback نهائي: localStorage (عند عدم وجود Supabase أو فشل كل المحاولات)
  const today = new Date().toISOString().slice(0, 10)
  const year = new Date().getFullYear()
  const prefix = `INV-${year}-`
  const key = `${LS}seq:${bid}:${today}`
  const current = parseInt(localStorage.getItem(key) || "0", 10)
  const next = current + 1
  localStorage.setItem(key, String(next))
  return `${prefix}${String(next).padStart(4, "0")}`
}

// حفظ فاتورة طلب العميل تحت نشاط معيّن (بدون جلسة)
export async function savePublicInvoice(bid, invoice) {
  const inv = { ...invoice, business_id: bid }
  if (supabase) {
    const { error } = await supabase.from("invoices").upsert(inv)
    if (error) throw error
  } else {
    localStorage.setItem(invKey(bid, invoice.id), JSON.stringify(inv))
  }
  return invoice.id
}
