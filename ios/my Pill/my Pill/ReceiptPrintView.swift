import SwiftUI
import UIKit
import CoreImage.CIFilterBuiltins

/// إيصال حراري (80مم) مطابق لإيصال الطابعة EPSON في تطبيق الويب — مع طباعة AirPrint/PDF.
struct ReceiptPrintView: View {
    @Environment(\.dismiss) private var dismiss
    let invoice: SupaClient.Row
    let profile: SupaClient.Row?

    private var p: SupaClient.Row { profile ?? [:] }

    private let lineColor = Color.black.opacity(0.2)
    private let green = Color(red: 0.12, green: 0.54, blue: 0.30)
    private let red = Color(red: 0.75, green: 0.22, blue: 0.17)

    private let context = CIContext()
    private let filter = CIFilter.qrCodeGenerator()
    private let baseURL = "https://ohwreqztjzkpgoihkvgb.supabase.co"

    var body: some View {
        NavigationStack {
            ScrollView {
                VStack(spacing: 12) {
                    receipt
                        .frame(alignment: .center)
                }
                .padding(12)
            }
            .background(Color(red: 0.91, green: 0.93, blue: 0.94))
            .navigationTitle("طباعة حرارية EPSON")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(.white.opacity(0.72), for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarLeading) {
                    Button("إغلاق") { dismiss() }
                }
                ToolbarItem(placement: .topBarTrailing) {
                    Button("طباعة") { printReceipt() }
                        .fontWeight(.semibold)
                }
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
    }

    // MARK: الإيصال (80مم)

    private var receipt: some View {
        VStack(spacing: 6) {
            HStack(alignment: .top, spacing: 8) {
                receiptLogo("شعار العمل الحر", dataURL: p["freelanceLogo"] as? String ?? "", align: .trailing)
                    .frame(minWidth: 0, maxWidth: .infinity, alignment: .trailing)
                receiptLogo("شعار الشركة", dataURL: p["companyLogo"] as? String ?? "", align: .leading)
                    .frame(minWidth: 0, maxWidth: .infinity, alignment: .leading)
            }
            .padding(.bottom, 2)

            Text(p["businessName"] as? String ?? "نشاطي الحر")
                .font(.system(size: 15, weight: .bold))
                .frame(maxWidth: .infinity, alignment: .center)

            Text("فاتورة — رقم: \(invoice["number"] as? String ?? "-")")
                .font(.system(size: 13, weight: .bold))
                .frame(maxWidth: .infinity, alignment: .center)

            if let docNumber = p["docNumber"] as? String, !docNumber.isEmpty {
                Text("\(docLabel(p["docType"] as? String)): \(docNumber)")
                    .font(.system(size: 10))
                    .frame(maxWidth: .infinity, alignment: .center)
            }

            if hasVat {
                Text("الرقم الضريبي: \(taxNumber)")
                    .font(.system(size: 10))
                    .frame(maxWidth: .infinity, alignment: .center)
            }

            if (invoice["status"] as? String) == "refunded" {
                stamp(text: "مُلغاة")
            }

            let phone = p["phone"] as? String ?? ""
            let email = p["email"] as? String ?? ""
            let contact = [phone, email].filter { !$0.isEmpty }.joined(separator: " - ")
            if !contact.isEmpty {
                Text(contact)
                    .font(.system(size: 11))
                    .frame(maxWidth: .infinity, alignment: .center)
            }

            dash

            row("فاتورة", invoice["number"] as? String ?? "-")
            row("التاريخ", dateLabel(invoice["date"] as? String))
            row("الوقت", timeLabel(invoice["date"] as? String))
            row("الاستحقاق", dateLabel(invoice["dueDate"] as? String))
            rowValue("الحالة", statusText, color: statusColor)

            dash

            Text("العميل: \(invoice["clientName"] as? String ?? "-")")
                .font(.system(size: 12, weight: .bold))
                .frame(maxWidth: .infinity, alignment: .trailing)
            let clientContact = [invoice["clientPhone"] as? String ?? "",
                                invoice["clientEmail"] as? String ?? ""]
                .filter { !$0.isEmpty }.joined(separator: " - ")
            if !clientContact.isEmpty {
                Text(clientContact)
                    .font(.system(size: 11))
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }

            dash

            HStack {
                Text("الصنف").frame(maxWidth: .infinity, alignment: .trailing)
                Text("المبلغ").frame(maxWidth: .infinity, alignment: .trailing)
            }
            .font(.system(size: 12, weight: .bold))

            ForEach(Array(items.enumerated()), id: \.offset) { _, it in
                itemBlock(it)
            }

            dash

            if hasVat {
                row("المجموع الفرعي", currencyTotal(subtotal))
                row("ضريبة (\(qtyText(vatRate))%)", currency(vatAmount))
                row("الإجمالي شاملاً الضريبة", currencyTotal(grandTotal))
                    .fontWeight(.bold)
            } else {
                row("الإجمالي", currencyTotal(subtotal))
                    .fontWeight(.bold)
            }

            dash

            if payMethodsNonEmpty {
                Text("طرق الدفع")
                    .font(.system(size: 12, weight: .bold))
                    .frame(maxWidth: .infinity, alignment: .center)
                if pm("bank") {
                    VStack(alignment: .trailing, spacing: 3) {
                        row("تحويل بنكي", "بنك \(p["bankName"] as? String ?? "")")
                        row("اسم المستفيد", p["accountName"] as? String ?? "عبدالله خليفه السعدون")
                        row("الحساب", p["accountNumber"] as? String ?? "-")
                        row("IBAN", p["iban"] as? String ?? "-")
                    }
                    .padding(6)
                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(lineColor, lineWidth: 1))
                }
                if pm("applePay") {
                    row("Apple Pay", applePayPhone)
                }
                if pm("mastercard") {
                    row("Mastercard", "ادفع بالبطاقة")
                }
            }

            if let note = invoice["note"] as? String ?? (p["note"] as? String), !note.isEmpty {
                Text(note)
                    .font(.system(size: 11))
                    .multilineTextAlignment(.center)
                    .padding(6)
                    .frame(maxWidth: .infinity, alignment: .center)
                    .overlay(RoundedRectangle(cornerRadius: 4).stroke(lineColor, style: StrokeStyle(lineWidth: 1, dash: [4])))
                    .padding(.vertical, 2)
            }

            dash

            if let bar = barcodeImage {
                Image(uiImage: bar)
                    .interpolation(.none)
                    .resizable()
                    .scaledToFit()
                    .frame(maxWidth: .infinity, maxHeight: 44)
            }
            if let qr = qrImage {
                Image(uiImage: qr)
                    .interpolation(.none)
                    .resizable()
                    .frame(width: 96, height: 96)
            }

            Text("شكراً لتعاملكم معنا")
                .font(.system(size: 12, weight: .bold))
                .frame(maxWidth: .infinity, alignment: .center)
                .padding(.top, 4)
        }
        .padding(16)
        .frame(width: 300)
        .font(.system(size: 12))
        .background(.white)
        .foregroundStyle(.black)
        .clipShape(RoundedRectangle(cornerRadius: 6))
        .shadow(color: .black.opacity(0.15), radius: 12, y: 6)
    }

    @ViewBuilder
    private func receiptLogo(_ title: String, dataURL: String, align: Alignment) -> some View {
        if let img = logoImage(dataURL) {
            Image(uiImage: img)
                .resizable()
                .scaledToFit()
                .frame(maxHeight: 44)
        } else {
            Text(title)
                .font(.system(size: 10, weight: .bold))
                .padding(6)
                .overlay(Rectangle().strokeBorder(.black, style: StrokeStyle(lineWidth: 1, dash: [3])))
                .lineLimit(1)
        }
    }

    private var dash: some View {
        Rectangle()
            .fill(.clear)
            .frame(maxWidth: .infinity)
            .frame(height: 1)
            .overlay(
                DashedLine()
                    .stroke(.black.opacity(0.35), style: StrokeStyle(lineWidth: 1, dash: [4, 3]))
            )
    }

    private func row(_ label: String, _ value: String) -> some View {
        HStack(alignment: .top) {
            Text(value).frame(maxWidth: .infinity, alignment: .leading)
            Text(label).frame(maxWidth: .infinity, alignment: .trailing)
        }
    }
    private func rowValue(_ label: String, _ value: String, color: Color) -> some View {
        HStack(alignment: .top) {
            Text(value).foregroundStyle(color).frame(maxWidth: .infinity, alignment: .leading)
            Text(label).frame(maxWidth: .infinity, alignment: .trailing)
        }
    }

    private func itemBlock(_ it: [String: Any]) -> some View {
        let cancelled = it["cancelled"] as? Bool ?? false
        let qty = num(it["qty"])
        let price = num(it["price"])
        return VStack(alignment: .trailing, spacing: 2) {
            Text(it["desc"] as? String ?? "-")
                .font(.system(size: 12, weight: .bold))
                .strikethrough(cancelled)
                .frame(maxWidth: .infinity, alignment: .trailing)
            if cancelled {
                row("الحالة", "ملغاة")
            } else {
                row("\(qtyText(qty)) × \(currency(price))", currency(qty * price))
            }
        }
        .padding(.bottom, 2)
    }

    private func stamp(text: String) -> some View {
        Text(text)
            .font(.system(size: 11, weight: .bold))
            .foregroundStyle(red)
            .padding(3)
            .overlay(Rectangle().strokeBorder(red, lineWidth: 1.5))
            .rotationEffect(.degrees(-6))
            .padding(.vertical, 2)
    }

    // MARK: حسابات ومصادر

    private var items: [[String: Any]] {
        invoice["items"] as? [[String: Any]] ?? []
    }
    private var subtotal: Double {
        items.reduce(0) { sum, it in
            let c = it["cancelled"] as? Bool ?? false
            return c ? sum : sum + num(it["qty"]) * num(it["price"])
        }
    }
    private var payMethods: [String: Any] { p["payMethods"] as? [String: Any] ?? [:] }
    private var taxNumber: String { (payMethods["taxNumber"] as? String ?? "").trimmingCharacters(in: .whitespaces) }
    private var vatRate: Double { (payMethods["vatRate"] as? NSNumber)?.doubleValue ?? 0 }
    private var hasVat: Bool { !taxNumber.isEmpty && vatRate > 0 }
    private var vatAmount: Double { hasVat ? subtotal * vatRate / 100 : 0 }
    private var grandTotal: Double { subtotal + vatAmount }
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

    private var statusText: String {
        switch invoice["status"] as? String {
        case "paid": return "مدفوعة"
        case "refunded": return "مُلغاة"
        default: return "مستحقة"
        }
    }
    private var statusColor: Color {
        switch invoice["status"] as? String {
        case "paid": return green
        case "refunded": return .gray
        default: return red
        }
    }

    private func docLabel(_ t: String?) -> String {
        (t == "cr") ? "رقم الشركة (السجل التجاري)" : "وثيقة العمل الحر"
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
    private var barcodeImage: UIImage? {
        Code128Barcode.image(for: shareURL, height: 44)
    }

    private func logoImage(_ dataURL: String) -> UIImage? {
        guard let comma = dataURL.firstIndex(of: ","),
              let data = Data(base64Encoded: String(dataURL[dataURL.index(after: comma)...])),
              let img = UIImage(data: data) else { return nil }
        return img
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
        if let d = ISO8601DateFormatter().date(from: iso) {
            return d.formatted(date: .abbreviated, time: .omitted)
        }
        return iso
    }
    private func timeLabel(_ iso: String?) -> String {
        guard let iso, let d = ISO8601DateFormatter().date(from: iso) else { return "-" }
        return d.formatted(date: .omitted, time: .shortened)
    }
    private func currency(_ value: Double) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "ar_SA")
        f.numberStyle = .currency
        f.currencySymbol = "ر.س"
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }
    private func currencyTotal(_ value: Double) -> String {
        let f = NumberFormatter()
        f.locale = Locale(identifier: "ar_SA")
        f.numberStyle = .currency
        f.currencySymbol = "ر.س"
        f.maximumFractionDigits = 0
        return f.string(from: NSNumber(value: value.rounded())) ?? "\(value)"
    }

    // MARK: طباعة AirPrint

    private func printReceipt() {
        let renderer = ImageRenderer(content: receipt)
        renderer.scale = 2
        renderer.isOpaque = true
        guard let image = renderer.uiImage else { return }

        // PDF بطول مناسب للإيصال
        let bounds = CGRect(x: 0, y: 0, width: image.size.width, height: image.size.height)
        let pdf = UIGraphicsPDFRenderer(bounds: bounds)
        let data = pdf.pdfData { ctx in
            ctx.beginPage()
            image.draw(in: bounds)
        }

        let controller = UIPrintInteractionController.shared
        let info = UIPrintInfo.printInfo()
        info.jobName = "فاتورة \(invoice["number"] as? String ?? "")"
        info.orientation = UIPrintInfo.Orientation.portrait
        info.outputType = UIPrintInfo.OutputType.general
        controller.printInfo = info
        controller.printingItem = data
        controller.present(animated: true, completionHandler: nil)
    }
}

/// خط متقطّع يمتد بعرض المتاح.
struct DashedLine: Shape {
    func path(in rect: CGRect) -> Path {
        var p = Path()
        p.move(to: CGPoint(x: rect.minX, y: rect.midY))
        p.addLine(to: CGPoint(x: rect.maxX, y: rect.midY))
        return p
    }
}

