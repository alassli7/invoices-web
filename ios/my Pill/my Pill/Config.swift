import Foundation

struct AppConfig {

    // رابط تطبيق الويب المنشور
    static let webAppURL = URL(
        string: "https://alassli7.github.io/invoices-web/"
    )!

    // بناء رابط لقسم داخل تطبيق الويب
    static func url(for path: String) -> URL {
        var raw = webAppURL.absoluteString

        if !raw.hasSuffix("/") {
            raw += "/"
        }

        let hash = path.hasPrefix("/")
            ? String(path.dropFirst())
            : path

        return URL(string: raw + "#/" + hash)!
    }

    // MARK: - Supabase

    static let supabaseURL =
        "https://ohwreqztjzkpgoihkvgb.supabase.co"

    static let supabaseAnonKey =
        "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9od3JlcXp0anprcGdvaWhrdmdiIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODc4MzczMzgsImV4cCI6MjEwMzQxMzMzOH0.D8q8tQO-8qhvOVhdi3GU8zChlP9niW9edx7LP0iWlqc"

    static let tableBusinesses = "businesses"
    static let tableInvoices = "invoices"
    static let tableCatalog = "catalog"

    static func restURL(
        _ table: String,
        query: String? = nil
    ) -> URL? {

        guard let baseURL = URL(
            string: "\(supabaseURL)/rest/v1/\(table)"
        ) else {
            return nil
        }

        guard let query else {
            return baseURL
        }

        var components = URLComponents(
            url: baseURL,
            resolvingAgainstBaseURL: false
        )

        components?.queryItems = query
            .split(separator: "&")
            .map { item in

                let parts = item.split(
                    separator: "=",
                    maxSplits: 1
                )

                return URLQueryItem(
                    name: String(parts[0]),
                    value: parts.count > 1
                        ? String(parts[1])
                        : nil
                )
            }

        return components?.url
    }
}
