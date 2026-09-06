import Foundation
import CommonCrypto

/// عميل Supabase بسيط (REST) بلا اعتماديات خارجية.
/// يطابق سلوك lib/storage.js في تطبيق الويب.
enum SupaError: LocalizedError {
    case invalidURL
    case server(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL: return "رابط غير صالح"
        case .server(let m): return m
        }
    }
}

struct SupaClient {
    /// كائن يجسّد صفاً من قاعدة البيانات.
    typealias Row = [String: Any]

    private let url = AppConfig.supabaseURL
    private let anonKey = AppConfig.supabaseAnonKey

    private var headers: [String: String] {
        [
            "apikey": anonKey,
            "Authorization": "Bearer \(anonKey)",
            "Content-Type": "application/json",
            // "resolution=merge-duplicates" يُفعّل سلوك UPSERT مع on_conflict (وإلا يحدث 23505).
            "Prefer": "resolution=merge-duplicates,return=representation"
        ]
    }

    struct Response {
        var data: Data
        var status: Int
        var dict: Row? { (try? JSONSerialization.jsonObject(with: data)) as? Row }
        var array: [Row]? { (try? JSONSerialization.jsonObject(with: data)) as? [Row] }
        var json: Any? { try? JSONSerialization.jsonObject(with: data) }
    }

    // MARK: - HTTP

    private func request(_ method: String,
                         _ path: String,
                         query: String? = nil,
                         body: Row? = nil) async throws -> Response {
        guard var comps = URLComponents(string: url + "/rest/v1/" + path) else {
            throw SupaError.invalidURL
        }
        if let query {
            comps.queryItems = query.split(separator: "&").map {
                let parts = $0.split(separator: "=", maxSplits: 1)
                return URLQueryItem(
                    name: String(parts[0]),
                    value: parts.count > 1 ? String(parts[1]) : nil
                )
            }
        }
        guard let finalURL = comps.url else { throw SupaError.invalidURL }

        var req = URLRequest(url: finalURL)
        req.httpMethod = method
        req.allHTTPHeaderFields = headers
        req.timeoutInterval = 20
        if let body {
            do {
                req.httpBody = try JSONSerialization.data(withJSONObject: body)
            } catch {
                throw SupaError.server("تعذّر ترميز البيانات")
            }
        }

        let (data, resp) = try await URLSession.shared.data(for: req)
        let status = (resp as? HTTPURLResponse)?.statusCode ?? 0
        if status >= 400 {
            let msg = String(data: data, encoding: .utf8) ?? "خطأ في الخادم"
            throw SupaError.server(msg)
        }
        return Response(data: data, status: status)
    }

    // MARK: - Businesses

    /// تسجيل نشاط جديد. يُرجع id النشاط، ويرمي خطأ إن كان الاسم مستخدماً.
    func register(username: String,
                  password: String,
                  businessName: String,
                  docType: String,
                  docNumber: String,
                  isAdmin: Bool = false) async throws -> String {
        let id = UUID().uuidString
        let row: Row = [
            "id": id,
            "username": username,
            "password_hash": Self.sha256(password),
            "businessName": businessName,
            "docType": docType,
            "docNumber": docNumber,
            "isAdmin": isAdmin,
            "bankName": "الراجحي أعمال",
            "accountName": "عبدالله خليفه السعدون"
        ]
        do {
            _ = try await request("POST", AppConfig.tableBusinesses,
                                  query: "on_conflict=id", body: row)
        } catch let SupaError.server(msg) where msg.contains("duplicate") || msg.contains("23505") {
            throw SupaError.server("اسم المستخدم موجود مسبقاً")
        }
        return id
    }

    /// تسجيل الدخول. يُرجع id النشاط أو nil إذا كان الاسم/كلمة المرور غير صحيحة.
    func login(username: String, password: String) async throws -> String? {
        let hash = Self.sha256(password)
        let query = "username=eq.\(enc(username))&select=*"
        let resp = try await request("GET", AppConfig.tableBusinesses, query: query)
        guard let biz = resp.array?.first else { return nil }
        guard (biz["password_hash"] as? String) == hash else { return nil }
        return biz["id"] as? String
    }

    func getBusiness(id: String) async throws -> Row? {
        let query = "id=eq.\(enc(id))&select=*"
        let resp = try await request("GET", AppConfig.tableBusinesses, query: query)
        return resp.array?.first
    }

    func upsertBusiness(_ row: Row) async throws {
        _ = try await request("POST", AppConfig.tableBusinesses,
                              query: "on_conflict=id", body: row)
    }

    /// تغيير كلمة المرور لنشاط (يتحقق من كلمة المرور الحالية أولاً).
    func changePassword(businessID: String, currentPassword: String, newPassword: String) async throws {
        guard let biz = try await getBusiness(id: businessID) else {
            throw SupaError.server("النشاط غير موجود")
        }
        guard (biz["password_hash"] as? String) == Self.sha256(currentPassword) else {
            throw SupaError.server("كلمة المرور الحالية غير صحيحة")
        }
        let row: Row = ["id": businessID, "password_hash": Self.sha256(newPassword)]
        try await upsertBusiness(row)
    }

    // MARK: - Invoices

    func listInvoices(businessID: String) async throws -> [Row] {
        let query = "business_id=eq.\(enc(businessID))&order=createdAt.desc&select=*"
        let resp = try await request("GET", AppConfig.tableInvoices, query: query)
        return resp.array ?? []
    }

    func getInvoice(id: String) async throws -> Row? {
        let query = "id=eq.\(enc(id))&select=*"
        let resp = try await request("GET", AppConfig.tableInvoices, query: query)
        return resp.array?.first
    }

    func upsertInvoice(_ row: Row) async throws {
        _ = try await request("POST", AppConfig.tableInvoices,
                              query: "on_conflict=id", body: row)
    }

    func deleteInvoice(id: String) async throws {
        let query = "id=eq.\(enc(id))"
        _ = try await request("DELETE", AppConfig.tableInvoices, query: query)
    }

    // MARK: - Catalog

    func listCatalog(businessID: String) async throws -> [Row] {
        let query = "business_id=eq.\(enc(businessID))&order=createdAt.desc&select=*"
        let resp = try await request("GET", AppConfig.tableCatalog, query: query)
        return resp.array ?? []
    }

    func upsertCatalogItem(_ row: Row) async throws {
        _ = try await request("POST", AppConfig.tableCatalog,
                              query: "on_conflict=id", body: row)
    }

    func deleteCatalogItem(id: String) async throws {
        let query = "id=eq.\(enc(id))"
        _ = try await request("DELETE", AppConfig.tableCatalog, query: query)
    }

    // MARK: - Helpers

    private func enc(_ s: String) -> String {
        // ترميز بسيط لقيم query (Supabase يتعامل مع معظمها، نستبدل وحدها ' و / بأمان)
        s.addingPercentEncoding(withAllowedCharacters: .urlQueryAllowed) ?? s
    }

    /// SHA-256 بصيغة hex (نفس تطبيق الويب).
    static func sha256(_ s: String) -> String {
        let data = Data(s.utf8)
        let digest = sha256Digest(data)
        return digest.map { String(format: "%02x", $0) }.joined()
    }

    private static func sha256Digest(_ data: Data) -> [UInt8] {
        var bytes = [UInt8](repeating: 0, count: Int(CC_SHA256_DIGEST_LENGTH))
        data.withUnsafeBytes { buf in
            _ = CC_SHA256(buf.baseAddress, CC_LONG(data.count), &bytes)
        }
        return bytes
    }
}
