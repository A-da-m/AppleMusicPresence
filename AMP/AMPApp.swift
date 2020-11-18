//
//  AMPApp.swift
//  AMP
//
//  Created by Adam on 9/19/20.
//

import SwiftUI
import SwordRPC

class AppDelegate: NSObject, NSApplicationDelegate {
  private var rpc = SwordRPC(appId: "594174908263694403")
  var popover = NSPopover.init()
  var statusBarItem: NSStatusItem?
  
  @objc
  func updateTrack (notification: NSNotification) {
    print(notification)
    var presence = RichPresence()
    let playerState = String(describing: notification.userInfo!["Player State"] ?? "Unknown")
    presence.state = String(describing: notification.userInfo!["Artist"] ?? "Unknown")
    if playerState == "Playing" {
      presence.details = String(describing: notification.userInfo!["Name"] ?? "Unknown")
      let endsAt =  Double(String(describing: notification.userInfo!["Total Time"] ?? "0"))! / 1000
      presence.timestamps.start = Int(Date().timeIntervalSince1970)
      presence.timestamps.end = Int((Date() + endsAt).timeIntervalSince1970)
    } else {
      presence.details = "Paused: \(String(describing: notification.userInfo!["Name"] ?? "Unknown"))"
      presence.assets.smallImage = "pause"
      presence.assets.smallText = "Paused"
    }
    presence.assets.largeImage = "am"
    presence.assets.largeText = "Presence by Adаm#2917"
    
    rpc.setPresence(presence)
  }
  
  func applicationDidFinishLaunching(_ notification: Notification) {
    let contentView = ContentView()
    
    popover.behavior = .transient
    popover.animates = false
    popover.contentViewController = NSViewController()
    popover.contentViewController?.view = NSHostingView(rootView: contentView)
    statusBarItem = NSStatusBar.system.statusItem(withLength: NSStatusItem.variableLength)
    statusBarItem?.button?.title = "AMP"
    statusBarItem?.button?.action = #selector(AppDelegate.togglePopover(_:))
  
    let notificationCenter = DistributedNotificationCenter.default()
    rpc.onConnect { rp in
      notificationCenter.addObserver(self, selector: #selector(self.updateTrack), name: NSNotification.Name(rawValue: "com.apple.Music.playerInfo"), object: nil)
    }
    rpc.onDisconnect { _, _, _ in
      notificationCenter.removeObserver(self, name: NSNotification.Name(rawValue: "com.apple.Music.playerInfo"), object: nil)
    }
    rpc.connect()
  }
  
  @objc func showPopover(_ sender: AnyObject?) {
    if let button = statusBarItem?.button {
      popover.show(relativeTo: button.bounds, of: button, preferredEdge: NSRectEdge.minY)
    }
  }
  
  @objc func closePopover(_ sender: AnyObject?) {
    popover.performClose(sender)
  }
  @objc func togglePopover(_ sender: AnyObject?) {
    if popover.isShown {
      closePopover(sender)
    } else {
      showPopover(sender)
    }
  }
}

@main
struct AMPApp: App {
  @NSApplicationDelegateAdaptor(AppDelegate.self) var appDegelate
  
  var body: some Scene {
    Settings {
      Text("Empty")
    }
  }
}
