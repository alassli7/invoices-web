//
//  ContentView.swift
//  my Pill
//
//  Created by abdullah alsadoun on 28/08/2026.
//

import SwiftUI

struct MainTabView: View {

    @State private var selectedTab = 0

    private let appGreen = Color(
        red: 0.12,
        green: 0.43,
        blue: 0.33
    )

    init() {
        let appearance = UITabBarAppearance()
        appearance.configureWithDefaultBackground()

        appearance.backgroundColor = UIColor.systemBackground
        appearance.shadowColor = UIColor.separator

        UITabBar.appearance().standardAppearance = appearance
        UITabBar.appearance().scrollEdgeAppearance = appearance
    }

    var body: some View {
        TabView(selection: $selectedTab) {
            Tab("الحسابات", systemImage: "doc.text.fill", value: 0) {
                AccountsView()
            }

            Tab("فاتورة جديدة", systemImage: "plus.circle.fill", value: 1) {
                NewInvoiceView()
            }

            Tab("الأصناف", systemImage: "tag.fill", value: 2) {
                CatalogView()
            }

            Tab(value: 3) {
                InvoicePreviewView(invoice: [:], profile: [:])
            }

            Tab("الإعدادات", systemImage: "gearshape.fill", value: 4) {
                SettingsView()
            }
        }
        .environment(\.layoutDirection, .rightToLeft)
        .tint(appGreen)
    }
}
