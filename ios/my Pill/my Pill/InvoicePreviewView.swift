import SwiftUI
import CoreImage.CIFilterBuiltins
import UIKit

/// واجهة معاينة الفاتورة — مطابقة لفاتورة تطبيق الويب (التخطيط، الألوان، وبيانات الإعدادات).
struct InvoicePreviewView: View {
    @Environment(\.dismiss) private var dismiss
    let invoice: SupaClient.Row
    let profile: SupaClient.Row?

    private var p: SupaClient.Row { profile ?? [:] }

    @State private var pdfData: Data?
    @State private var showPDFShare = false
    @State private var showReceipt = false
    // ألوان مطابقة لـ CSS الخاصة بالويب
    private let primary = Color(red: 0.12, green: 0.44, blue: 0.33) // #1f6f54
    private let line = Color(red: 0.89, green: 0.91, blue: 0.93)    // #e3e8ee
    private let muted = Color(red: 0.42, green: 0.47, blue: 0.52)  // #6b7785
    private let noteBg = Color(red: 1.0, green: 0.97, blue: 0.90)  // #fff8e6
    private let noteBorder = Color(red: 0.95, green: 0.89, blue: 0.70) // #f3e2b3

    private let context = CIContext()
    private let filter = CIFilter.qrCodeGenerator()

    // رابط مشاركة الفاتورة (مثل buildShareUrl في الويب). غيّر الرابط الأساسي عند النشر.
    private let baseURL = "https://ohwreqztjzkpgoihkvgb.supabase.co"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    AppGlassHeader(
                        title: "معاينة الفاتورة",
                        subtitle: "فاتورة مطابقة لصفحة الدفع في الويب",
                        icon: "eye.fill"
                    )
                    sheet
                }
                .padding(12)
            }
            .background(Color(red: 0.96, green: 0.96, blue: 0.96)) // خلفية خارج الورقة
            .navigationTitle("معاينة الفاتورة")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(.white.opacity(0.72), for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("إغلاق") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    HStack(spacing: 12) {
                        Button {
                            showReceipt = true
                        } label: {
                            Image(systemName: "printer.fill")
                        }
                        Button {
                            exportPDF()
                        } label: {
                            Image(systemName: "doc.richtext.fill")
                        }
                        ShareLink(item: shareText) {
                            Image(systemName: "square.and.arrow.up")
                        }
                    }
                }
            }
            .sheet(isPresented: $showReceipt) {
                ReceiptPrintView(invoice: invoice, profile: profile)
            }
            .sheet(isPresented: $showPDFShare) {
                if let pdfData {
                    PDFShareSheet(data: pdfData, filename: "فاتورة.pdf")
                }
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
    }

    // يولّد ملف PDF من ورقة الفاتورة ويعرض نافذة المشاركة (صفحة A4-تقريبي).
    private func exportPDF() {
        let renderer = ImageRenderer(content: sheet)
        renderer.scale = 2
        renderer.isOpaque = true
        guard let image = renderer.uiImage else { return }

        let pageRect = CGRect(x: 0, y: 0, width: 595, height: 842) // A4 بالبوينت
        let rendererPDF = UIGraphicsPDFRenderer(bounds: pageRect)
        let data = rendererPDF.pdfData { ctx in
            ctx.beginPage()
            let inset: CGFloat = 28
            let availW = pageRect.width - inset * 2
            let availH = pageRect.height - inset * 2
            let aspect = image.size.width / max(image.size.height, 1)
            var drawSize = CGSize(width: availW, height: availW / aspect)
            if drawSize.height > availH {
                drawSize = CGSize(width: availH * aspect, height: availH)
            }
            image.draw(in: CGRect(
                x: pageRect.midX - drawSize.width / 2,
                y: pageRect.midY - drawSize.height / 2,
                width: drawSize.width,
                height: drawSize.height)
            )
        }
        pdfData = data
        showPDFShare = true
    }

    // ورقة الفاتورة بيضاء مقاس A4
    private var sheet: some View {
        VStack(spacing: 0) {
            header
            metaSection
            clientSection
            itemsTableSection
            payMethodsSection
            noteSection
            codesSection
            footer
        }
        .background(.white)
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .shadow(color: .black.opacity(0.08), radius: 24, x: 0, y: 6)
    }

    // MARK: الترويسة

    private var header: some View {
        HStack(alignment: .top, spacing: 12) {
            logoSide(title: "شعار العمل الحر",
                     dataURL: p["freelanceLogo"] as? String ?? "",
                     right: false)
            Spacer()
            VStack(spacing: 6) {
                Text(p["businessName"] as? String ?? "نشاطي الحر")
                    .font(.headline)
                    .foregroundStyle(primary)
                Text("فاتورة")
                    .font(.system(size: 34, weight: .heavy))
                    .foregroundStyle(primary)
                Text("رقم: \(invoice["number"] as? String ?? "-")")
                    .font(.footnote)
                    .foregroundStyle(muted)
                if hasVat {
                    Text("الرقم الضريبي: \(taxNumber)")
                        .font(.caption2)
                        .foregroundStyle(muted)
                }
                stamps
            }
            Spacer()
            logoSide(title: "شعار الشركة / المشروع",
                     dataURL: p["companyLogo"] as? String ?? "",
                     right: true,
                     extraCaption: "مصمم التطبيقات للهواتف الذكية")
        }
        .padding(.bottom, 16)
        .overlay(alignment: .bottom) {
            Rectangle().fill(primary).frame(height: 3)
        }
        .padding(.bottom, 14)
        .padding(.top, 18)
    }

    private func logoSide(title: String, dataURL: String, right: Bool, extraCaption: String? = nil) -> some View {
        VStack(alignment: right ? .leading : .trailing, spacing: 6) {
            if let img = logoImage(dataURL) {
                Image(uiImage: img)
                    .resizable()
                    .scaledToFit()
                    .frame(height: 60)
                    .frame(maxWidth: 130, alignment: right ? .leading : .trailing)
            } else {
                ZStack {
                    RoundedRectangle(cornerRadius: 8)
                        .strokeBorder(line, style: StrokeStyle(lineWidth: 2, dash: [6, 4]))
                    Text(title)
                        .font(.caption2)
                        .foregroundStyle(muted)
                        .multilineTextAlignment(.center)
                        .padding(.horizontal, 4)
                }
                .frame(width: 120, height: 56)
            }
            if let docNumber = p["docNumber"] as? String, !docNumber.isEmpty {
                Text("\(docLabel(p["docType"] as? String)): \(docNumber)")
                    .font(.caption2)
                    .foregroundStyle(muted)
                    .multilineTextAlignment(right ? .leading : .trailing)
            }
            if let extraCaption {
                Text(extraCaption)
                    .font(.caption2)
                    .foregroundStyle(muted)
                    .multilineTextAlignment(right ? .leading : .trailing)
            }
        }
        .frame(width: 140, alignment: right ? .leading : .trailing)
    }

    private func logoImage(_ dataURL: String) -> UIImage? {
        guard let comma = dataURL.firstIndex(of: ","),
              let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])),
              let img = UIImage(data: data) else { return nil }
        return img
    }

    private func docLabel(_ t: String?) -> String {
        (t == "cr") ? "رقم الشركة (السجل التجاري)" : "وثيقة العمل الحر"
    }

    @ViewBuilder
    private var stamps: some View {
        let status = invoice["status"] as? String
        if status == "refunded" {
            Text("مُلغاة")
                .font(.caption.bold())
                .foregroundStyle(.red)
                .overlay(RoundedRectangle(cornerRadius: 4).stroke(.red, lineWidth: 2))
                .rotationEffect(.degrees(-8))
                .padding(2)
        }
    }

    // MARK: بيانات الفاتورة والعميل

    private var metaSection: some View {
        VStack(alignment: .trailing, spacing: 6) {
            metaRow("تاريخ الإصدار", dateLabel(invoice["date"] as? String))
            metaRow("وقت الإصدار", timeLabel(invoice["date"] as? String))
            metaRow("تاريخ الاستحقاق", dateLabel(invoice["dueDate"] as? String))
            HStack {
                Text(statusText)
                    .font(.subheadline.bold())
                    .foregroundStyle(statusColor)
                Spacer()
                Text("الحالة:") .foregroundStyle(muted)
            }
        }
        .padding(12)
        .background(Color(red: 0.97, green: 0.98, blue: 0.99), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(line, lineWidth: 1))
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
    }

    private var clientSection: some View {
        VStack(alignment: .trailing, spacing: 6) {
            sectionTitle("العميل")
            clientRow("الاسم", invoice["clientName"] as? String)
            clientRow("الجوال", invoice["clientPhone"] as? String)
            clientRow("البريد", invoice["clientEmail"] as? String)
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
        .padding(14)
        .background(Color(red: 0.97, green: 0.98, blue: 0.99), in: RoundedRectangle(cornerRadius: 10))
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(line, lineWidth: 1))
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
    }

    private func sectionTitle(_ text: String) -> some View {
        Text(text)
            .font(.headline)
            .foregroundStyle(primary)
    }

    private func metaRow(_ label: String, _ value: String) -> some View {
        HStack {
            Text(value).font(.subheadline)
            Spacer()
            Text("\(label):").foregroundStyle(muted)
        }
    }

    private func clientRow(_ label: String, _ value: Any?) -> some View {
        HStack(alignment: .top) {
            Text("\(value as? String ?? "-")")
                .font(.subheadline)
            Spacer()
            Text("\(label):").foregroundStyle(muted)
        }
    }

    // MARK: جدول البنود

    private var itemsTableSection: some View {
        VStack(spacing: 0) {
            HStack {
                Text("الإجمالي").frame(maxWidth: .infinity, alignment: .center)
                Text("السعر").frame(maxWidth: .infinity, alignment: .center)
                Text("الكمية").frame(maxWidth: .infinity, alignment: .center)
                Text("الوصف").frame(maxWidth: .infinity, alignment: .center)
            }
            .font(.subheadline.bold())
            .foregroundStyle(primary)
            .padding(.vertical, 10)
            .background(Color(red: 0.97, green: 0.98, blue: 0.98), in: Rectangle())

            ForEach(Array(items.enumerated()), id: \.offset) { _, it in
                itemRow(it)
            }

            VStack(alignment: .trailing, spacing: 4) {
                HStack {
                    Spacer()
                    Text("المجموع الفرعي")
                        .font(.footnote)
                        .foregroundStyle(muted)
                    Text(currencyTotal(subtotal))
                        .font(.subheadline.bold())
                }
                if hasVat {
                    HStack {
                        Spacer()
                        Text("ضريبة القيمة المضافة (\(qtyText(vatRate))%)")
                            .font(.footnote)
                            .foregroundStyle(muted)
                        Text(currency(vatAmount))
                            .font(.subheadline)
                    }
                    HStack {
                        Spacer()
                        Text("الإجمالي شاملاً الضريبة")
                            .font(.caption)
                            .fontWeight(.semibold)
                            .foregroundStyle(primary)
                        Text(currencyTotal(grandTotal))
                            .font(.headline)
                            .foregroundStyle(primary)
                    }
                } else {
                    HStack {
                        Spacer()
                        Text("الإجمالي")
                            .font(.headline)
                            .foregroundStyle(primary)
                        Text(currencyTotal(subtotal))
                            .font(.headline)
                            .foregroundStyle(primary)
                    }
                }
            }
            .padding(.vertical, 10)
            .padding(.horizontal, 16)
            .frame(maxWidth: .infinity, alignment: .trailing)
            .background(Color(red: 0.97, green: 0.98, blue: 0.98), in: Rectangle())
        }
        .overlay(RoundedRectangle(cornerRadius: 10).stroke(line, lineWidth: 1))
        .clipShape(RoundedRectangle(cornerRadius: 10))
        .padding(.horizontal, 16)
        .padding(.bottom, 12)
    }

    private func itemRow(_ it: [String: Any]) -> some View {
        let cancelled = it["cancelled"] as? Bool ?? false
        let qty = num(it["qty"])
        let price = num(it["price"])
        return HStack {
            Text(cancelled ? "ملغاة" : currency(qty * price))
                .frame(maxWidth: .infinity, alignment: .center)
            Text(currency(price)).frame(maxWidth: .infinity, alignment: .center)
            Text(qtyText(qty)).frame(maxWidth: .infinity, alignment: .center)
            Text(it["desc"] as? String ?? "-")
                .frame(maxWidth: .infinity, alignment: .center)
                .strikethrough(cancelled)
        }
        .font(.subheadline)
        .foregroundStyle(cancelled ? muted : .primary)
        .padding(.vertical, 10)
        .overlay(alignment: .bottom) { Divider().overlay(line) }
        .clipped()
    }

    // MARK: طرق الدفع

    @ViewBuilder
    private var payMethodsSection: some View {
        if payMethodsNonEmpty {
            VStack(alignment: .trailing, spacing: 8) {
                sectionTitle("طرق الدفع المتاحة")
                if pm("bank") {
                    payMethodBox {
                        HStack(alignment: .center, spacing: 12) {
                            pmLogoView(payLogo("bankLogo"))
                            VStack(alignment: .trailing, spacing: 3) {
                                Text("تحويل بنكي — بنك \(p["bankName"] as? String ?? "")")
                                    .font(.subheadline.bold())
                                Text("اسم المستفيد: \(p["accountName"] as? String ?? "_")")
                                    .font(.footnote).foregroundStyle(muted)
                                Text("رقم الحساب: \(p["accountNumber"] as? String ?? "-")")
                                    .font(.footnote).foregroundStyle(muted)
                                Text("الآيبان (IBAN): \(p["iban"] as? String ?? "-")")
                                    .font(.footnote).foregroundStyle(muted)
                            }
                        }
                    }
                }
                if pm("applePay") {
                    payMethodBox {
                        HStack(alignment: .center, spacing: 12) {
                            pmLogoView(payLogo("applePayLogo"))
                            VStack(alignment: .trailing, spacing: 3) {
                                Text("Apple Pay").font(.subheadline.bold())
                                Text("الدفع على الرقم: \(applePayPhone)")
                                    .font(.footnote).foregroundStyle(muted)
                            }
                        }
                    }
                }
                if pm("mastercard") {
                    payMethodBox {
                        HStack(alignment: .center, spacing: 12) {
                            pmLogoView(payLogo("mastercardLogo"))
                            VStack(alignment: .trailing, spacing: 3) {
                                Text("بطاقة Mastercard — ادفع بالبطاقة.")
                                    .font(.subheadline.bold())
                                    .frame(maxWidth: .infinity, alignment: .trailing)
                            }
                        }
                    }
                }
            }
            .frame(maxWidth: .infinity, alignment: .trailing)
            .padding(14)
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(line, lineWidth: 1))
            .padding(.horizontal, 16)
            .padding(.bottom, 12)
        }
    }

    private func payMethodBox<Content: View>(@ViewBuilder content: () -> Content) -> some View {
        content()
            .frame(maxWidth: .infinity, alignment: .trailing)
            .padding(12)
            .background(Color(red: 0.99, green: 0.99, blue: 0.99), in: RoundedRectangle(cornerRadius: 10))
            .overlay(RoundedRectangle(cornerRadius: 10).stroke(line, lineWidth: 1))
    }

    private var payMethodsNonEmpty: Bool {
        pm("bank") || pm("applePay") || pm("mastercard")
    }
    private func pm(_ key: String) -> Bool {
        let pm = p["payMethods"] as? [String: Any]
        return (pm?[key] as? Bool) ?? false
    }
    private var applePayPhone: String {
        let pm = p["payMethods"] as? [String: Any]
        return pm?["applePayPhone"] as? String ?? "-"
    }
    private func payLogo(_ key: String) -> String {
        let pm = p["payMethods"] as? [String: Any]
        return pm?[key] as? String ?? ""
    }
    @ViewBuilder
    private func pmLogoView(_ dataURL: String) -> some View {
        if let img = logoImage(dataURL) {
            Image(uiImage: img)
                .resizable()
                .scaledToFit()
                .frame(maxWidth: 90, maxHeight: 50)
        }
    }

    // MARK: التنويه + QR + التذييل

    @ViewBuilder
    private var noteSection: some View {
        let note = invoice["note"] as? String ?? (p["note"] as? String ?? "")
        if !note.isEmpty {
            Text(note)
                .font(.subheadline)
                .foregroundStyle(Color(red: 0.48, green: 0.36, blue: 0.0))
                .frame(maxWidth: .infinity, alignment: .trailing)
                .padding(12)
                .background(noteBg, in: RoundedRectangle(cornerRadius: 8))
                .overlay(RoundedRectangle(cornerRadius: 8).stroke(noteBorder, lineWidth: 1))
                .padding(.horizontal, 16)
                .padding(.bottom, 12)
        }
    }

    @ViewBuilder
    private var codesSection: some View {
        let qr = qrImage
        let bar = barcodeImage
        if qr != nil || bar != nil {
            HStack(alignment: .top, spacing: 16) {
                if let bar {
                    VStack(spacing: 6) {
                        Image(uiImage: bar)
                            .interpolation(.none)
                            .resizable()
                            .scaledToFit()
                            .frame(maxWidth: .infinity, maxHeight: 72)
                        Text("باركود الفاتورة")
                            .font(.footnote)
                            .foregroundStyle(muted)
                    }
                }
                if let qr {
                    VStack(spacing: 6) {
                        Image(uiImage: qr)
                            .interpolation(.none)
                            .resizable()
                            .frame(width: 96, height: 96)
                        Text("( لوثيقة الفاتورة)")
                            .font(.footnote)
                            .foregroundStyle(muted)
                            .multilineTextAlignment(.center)
                    }
                }
            }
            .frame(maxWidth: .infinity)
            .padding(16)
            .padding(.bottom, 4)
        }
    }

    private var barcodeImage: UIImage? {
        Code128Barcode.image(for: shareURL, height: 72)
    }

    private var footer: some View {
        let phone = p["phone"] as? String ?? ""
        let email = p["email"] as? String ?? ""
        let contact = [phone, email].filter { !$0.isEmpty }.joined(separator: " - ")
        return Text(!contact.isEmpty ? "للتواصل: \(contact)" : "شكراً لتعاملكم معنا")
            .font(.footnote)
            .foregroundStyle(muted)
            .frame(maxWidth: .infinity)
            .padding(.top, 12)
            .padding(.bottom, 16)
            .overlay(alignment: .top) { Rectangle().fill(line).frame(height: 1) }
    }

    // MARK: حسابات ومصادر

    private var items: [[String: Any]] {
        invoice["items"] as? [[String: Any]] ?? []
    }

    private var subtotal: Double {
        items.reduce(0) { sum, it in
            let cancelled = it["cancelled"] as? Bool ?? false
            return cancelled ? sum : sum + num(it["qty"]) * num(it["price"])
        }
    }

    // الضريبة (VAT) — تُقرأ من إعدادات النشاط (payMethods)
    private var payMethods: [String: Any] { p["payMethods"] as? [String: Any] ?? [:] }
    private var taxNumber: String { (payMethods["taxNumber"] as? String ?? "").trimmingCharacters(in: .whitespaces) }
    private var vatRate: Double { (payMethods["vatRate"] as? NSNumber)?.doubleValue ?? 0 }
    private var hasVat: Bool { !taxNumber.isEmpty && vatRate > 0 }
    private var vatAmount: Double { hasVat ? subtotal * vatRate / 100 : 0 }
    private var grandTotal: Double { subtotal + vatAmount }

    private var statusText: String {
        switch invoice["status"] as? String {
        case "paid": return "مدفوعة"
        case "refunded": return "مُلغاة"
        default: return "مستحقة"
        }
    }
    private var statusColor: Color {
        switch invoice["status"] as? String {
        case "paid": return primary
        case "refunded": return muted
        default: return .red
        }
    }

    private var shareURL: String {
        "\(baseURL)/#/i/\(invoice["id"] as? String ?? "")"
    }

    private var qrImage: UIImage? {
        filter.message = Data(shareURL.utf8)
        filter.correctionLevel = "M"
        guard let output = filter.outputImage else { return nil }
        let scaled = output.transformed(by: CGAffineTransform(scaleX: 10, y: 10))
        if let cg = context.createCGImage(scaled, from: scaled.extent) {
            return UIImage(cgImage: cg)
        }
        return nil
    }

    private var shareText: String {
        let lines = items.map { "\($0["desc"] ?? "") × \(qtyText(num($0["qty"]))) = \(currency(num($0["qty"]) * num($0["price"])))" }
        return [
            "فاتورة رقم \(invoice["number"] as? String ?? "-")",
            "العميل: \(invoice["clientName"] as? String ?? "-")",
            "",
            lines.joined(separator: "\n"),
            "",
            "الإجمالي: \(currency(hasVat ? grandTotal : subtotal))"
        ].joined(separator: "\n")
    }

    private func num(_ value: Any?) -> Double {
        if let n = value as? NSNumber { return n.doubleValue }
        if let s = value as? String { return Double(s) ?? 0 }
        return 0
    }
    private func qtyText(_ v: Double) -> String {
        v.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(v)) : String(v)
    }
    private func dateLabel(_ iso: String?) -> String {
        guard let iso else { return "-" }
        let f = ISO8601DateFormatter()
        if let d = f.date(from: iso) { return d.formatted(date: .abbreviated, time: .omitted) }
        return iso
    }
    private func timeLabel(_ iso: String?) -> String {
        guard let iso, let d = ISO8601DateFormatter().date(from: iso) else { return "-" }
        let t = d.formatted(date: .omitted, time: .shortened)
        return t
    }
    private func currency(_ value: Double) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "ar_SA")
        f.numberStyle = .currency
        f.currencySymbol = "ر.س"
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }
    // إجمالي الريال الصحيح (مثل formatTotal — بدون كسور)
    private func currencyTotal(_ value: Double) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "ar_SA")
        f.numberStyle = .currency
        f.currencySymbol = "ر.س"
        f.maximumFractionDigits = 0
        return f.string(from: NSNumber(value: value.rounded())) ?? "\(value)"
    }
}

/// نافذة مشاركة/تصدير ملف PDF عبر UIActivityViewController.
struct PDFShareSheet: UIViewControllerRepresentable {
    let data: Data
    let filename: String

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let url = FileManager.default.temporaryDirectory
            .appendingPathComponent(filename)
        try? data.write(to: url)
        return UIActivityViewController(activityItems: [url], applicationActivities: nil)
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

