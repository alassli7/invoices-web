import SwiftUI

@main
struct InvoiceWebApp: App {

    var body: some Scene {
        WindowGroup {
            WebView(url: AppConfig.webAppURL)
                .ignoresSafeArea(.all)
                .environment(
                    \.layoutDirection,
                    .rightToLeft
                )
        }
    }
}
