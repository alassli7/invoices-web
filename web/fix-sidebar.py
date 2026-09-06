from pathlib import Path
import re

app = Path("App.jsx")

if not app.exists():
    print("❌ لم يتم العثور على App.jsx")
    raise SystemExit(1)

# إنشاء نسخة احتياطية
backup = Path("App.jsx.before-sidebar-fix")
backup.write_text(app.read_text(encoding="utf-8"), encoding="utf-8")

text = app.read_text(encoding="utf-8")

# ---------------------------------------------------------
# إصلاح CSS الخاص بالقائمة الجانبية داخل App.jsx
# ---------------------------------------------------------

pattern = re.compile(
    r'@media\s*\(max-width:\s*960px\)\s*\{\s*'
    r'\.fa-sidebar\s*\{.*?'
    r'\}\s*'
    r'\.fa-sidebar\.open\s*\{.*?\}\s*'
    r'\}',
    re.S
)

replacement = '''@media (max-width: 960px) {
  .fa-sidebar {
    position: fixed;

    top: 0;
    right: 0;
    bottom: 0;
    left: auto;

    width: 290px;
    max-width: 86vw;

    height: 100vh;

    transform: translateX(100%);
    transition: transform .22s ease;

    z-index: 60;

    box-shadow: -12px 0 32px rgba(0, 0, 0, .12);
  }

  .fa-sidebar.open {
    transform: translateX(0);
  }
}'''

matches = pattern.findall(text)

if not matches:
    print("❌ لم يتم العثور على CSS الخاص بـ .fa-sidebar")
    print("النسخة الاحتياطية موجودة في:")
    print(backup)
    raise SystemExit(1)

text = pattern.sub(replacement, text, count=1)

# ---------------------------------------------------------
# إصلاح الـ overlay
# ---------------------------------------------------------

overlay_pattern = re.compile(
    r'\.fa-overlay\s*\{\s*display:\s*none;\s*\}\s*'
    r'@media\s*\(max-width:\s*960px\)\s*\{\s*'
    r'\.fa-overlay\s*\{.*?\}\s*\}',
    re.S
)

overlay_replacement = '''.fa-overlay {
  display: none;
}

@media (max-width: 960px) {
  .fa-overlay {
    display: block;
    position: fixed;
    inset: 0;

    background: rgba(27, 42, 32, .35);

    z-index: 50;
  }
}'''

if overlay_pattern.search(text):
    text = overlay_pattern.sub(overlay_replacement, text, count=1)
else:
    print("⚠️ لم يتم العثور على CSS الخاص بـ .fa-overlay")

# ---------------------------------------------------------
# ضمان RTL للقائمة
# ---------------------------------------------------------

if ".fa-sidebar {" in text and "direction: rtl;" not in text:
    text = text.replace(
        ".fa-sidebar {",
        ".fa-sidebar {\n  direction: rtl;",
        1
    )

# ---------------------------------------------------------
# حفظ App.jsx
# ---------------------------------------------------------

app.write_text(text, encoding="utf-8")

print("✅ تم إصلاح القائمة الجانبية")
print()
print("القائمة الآن:")
print("  • مغلقة ← خارج الشاشة من اليمين")
print("  • مفتوحة ← تظهر من اليمين")
print("  • لا تحجب الصفحة وهي مغلقة")
print("  • RTL")
print()
print(f"📦 النسخة الاحتياطية: {backup}")

