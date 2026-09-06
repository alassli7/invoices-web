//
//  Item.swift
//  my Pill
//
//  Created by abdullah alsadoun on 28/08/2026.
//

import Foundation
import SwiftData

@Model
final class Item {
    var timestamp: Date
    
    init(timestamp: Date) {
        self.timestamp = timestamp
    }
}
