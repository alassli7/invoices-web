import SwiftUI
import SwiftData

struct AccountsView: View {
    @EnvironmentObject private var session: SessionStore

    @State private var invoices: [SupaClient.Row] = []
    @State private var loading = true
    @State private var errorMsg: String?
    @State private var preview: SupaClient.Row?
    @State private var printInvoice: SupaClient.Row?
    @State private var business: SupaClient.Row?
    @State private var showPreview = false
    @State private var showPrint = false

    private func subtotal(_ row: SupaClient.Row) -> Double {
        (row["items"] as? [[String: Any]])?.reduce(0) { sum, it in
            let cancelled = it["cancelled"] as? Bool ?? false
            if cancelled { return sum }
            let qty = Double("\(it["qty"] ?? "0")") ?? 0
            let price = Double("\(it["price"] ?? "0")") ?? 0
            return sum + qty * price
        } ?? 0
    }

    private var total: Double { invoices.reduce(0) { $0 + subtotal($1) } }
    private var paid: Double {
        invoices.filter { ($0["status"] as? String) == "paid" }
            .reduce(0) { $0 + subtotal($1) }
    }
    private var unpaid: Double { total - paid }

    var body: some View {
        NavigationStack {
            AppScreen {
                Group {
                    if loading {
                        ProgressView("جارٍ التحميل…")
                    } else if let errorMsg {
                        ContentUnavailableView("خطأ", systemImage: "exclamationmark.triangle",
                                               description: Text(errorMsg))
                    } else {
                        ScrollView {
                            VStack(spacing: 16) {
                                AppGlassHeader(
                                    title: "الحسابات",
                                    subtitle: "ملخّص الإيرادات والفواتير",
                                    icon: "dollarsign.circle.fill"
                                )
                                statsGrid
                                invoiceList
                            }
                            .padding()
                        }
                        .refreshable { await load() }
                    }
                }
                .navigationTitle("الحسابات")
                .navigationBarTitleDisplayMode(.inline)
                .toolbarBackground(.visible, for: .navigationBar)
                .toolbarBackground(.white.opacity(0.72), for: .navigationBar)
                .toolbar {
                    ToolbarItem(placement: .topBarTrailing) {
                        Button {
                            Task { await load() }
                        } label: {
                            Image(systemName: "arrow.clockwise")
                        }
                    }
                    ToolbarItem(placement: .topBarLeading) {
                        Button("خروج", role: .destructive) { session.logout() }
                    }
                }
                .sheet(isPresented: $showPreview) {
                    if let preview {
                        InvoicePreviewView(invoice: preview, profile: business)
                    }
                }
                .sheet(isPresented: $showPrint) {
                    if let printInvoice {
                        ReceiptPrintView(invoice: printInvoice, profile: business)
                    }
                }
            }
        }
        .onAppear { Task { await load() } }
    }

    private func load() async {
        loading = true
        errorMsg = nil
        defer { loading = false }
        guard let bid = session.businessID else {
            errorMsg = "لا توجد جلسة"
            return
        }
        do {
            invoices = try await session.client.listInvoices(businessID: bid)
            if let biz = try await session.client.getBusiness(id: bid) {
                business = biz
            }
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private var statsGrid: some View {
        LazyVGrid(
            columns: [GridItem(.flexible()), GridItem(.flexible())],
            spacing: 12
        ) {
            statCard(title: "إجمالي الإيرادات", value: currency(total), color: AppTheme.brand)
            statCard(title: "المحصلة (مدفوعة)", value: currency(paid), color: AppTheme.brandLight)
            statCard(title: "المستحقة", value: currency(unpaid), color: .red)
            statCard(title: "عدد الفواتير", value: "\(invoices.count)", color: AppTheme.gold)
        }
    }

    private func statCard(title: String, value: String, color: Color) -> some View {
        VStack(alignment: .trailing, spacing: 8) {
            Text(title)
                .font(.footnote)
                .foregroundStyle(.secondary)
            Text(value)
                .font(.title3.bold())
                .foregroundStyle(color)
                .lineLimit(1)
                .minimumScaleFactor(0.6)
        }
        .frame(maxWidth: .infinity, alignment: .trailing)
        .padding()
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.10), radius: 12, y: 6)
    }

    @ViewBuilder
    private var invoiceList: some View {
        if invoices.isEmpty {
            Text("لا توجد فواتير بعد. أنشئ فاتورة من «فاتورة جديدة».")
                .foregroundStyle(.secondary)
                .frame(maxWidth: .infinity)
                .padding(.vertical, 40)
        } else {
            ForEach(invoices.indices, id: \.self) { index in
                row(for: invoices[index])
            }
        }
    }

    private func row(for invoice: SupaClient.Row) -> some View {
        VStack(alignment: .trailing, spacing: 8) {
            HStack {
                Text(invoice["number"] as? String ?? "-")
                    .font(.headline)
                    .foregroundStyle(AppTheme.dark)
                Spacer()
                statusPill(status: invoice["status"] as? String)
            }
            if let client = invoice["clientName"] as? String, !client.isEmpty {
                Text(client)
                    .font(.subheadline)
                    .foregroundStyle(.secondary)
                    .frame(maxWidth: .infinity, alignment: .trailing)
            }
            HStack {
                Text(dateLabel(invoice["date"] as? String))
                    .font(.caption)
                    .foregroundStyle(.secondary)
                Spacer()
                Text(currency(subtotal(invoice)))
                    .font(.subheadline.bold())
                    .foregroundStyle(AppTheme.brand)
            }
            HStack(spacing: 8) {
                Button {
                    preview = invoice
                    showPreview = true
                } label: {
                    Label("عرض", systemImage: "eye")
                }
                .buttonStyle(.bordered)
                Button {
                    printInvoice = invoice
                    showPrint = true
                } label: {
                    Label("طبع حراري", systemImage: "printer.fill")
                }
                .buttonStyle(.bordered)
                .tint(AppTheme.dark)
                .tint(AppTheme.brand)
                Button(togglePaidLabel(invoice["status"] as? String)) {
                    Task { await toggleStatus(invoice, status: invoice["status"] as? String == "paid" ? "unpaid" : "paid") }
                }
                .buttonStyle(.bordered)
                .tint(AppTheme.brand)
                Button(toggleRefundLabel(invoice["status"] as? String)) {
                    Task { await toggleStatus(invoice, status: invoice["status"] as? String == "refunded" ? "unpaid" : "refunded") }
                }
                .buttonStyle(.bordered)
                .tint(AppTheme.gold)
                Button("حذف", role: .destructive) {
                    Task { await remove(invoice) }
                }
                .buttonStyle(.bordered)
            }
            .font(.caption)
            .padding(.top, 2)
        }
        .padding()
        .background(.white, in: RoundedRectangle(cornerRadius: 16))
        .shadow(color: .black.opacity(0.10), radius: 12, y: 6)
    }

    private func toggleStatus(_ invoice: SupaClient.Row, status: String) async {
        guard invoice["id"] != nil else { return }
        var updated = invoice
        updated["status"] = status
        do {
            try await session.client.upsertInvoice(updated)
            await load()
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private func remove(_ invoice: SupaClient.Row) async {
        guard let id = invoice["id"] as? String else { return }
        do {
            try await session.client.deleteInvoice(id: id)
            await load()
        } catch {
            errorMsg = errorMessage(error)
        }
    }

    private func statusPill(status: String?) -> some View {
        let paid = status == "paid"
        let refunded = status == "refunded"
        let label = paid ? "مدفوعة" : (refunded ? "مُلغاة" : "مستحقة")
        let color: Color = paid ? AppTheme.brand : (refunded ? .gray : .red)
        return Text(label)
            .font(.caption.bold())
            .padding(.horizontal, 10)
            .padding(.vertical, 4)
            .background(color.opacity(0.15), in: Capsule())
            .foregroundStyle(color)
            .environment(\.layoutDirection, .rightToLeft)
    }

    private func togglePaidLabel(_ status: String?) -> String {
        status == "paid" ? "إلغاء الدفع" : "تحديد مدفوعة"
            
    }
    private func toggleRefundLabel(_ status: String?) -> String {
        status == "refunded" ? "تراجع عن الإلغاء" : "إلغاء / استرجاع"
    }

    private func dateLabel(_ iso: String?) -> String {
        guard let iso else { return "-" }
        let f = ISO8601DateFormatter()
        if let d = f.date(from: iso) {
            return d.formatted(date: .abbreviated, time: .omitted)
        }
        return iso
    }

    private func currency(_ value: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencySymbol = "ر.س"
        return formatter.string(from: NSNumber(value: value)) ?? "\(value)"
    }
}
