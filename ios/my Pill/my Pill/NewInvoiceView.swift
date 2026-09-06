import SwiftUI
import SwiftData

struct NewInvoiceView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var number = ""
    @State private var issueDate = Date()
    @State private var dueDate = Date()
    @State private var status = "unpaid"
    @State private var clientName = ""
    @State private var clientPhone = ""
    @State private var clientEmail = ""
    @State private var note = ""
    @State private var rows: [ItemRow] = [ItemRow()]
    @State private var showSaved = false
    @State private var errorMsg: String?
    @State private var busy = false
    @State private var catalog: [SupaClient.Row] = []

    struct ItemRow: Identifiable {
        let id = UUID()
        var desc = ""
        var qtyText = "1"
        var priceText = "0"
        var cancelled = false
    }

    var body: some View {
        NavigationStack {
            AppScreen {
                ScrollView {
                    VStack(spacing: 20) {
                        AppGlassHeader(
                            title: "فاتورة جديدة",
                            subtitle: "أنشئ فاتورة وشاركها بطرق الدفع المتاحة",
                            icon: "doc.text.fill"
                        )
                        infoCard
                        clientCard
                        itemsCard
                        noteCard
                        errorCard
                        AppPrimaryButton(
                            title: busy ? "جارٍ الحفظ…" : "حفظ وعرض",
                            icon: "checkmark.circle.fill",
                            disabled: number.trimmingCharacters(in: .whitespaces).isEmpty || busy,
                            busy: busy
                        ) {
                            Task { await save() }
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("فاتورة جديدة")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(.white.opacity(0.72), for: .navigationBar)
            .alert("تم حفظ الفاتورة ✓", isPresented: $showSaved) {
                Button("حسناً") {}
            }
        }
        .task {
            await loadCatalog()
            if number.isEmpty { number = String(Int(Date().timeIntervalSince1970) % 100000) }
        }
    }

    private var infoCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: "بيانات الفاتورة")
                HStack(spacing: 12) {
                    AppField(icon: "number", placeholder: "رقم الفاتورة", text: $number)
                        .onChange(of: dueDate) { oldValue, newValue in
                            print("من: \(oldValue)")
                            print("إلى: \(newValue)")
                        }
                }
                dateField(icon: "calendar", title: "تاريخ الإصدار", selection: $issueDate)
                dateField(icon: "calendar.badge.clock", title: "تاريخ الاستحقاق", selection: $dueDate)
                statusPicker
            }
        }
    }

    private func dateField(icon: String, title: String, selection: Binding<Date>) -> some View {
        HStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 17))
                .foregroundStyle(AppTheme.brand)
                .frame(width: 24)
            DatePicker(title, selection: selection, displayedComponents: .date)
                .labelsHidden()
                .environment(\.layoutDirection, .rightToLeft)
            Spacer()
        }
        .padding(10)
        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(AppTheme.brand.opacity(0.25), lineWidth: 1.2))
    }

    private var statusPicker: some View {
        HStack(spacing: 12) {
            Image(systemName: "checkmark.circle")
                .font(.system(size: 17))
                .foregroundStyle(AppTheme.brand)
                .frame(width: 24)
            Picker("الحالة", selection: $status) {
                Text("مستحقة").tag("unpaid")
                Text("مدفوعة").tag("paid")
            }
            .pickerStyle(.segmented)
            .tint(AppTheme.brand)
            Spacer()
        }
        .padding(10)
        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 14))
    }

    private var clientCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: "بيانات العميل")
                AppField(icon: "person.fill", placeholder: "الاسم", text: $clientName)
                AppField(icon: "phone.fill", placeholder: "الجوال", text: $clientPhone, keyboard: .phonePad)
                AppField(icon: "envelope.fill", placeholder: "البريد", text: $clientEmail, keyboard: .emailAddress)
            }
        }
    }

    private var itemsCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 12) {
                AppSectionTitle(text: "بنود الفاتورة")

                if !catalog.isEmpty {
                    Menu {
                        ForEach(catalog.indices, id: \.self) { index in
                            Button("\(catalog[index]["desc"] as? String ?? "") (\(currency(num(catalog[index]["price"]))))") {
                                addFromCatalog(catalog[index])
                            }
                        }
                    } label: {
                        Label("إضافة من الأصناف المحفوظة", systemImage: "plus.circle")
                            .foregroundStyle(AppTheme.brand)
                            .font(.subheadline.weight(.semibold))
                    }
                }

                ForEach($rows) { $row in
                    itemCard($row)
                }

                Button {
                    rows.append(ItemRow())
                } label: {
                    Label("إضافة بند", systemImage: "plus")
                        .font(.subheadline.bold())
                        .foregroundStyle(AppTheme.brand)
                }

                totalRow
            }
        }
    }

    private func itemCard(_ row: Binding<ItemRow>) -> some View {
        let total = price(row.wrappedValue.priceText) * qty(row.wrappedValue.qtyText)
        return VStack(alignment: .trailing, spacing: 10) {
            HStack(spacing: 8) {
                Image(systemName: "list.bullet")
                    .foregroundStyle(AppTheme.brand)
                TextField("وصف البند", text: row.desc)
                    .padding(8)
                    .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
                Spacer()
            }
            HStack(spacing: 10) {
                VStack(alignment: .trailing, spacing: 4) {
                    Text("الكمية").font(.caption2).foregroundStyle(.secondary)
                    TextField("كمية", text: row.qtyText)
                        .keyboardType(.decimalPad)
                        .padding(8)
                        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
                }
                VStack(alignment: .trailing, spacing: 4) {
                    Text("السعر").font(.caption2).foregroundStyle(.secondary)
                    TextField("سعر", text: row.priceText)
                        .keyboardType(.decimalPad)
                        .padding(8)
                        .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 8))
                }
            }
            HStack {
                Text(row.cancelled.wrappedValue ? "ملغاة" : currency(total))
                    .font(.subheadline.bold())
                    .foregroundStyle(row.cancelled.wrappedValue ? .secondary : AppTheme.brand)
                Spacer()
                Button(row.cancelled.wrappedValue ? "تراجع" : "إلغاء") {
                    row.cancelled.wrappedValue.toggle()
                }
                .buttonStyle(.bordered)
                .tint(Orange)
                if rows.count > 1 {
                    Button(role: .destructive) {
                        rows.removeAll { $0.id == row.id }
                    } label: {
                        Image(systemName: "trash")
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
        .padding(12)
        .background(Color(.systemBackground), in: RoundedRectangle(cornerRadius: 14))
        .overlay(RoundedRectangle(cornerRadius: 14).stroke(AppTheme.brand.opacity(0.25), lineWidth: 1.2))
    }

    private let Orange = Color(red: 0.95, green: 0.61, blue: 0.07)

    private var totalRow: some View {
        HStack {
            Spacer()
            Text("الإجمالي:")
                .font(.headline)
            Text(currency(subtotal))
                .font(.title3.bold())
                .foregroundStyle(AppTheme.brand)
        }
        .padding(.top, 4)
    }

    private var noteCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 10) {
                AppSectionTitle(text: "تنويه الضريبة")
                TextField("نص التنويه", text: $note, axis: .vertical)
                    .lineLimit(2...4)
                    .padding(10)
                    .background(Color(.systemGray6), in: RoundedRectangle(cornerRadius: 10))
            }
        }
    }

    @ViewBuilder
    private var errorCard: some View {
        if let errorMsg {
            HStack(alignment: .top, spacing: 8) {
                Image(systemName: "exclamationmark.triangle.fill")
                Text(errorMsg).font(.footnote)
            }
            .foregroundStyle(.red)
            .padding(10)
            .frame(maxWidth: .infinity, alignment: .trailing)
            .background(Color.red.opacity(0.08), in: RoundedRectangle(cornerRadius: 10))
        }
    }

    private func loadCatalog() async {
        guard let bid = session.businessID else { return }
        catalog = (try? await session.client.listCatalog(businessID: bid)) ?? []
    }

    private func addFromCatalog(_ item: SupaClient.Row) {
        rows.append(ItemRow(
            desc: item["desc"] as? String ?? "",
            qtyText: numText(item["qty"]),
            priceText: numText(item["price"])
        ))
    }

    private var subtotal: Double {
        rows.reduce(0) { sum, row in
            row.cancelled ? sum : sum + qty(row.qtyText) * price(row.priceText)
        }
    }

    private func qty(_ text: String) -> Double {
        Double(text.replacingOccurrences(of: ",", with: ".")) ?? 0
    }
    private func price(_ text: String) -> Double {
        Double(text.replacingOccurrences(of: ",", with: ".")) ?? 0
    }
    private func num(_ value: Any?) -> Double {
        if let n = value as? NSNumber { return n.doubleValue }
        if let s = value as? String { return Double(s) ?? 0 }
        return 0
    }
    private func numText(_ value: Any?) -> String {
        let v = num(value)
        return v.truncatingRemainder(dividingBy: 1) == 0 ? String(Int(v)) : String(v)
    }

    private func save() async {
        busy = true
        defer { busy = false }
        guard let bid = session.businessID else { return }
        let items: [[String: Any]] = rows.map { row in
            [
                "desc": row.desc,
                "qty": qty(row.qtyText),
                "price": price(row.priceText),
                "cancelled": row.cancelled
            ]
        }
        let iso = ISO8601DateFormatter()
        let row: SupaClient.Row = [
            "id": UUID().uuidString,
            "business_id": bid,
            "number": number,
            "date": iso.string(from: issueDate),
            "dueDate": iso.string(from: dueDate),
            "clientName": clientName,
            "clientPhone": clientPhone,
            "clientEmail": clientEmail,
            "items": items,
            "status": status,
            "note": note,
            "createdAt": iso.string(from: Date())
        ]
        do {
            try await session.client.upsertInvoice(row)
            number = String(Int(Date().timeIntervalSince1970) % 100000)
            clientName = ""; clientPhone = ""; clientEmail = ""
            status = "unpaid"; note = ""; rows = [ItemRow()]
            showSaved = true
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private func currency(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencySymbol = "ر.س"
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}
