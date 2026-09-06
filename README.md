# نظام الفوترة الشامل متعدد المنصات

تطبيق فوترة ومحاسبة يعمل على الويب وداخل تطبيقات أصلية:
- **macOS** (Swift + WKWebView)
- **iPhone/iOS** (Swift + WKWebView)
- **Windows** (C# .NET + WebView2)

كل الواجهات تحمّل **نفس رابط تطبيق الويب**.

---

## المميزات
- إنشاء وتعديل وحذف الفواتير مع بنود متعددة.
- شاشة **الحسابات**: إجمالي الفواتير، المحصلة، المستحقات، وعددها.
- تحديد الفاتورة **مدفوعة / مستحقة**.
- **شعار العمل الحر** (رفع صورة أو اسم النشاط).
- بيانات الدفع عبر **بنك الراجحي أعمال** (رقم الحساب + الآيبان).
- **تنويه ضريبي**: الفاتورة غير خاضعة لضريبة القيمة المضافة (قابل للتعديل).
- **باركود (CODE128)** للفاتورة + **رمز QR** يوصّل مباشرةً إلى وثيقة الفاتورة.
- **تخزين سحابي مجاني** (Firebase) اختياري، مع بديل محلي يعمل فوراً.

---

## 1) تشغيل تطبيق الويب (React/Vite)

```bash
cd web
npm install
npm run dev
```

الخادم: `http://localhost:5173`
للإنتاج: `npm run build` ثم ارفع مجلد `dist`.

---

## 2) التخزين السحابي (Supabase — مجاني)

التطبيق مُعدّ مسبقاً للعمل مع Supabase (المفاتيح العامة في `web/src/lib/supabaseConfig.js`).
البيانات تُخزّن في جدولين: `invoices` و `profile`. للسماح للعملاء بفتح الفاتورة عبر الباركود:

1. في لوحة Supabase: **SQL Editor** نفّذ:

```sql
create table if not exists businesses (
  id text primary key,
  username text unique,
  password_hash text,
  isAdmin boolean default false,
  businessName text,
  logoDataUrl text,
  "freelanceLogo" text,
  "companyLogo" text,
  docType text,
  docNumber text,
  bankName text,
  iban text,
  accountNumber text,
  accountName text,
  phone text,
  email text,
  note text,
  payMethods jsonb
);

create table if not exists invoices (
  id text primary key,
  business_id text,
  number text,
  date text,
  time text,
  dueDate text,
  clientName text,
  clientPhone text,
  clientEmail text,
  items jsonb,
  status text,
  amended boolean default false,
  revisedAt text,
  note text,
  "paymentProof" text,
  "paymentProofName" text,
  "paymentProofStatus" text,
  createdAt text
);

create table if not exists catalog (
  id text primary key,
  business_id text,
  desc text,
  price numeric,
  qty numeric,
  createdAt text
);

alter table businesses enable row level security;
alter table invoices enable row level security;
alter table catalog enable row level security;

create policy "public businesses" on businesses for all using (true) with check (true);
create policy "public invoices" on invoices for all using (true) with check (true);
create policy "public catalog" on catalog for all using (true) with check (true);
```

> **تحديث المخطط بعد إضافة شعارين:** نفّذ في SQL Editor في Supabase لإضافة العمودين الجديدين (تجاهل الخطأ إذا كانا موجودين):
>
> ```sql
> alter table "public"."businesses"
>   add column if not exists "freelanceLogo" text,
>   add column if not exists "companyLogo" text,
>   add column if not exists "accountName" text;
> select pg_notify('pgrst', 'reload schema');
> ```

> تنبيه أمني مهم: السياسات أعلاه مفتوحة لأغراض الشرح/الاستخدام الشخصي، وكلمات المرور
> مُجزّأة (SHA-256) لكنها قابلة للقراءة من الجميع. للإنتاج استخدم **Supabase Auth**
> وقيّد السياسات، ولا تضع مفتاح السر (secret) في تطبيق الويب إطلاقاً.

> **ضبط رابط الموقع العام (لإزالة رابط localhost من الروابط/الباركود):** أنشئ ملف `web/.env`
> (انسخ `web/.env.example`) واضبط `VITE_PUBLIC_BASE_URL` على رابط موقعك المنشور، ثم أعد البناء:
>
> ```bash
> cd web && npm run build
> ```
>
> إن تُرك فارغاً يُستخدم رابط الصفحة الحالية تلقائياً (يصبح الرابط الحقيقي عند النشر).

عند التفعيل، رابط الفاتورة: `https://<رابط-التطبيق>/#/i/<رقم>` ويصلح للعميل عبر QR/الباركود.
بدون سحابة، يُدمج محتوى الفاتورة داخل الرابط نفسه (`?d=...`) فيعمل المشاركة بدون خادم.

---

## 3) تطبيقات macOS / iOS (Swift)

أنشئ مشروع Xcode (macOS/iOS App بواجهة SwiftUI) والصق ملفات `macos/` أو `ios/`.
عدّل رابط `webAppURL` في `Config.swift` ليطابق رابط التطبيق المنشور على السيرفر الخارجي (مثلاً `https://fawateeri.example.com`). يجب أن يكون HTTPS.

---

## 4) تطبيق Windows (C# .NET + WebView2)

```bash
cd windows
dotnet restore
dotnet run
```

عدّل `WebAppUrl` في `MainForm.cs` ليطابق رابط التطبيق المنشور.

---

## نشر التطبيق وربط التطبيقات الأصلية بسيرفر خارجي

الموقع منشور مجاناً على GitHub Pages:
**https://alassli7.github.io/invoices-web/**

لإعادة النشر بعد أي تعديل:
```bash
bash deploy.sh
```
(يبني التطبيق ويرفعه تلقائياً إلى فرع gh-pages — يتطلب تسجيل دخول `gh`).

يُولَّد باركود وروابط الفواتير تلقائياً برابط الموقع عبر `web/.env`
(مضبوط حالياً على `VITE_PUBLIC_BASE_URL=https://alassli7.github.io/invoices-web/`).

التطبيقات الأصلية مربوطة بهذا الرابط في:
`macos/Config.swift`، `ios/Config.swift`، `windows/MainForm.cs`.

للنشر على استضافة أخرى (Netlify/Vercel/Cloudflare Pages) ارفع `web/dist/`،
وعدّل `VITE_PUBLIC_BASE_URL` والروابط في التطبيقات الأصلية.

---

## مزامنة الرابط
عند النشر غيّر الرابط في: `web/.env` (VITE_PUBLIC_BASE_URL)، و`macos/Config.swift`، `ios/Config.swift`، `windows/MainForm.cs`.
