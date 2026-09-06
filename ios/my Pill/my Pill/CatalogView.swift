import SwiftUI
import SwiftData

struct CatalogView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var items: [SupaClient.Row] = []
    @State private var loading = true
    @State private var errorMsg: String?

    @State private var desc = ""
    @State private var priceText = ""
    @State private var qtyText = "1"
    @State private var editingID: String?

    var body: some View {
        NavigationStack {
            AppScreen {
                ScrollView {
                    VStack(spacing: 16) {
                        AppGlassHeader(
                            title: "الأصناف",
                            subtitle: "أصناف وخدمات جاهزة للاستخدام في الفواتير",
                            icon: "shippingbox.fill"
                        )
                        formCard
                        listSection
                    }
                    .padding()
                }
                .refreshable { await load() }
            }
            .navigationTitle("الأصناف")
            .navigationBarTitleDisplayMode(.inline)
            .toolbarBackground(.visible, for: .navigationBar)
            .toolbarBackground(.white.opacity(0.72), for: .navigationBar)
            .toolbar {
                ToolbarItem(placement: .topBarTrailing) {
                    Button {
                        Task { await seedDefaults() }
                    } label: {
                        Label("الأصناف الافتراضية", systemImage: "sparkles")
                    }
                }
            }
        }
        .task { await load() }
    }

    private let defaultServices: [(String, Double)] = [
        ("برمجة تطبيقات", 0),
        ("صيانة تطبيقات", 0),
        ("برمجة شبكات", 0),
        ("صيانة شبكات", 0),
        ("دعم فني", 0),
        ("إعداد أنظمة وتهيئة", 0)
    ]

    private func seedDefaults() async {
        guard let bid = session.businessID else { return }
        let existing = Set(items.compactMap { ($0["desc"] as? String)?.trimmingCharacters(in: .whitespacesAndNewlines) })
        var added = 0
        for (name, price) in defaultServices {
            guard !existing.contains(name) else { continue }
            let row: SupaClient.Row = [
                "id": UUID().uuidString,
                "business_id": bid,
                "desc": name,
                "price": price,
                "qty": 1,
                "createdAt": ISO8601DateFormatter().string(from: Date())
            ]
            do {
                try await session.client.upsertCatalogItem(row)
                added += 1
            } catch {
                errorMsg = errorMessage(error)
            }
        }
        await load()
        if added > 0 {
            errorMsg = nil
        }
    }


    private var formCard: some View {
        AppCard {
            VStack(alignment: .trailing, spacing: 14) {
                AppSectionTitle(text: editingID == nil ? "صنف جديد" : "تعديل صنف")
                AppField(icon: "tag.fill", placeholder: "اسم الصنف / الخدمة", text: $desc)
                AppField(icon: "banknote", placeholder: "السعر (ريال)", text: $priceText, keyboard: .decimalPad)
                AppField(icon: "number", placeholder: "الكمية الافتراضية", text: $qtyText, keyboard: .decimalPad)
                HStack(spacing: 12) {
                    Spacer()
                    Button("إلغاء") { reset() }
                        .buttonStyle(.bordered)
                        .tint(AppTheme.brand)
                    AppPrimaryButton(
                        title: editingID == nil ? "حفظ الصنف" : "حفظ التعديل",
                        icon: "checkmark.circle.fill",
                        disabled: desc.trimmingCharacters(in: .whitespaces).isEmpty
                    ) {
                        Task { await save() }
                    }
                    .frame(maxWidth: 200)
                }
            }
        }
    }

    private var listSection: some View {
        VStack(alignment: .trailing, spacing: 12) {
            AppSectionTitle(text: "الأصناف المحفوظة")
            if loading {
                ProgressView().frame(maxWidth: .infinity).padding(.top, 20)
            } else if items.isEmpty {
                Text("لا توجد أصناف محفوظة بعد.")
                    .foregroundStyle(.secondary)
                    .font(.subheadline)
                    .frame(maxWidth: .infinity)
                    .padding(.vertical, 24)
            } else {
                ForEach(items.indices, id: \.self) { index in
                    row(for: items[index])
                }
            }

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
    }

    private func row(for item: SupaClient.Row) -> some View {
        AppCard {
            HStack {
                VStack(alignment: .leading, spacing: 3) {
                    Text(item["desc"] as? String ?? "-")
                        .font(.headline)
                        .foregroundStyle(AppTheme.dark)
                    HStack(spacing: 6) {
                        Image(systemName: "banknote")
                            .foregroundStyle(AppTheme.brand)
                        Text("\(currency(num(item["price"])))")
                    }
                    .font(.caption)
                    .foregroundStyle(.secondary)
                }
                Spacer()
                VStack(spacing: 8) {
                    Button("تعديل") { edit(item) }
                        .buttonStyle(.bordered)
                        .tint(AppTheme.brand)
                    Button("حذف", role: .destructive) {
                        Task { await delete(item) }
                    }
                    .buttonStyle(.bordered)
                }
            }
        }
    }

    private func load() async {
        loading = true
        errorMsg = nil
        defer { loading = false }
        guard let bid = session.businessID else { return }
        do {
            items = try await session.client.listCatalog(businessID: bid)
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private func edit(_ item: SupaClient.Row) {
        editingID = item["id"] as? String
        desc = item["desc"] as? String ?? ""
        priceText = numText(item["price"])
        qtyText = numText(item["qty"])
    }

    private func save() async {
        guard !desc.trimmingCharacters(in: .whitespaces).isEmpty,
              let bid = session.businessID else { return }
        let price = Double(priceText.replacingOccurrences(of: ",", with: ".")) ?? 0
        let qty = Double(qtyText.replacingOccurrences(of: ",", with: ".")) ?? 1
        var row: SupaClient.Row = [
            "business_id": bid,
            "desc": desc.trimmingCharacters(in: .whitespaces),
            "price": price,
            "qty": qty
        ]
        if let editingID {
            row["id"] = editingID
        } else {
            row["id"] = UUID().uuidString
            row["createdAt"] = ISO8601DateFormatter().string(from: Date())
        }
        do {
            try await session.client.upsertCatalogItem(row)
            reset()
            await load()
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private func delete(_ item: SupaClient.Row) async {
        guard let id = item["id"] as? String else { return }
        do {
            try await session.client.deleteCatalogItem(id: id)
            if editingID == id { reset() }
            await load()
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private func reset() {
        editingID = nil
        desc = ""
        priceText = ""
        qtyText = "1"
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
    private func currency(_ value: Double) -> String {
        let f = NumberFormatter()
        f.numberStyle = .currency
        f.currencySymbol = "ر.س"
        return f.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}
