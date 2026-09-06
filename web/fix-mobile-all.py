from pathlib import Path
import re

APP = Path("App.jsx")
CSS = Path("index.css")

# =========================================================
# التحقق
# =========================================================

if not APP.exists():
    print("❌ App.jsx غير موجود")
    raise SystemExit(1)

if not CSS.exists():
    print("❌ index.css غير موجود")
    raise SystemExit(1)

# =========================================================
# نسخ احتياطية
# =========================================================

app_backup = Path("App.jsx.before-mobile-fix")
css_backup = Path("index.css.before-mobile-fix-final")

app_backup.write_text(APP.read_text(encoding="utf-8"), encoding="utf-8")
css_backup.write_text(CSS.read_text(encoding="utf-8"), encoding="utf-8")

print("📦 تم إنشاء النسخ الاحتياطية")

# =========================================================
# قراءة الملفات
# =========================================================

app_text = APP.read_text(encoding="utf-8")
css_text = CSS.read_text(encoding="utf-8")

# =========================================================
# 1) إصلاح CSS الخاص بـ .fa-shell
# =========================================================

shell_pattern = re.compile(
    r'\.fa-shell\s*\{.*?\}',
    re.S
)

shell_match = shell_pattern.search(app_text)

if shell_match:
    old_shell = shell_match.group(0)

    # لا نغير RTL إلى LTR.
    # في RTL أول عمود في Grid يكون جهة اليمين.
    new_shell = '''.fa-shell {
  min-height: 100vh;
  width: 100%;
  max-width: 100%;
  min-width: 0;

  display: grid;
  grid-template-columns: 290px minmax(0, 1fr);

  overflow-x: hidden;
  box-sizing: border-box;
}'''

    app_text = app_text[:shell_match.start()] + new_shell + app_text[shell_match.end():]

    print("✅ تم تحسين .fa-shell")
else:
    print("⚠️ لم يتم العثور على .fa-shell")

# =========================================================
# 2) إصلاح القائمة الجانبية
# =========================================================

sidebar_pattern = re.compile(
    r'@media\s*\(max-width:\s*960px\)\s*\{\s*'
    r'\.fa-sidebar\s*\{.*?'
    r'\}\s*'
    r'\.fa-sidebar\.open\s*\{.*?\}\s*'
    r'\}',
    re.S
)

sidebar_replacement = '''@media (max-width: 960px) {
  .fa-sidebar {
    position: fixed;

    top: 0;
    right: 0;
    bottom: 0;
    left: auto;

    width: min(290px, 86vw);
    max-width: 86vw;

    height: 100dvh;
    min-height: 100vh;

    transform: translateX(100%);
    transition: transform .22s ease;

    z-index: 1000;

    overflow-x: hidden;
    overflow-y: auto;

    box-sizing: border-box;

    -webkit-overflow-scrolling: touch;

    box-shadow: -12px 0 32px rgba(0, 0, 0, .16);
  }

  .fa-sidebar.open {
    transform: translateX(0);
  }
}'''

if sidebar_pattern.search(app_text):
    app_text = sidebar_pattern.sub(sidebar_replacement, app_text, count=1)
    print("✅ تم إصلاح القائمة الجانبية للجوال")
else:
    print("⚠️ لم يتم العثور على Media Query للقائمة")

# =========================================================
# 3) تحسين .fa-main
# =========================================================

main_pattern = re.compile(
    r'\.fa-main\s*\{.*?\}',
    re.S
)

main_match = main_pattern.search(app_text)

if main_match:
    new_main = '''.fa-main {
  min-width: 0;
  width: 100%;
  max-width: 100%;
  padding: 28px;
  box-sizing: border-box;
  overflow-x: hidden;
}'''

    app_text = (
        app_text[:main_match.start()]
        + new_main
        + app_text[main_match.end():]
    )

    print("✅ تم تحسين .fa-main")
else:
    print("⚠️ لم يتم العثور على .fa-main")

# =========================================================
# 4) إضافة Mobile CSS إلى App.jsx
# =========================================================

app_marker = "/* MOBILE RESPONSIVE FINAL FIX */"

if app_marker not in app_text:

    app_mobile_css = r'''

/* MOBILE RESPONSIVE FINAL FIX */

@media (max-width: 960px) {

  .fa-shell {
    display: block;
    width: 100%;
    max-width: 100%;
    min-width: 0;
    min-height: 100vh;
    overflow-x: hidden;
  }

  .fa-main {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    padding: 16px;
    margin: 0;
    overflow-x: hidden;
    box-sizing: border-box;
  }

  .fa-content-card {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    margin: 0;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  .fa-sidebar {
    direction: rtl;
  }

  .fa-overlay {
    z-index: 900;
  }

  /* منع العناصر الكبيرة من كسر الشاشة */

  img,
  video,
  canvas,
  svg,
  iframe {
    max-width: 100%;
  }

  input,
  textarea,
  select,
  button {
    max-width: 100%;
    box-sizing: border-box;
  }

  /* الجداول */

  table {
    max-width: 100%;
  }

  .table-container,
  .table-wrapper,
  .table-scroll,
  .overflow-table {
    width: 100%;
    max-width: 100%;
    overflow-x: auto;
    -webkit-overflow-scrolling: touch;
  }

  /* النماذج */

  form {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  /* البطاقات */

  .card,
  .panel,
  .section,
  .form-card,
  .invoice-card {
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
  }

  /* أزرار */

  button,
  .btn,
  .button {
    touch-action: manipulation;
  }

  /* النصوص الطويلة */

  h1,
  h2,
  h3,
  h4,
  p,
  span,
  label,
  td,
  th {
    overflow-wrap: anywhere;
  }
}

/* =======================================================
   iPhone / Small phones
   ======================================================= */

@media (max-width: 600px) {

  .fa-main {
    padding: 12px;
  }

  .fa-content-card {
    border-radius: 14px;
  }

  .fa-sidebar {
    width: min(290px, 88vw);
    max-width: 88vw;
  }

  h1 {
    font-size: clamp(22px, 7vw, 30px);
  }

  h2 {
    font-size: clamp(20px, 6vw, 26px);
  }

  h3 {
    font-size: clamp(17px, 5vw, 21px);
  }

  input,
  select,
  textarea {
    font-size: 16px !important;
  }

  button,
  .btn,
  .button {
    min-height: 44px;
  }

  /* الأعمدة تتحول إلى عمود واحد */

  .form-grid,
  .fields-grid,
  .invoice-grid,
  .dashboard-grid,
  .stats-grid {
    grid-template-columns: 1fr !important;
  }

  /* مجموعات الأزرار */

  .actions,
  .form-actions,
  .toolbar,
  .button-row {
    width: 100%;
    max-width: 100%;
    flex-wrap: wrap;
  }

  .actions > button,
  .form-actions > button,
  .toolbar > button,
  .button-row > button {
    max-width: 100%;
  }

  /* الصور */

  img {
    height: auto;
  }
}

/* =======================================================
   Very small phones
   ======================================================= */

@media (max-width: 380px) {

  .fa-main {
    padding: 8px;
  }

  .fa-sidebar {
    width: 92vw;
    max-width: 92vw;
  }

  .fa-content-card {
    border-radius: 10px;
  }

  button,
  .btn,
  .button {
    width: 100%;
  }
}
'''

    # نضيف CSS داخل style الموجود في App.jsx
    # إذا كان هناك </style> نضعه قبله.
    if "</style>" in app_text:
        app_text = app_text.replace(
            "</style>",
            app_mobile_css + "\n</style>",
            1
        )
        print("✅ تمت إضافة تحسينات الجوال إلى App.jsx")
    else:
        print("⚠️ لم يتم العثور على </style> في App.jsx")

# =========================================================
# 5) حفظ App.jsx
# =========================================================

APP.write_text(app_text, encoding="utf-8")

# =========================================================
# 6) إضافة CSS عام إلى index.css
# =========================================================

css_marker = "/* MOBILE GLOBAL FINAL FIX */"

if css_marker not in css_text:

    global_css = r'''

/* =========================================================
   MOBILE GLOBAL FINAL FIX
   ========================================================= */

html,
body,
#root {
  width: 100%;
  max-width: 100%;
  min-width: 0;
  min-height: 100%;
  margin: 0;
  padding: 0;
  overflow-x: hidden;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

body {
  max-width: 100vw;
  overflow-x: hidden;
}

img,
video,
canvas,
svg {
  max-width: 100%;
}

input,
textarea,
select,
button {
  max-width: 100%;
}

/* =========================================================
   Mobile
   ========================================================= */

@media (max-width: 960px) {

  body {
    width: 100%;
    max-width: 100vw;
    overflow-x: hidden;
  }

  #root {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }

  /* منع shell القديم من أخذ مساحة غير صحيحة */

  .app-shell {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }

  .content {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    box-sizing: border-box;
    overflow-x: hidden;
  }

  /* الصور */

  img {
    max-width: 100%;
    height: auto;
  }

  /* الجداول */

  table {
    width: 100%;
    max-width: 100%;
  }

  /* أي عنصر يملك عرضًا ثابتًا كبيرًا */

  .container {
    width: 100%;
    max-width: 100%;
    min-width: 0;
  }

  /* الكتالوج */

  .client-catalog-root {
    width: 100%;
    max-width: 100vw;
    min-width: 0;
    overflow-x: hidden;
  }

  .client-catalog-page {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }

  .client-catalog-main {
    width: 100%;
    max-width: 100%;
    min-width: 0;
    overflow-x: hidden;
  }

  .client-catalog-main .container {
    width: 100%;
    max-width: 1200px;
    min-width: 0;
    margin-left: auto;
    margin-right: auto;
    padding-left: 14px;
    padding-right: 14px;
  }

  .services-grid {
    width: 100%;
    min-width: 0;
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .service-card {
    width: 100%;
    min-width: 0;
    max-width: 100%;
    overflow: hidden;
  }

  .service-image {
    width: 100%;
    max-width: 100%;
    height: 150px;
    object-fit: cover;
  }
}

/* =========================================================
   Phones
   ========================================================= */

@media (max-width: 600px) {

  .services-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .service-image {
    height: 145px;
  }

  .client-catalog-main .container {
    padding-left: 10px;
    padding-right: 10px;
  }

  /* تحسين لمس الحقول */

  input,
  select,
  textarea {
    min-height: 44px;
    font-size: 16px !important;
  }

  button {
    min-height: 44px;
  }

  /* منع Zoom في iOS */

  input,
  select,
  textarea {
    font-size: 16px !important;
  }
}

/* =========================================================
   Small phones
   ========================================================= */

@media (max-width: 380px) {

  .services-grid {
    grid-template-columns: 1fr;
  }

  .service-image {
    height: 180px;
  }

  .client-catalog-main .container {
    padding-left: 8px;
    padding-right: 8px;
  }
}
'''

    css_text += global_css

    print("✅ تمت إضافة Mobile CSS إلى index.css")

else:
    print("ℹ️ Mobile CSS موجود مسبقًا")

# =========================================================
# 7) حفظ index.css
# =========================================================

CSS.write_text(css_text, encoding="utf-8")

print()
print("============================================")
print("✅ اكتمل تعديل نسخة الجوال")
print("============================================")
print()
print("الملفات المعدلة:")
print("  ✓ App.jsx")
print("  ✓ index.css")
print()
print("النسخ الاحتياطية:")
print(f"  ✓ {app_backup}")
print(f"  ✓ {css_backup}")
print()
print("التغييرات:")
print("  ✓ القائمة من اليمين")
print("  ✓ القائمة لا تحجب الشاشة وهي مغلقة")
print("  ✓ القائمة تستخدم 100dvh")
print("  ✓ المحتوى بعرض الشاشة")
print("  ✓ منع التمرير الأفقي")
print("  ✓ تحسين الحقول للجوال")
print("  ✓ منع Zoom في حقول iPhone")
print("  ✓ تحسين الأزرار للمس")
print("  ✓ تحسين الجداول")
print("  ✓ تحسين البطاقات")
print("  ✓ تحسين Dashboard")
print("  ✓ تحسين نموذج الفاتورة")
print("  ✓ تحسين الكتالوج")
print("  ✓ دعم الشاشات الصغيرة")
print()
