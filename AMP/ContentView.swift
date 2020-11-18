//
//  ContentView.swift
//  AMP
//
//  Created by Adam on 9/19/20.
//

import SwiftUI

struct ContentView: View {
  var body: some View {
    VStack{
      Text("AMP")
        .font(.title)
        .fontWeight(.heavy)
      Text("Beta 1.0.0")
        .font(.subheadline)
        .fontWeight(.light)
      Button("Quit", action: {
        NSApplication.shared.terminate(.none)
      }).padding()
    }.frame(maxWidth: .infinity, maxHeight: .infinity)
  }
}

struct ContentView_Previews: PreviewProvider {
  static var previews: some View {
    ContentView()
  }
}
