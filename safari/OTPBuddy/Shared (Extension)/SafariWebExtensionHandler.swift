//
//  SafariWebExtensionHandler.swift
//  Shared (Extension)
//
//  Created by nameless on 6. 2. 2026..
//

import AuthenticationServices
import SafariServices
import os.log

// Same as associated URL type in main app Info.plist
private let oauthCallbackScheme = "com.elcaten.otpbuddy"

class SafariWebExtensionHandler: NSObject, NSExtensionRequestHandling {

    func beginRequest(with context: NSExtensionContext) {
        let request = context.inputItems.first as? NSExtensionItem

        let profile: UUID?
        if #available(iOS 17.0, macOS 14.0, *) {
            profile = request?.userInfo?[SFExtensionProfileKey] as? UUID
        } else {
            profile = request?.userInfo?["profile"] as? UUID
        }

        let message: Any?
        if #available(iOS 15.0, macOS 11.0, *) {
            message = request?.userInfo?[SFExtensionMessageKey]
        } else {
            message = request?.userInfo?["message"]
        }

        os_log(.default, "Received message from browser.runtime.sendNativeMessage: %@ (profile: %@)", String(describing: message), profile?.uuidString ?? "none")

        // OAuth: type == "oauth" and authURL present -> run ASWebAuthenticationSession and return redirect URL
        if let dict = message as? [String: Any],
           dict["type"] as? String == "oauth",
           let authURLString = dict["authURL"] as? String,
           let url = URL(string: authURLString) {
            os_log(.default, "Running OAuth session with URL: %@", String(describing: url))
            runOAuthSession(authURL: url, context: context)
            return
        }

        // Default: echo response for other message types
        let response = NSExtensionItem()
        if #available(iOS 15.0, macOS 11.0, *) {
            response.userInfo = [SFExtensionMessageKey: ["echo": message as Any]]
        } else {
            response.userInfo = ["message": ["echo": message as Any]]
        }
        context.completeRequest(returningItems: [response], completionHandler: nil)
    }

    private func runOAuthSession(authURL: URL, context: NSExtensionContext) {
        let session = ASWebAuthenticationSession(
            url: authURL,
            callbackURLScheme: oauthCallbackScheme
        ) { [weak context] callbackURL, error in
            guard let context = context else { return }
            let response = NSExtensionItem()
            let responsePayload: [String: Any]
            if let error = error {
                let nsError = error as NSError
                // ASWebAuthenticationSessionErrorCode.canceledLogin has raw value 1
                if nsError.domain == "ASWebAuthenticationSessionErrorDomain", nsError.code == 1 {
                    responsePayload = ["error": "User cancelled the sign in flow."]
                } else {
                    responsePayload = ["error": nsError.localizedDescription]
                }
            } else if let callbackURL = callbackURL {
                responsePayload = ["redirectURL": callbackURL.absoluteString]
            } else {
                responsePayload = ["error": "No callback URL received."]
            }
            if #available(iOS 15.0, macOS 11.0, *) {
                response.userInfo = [SFExtensionMessageKey: responsePayload]
            } else {
                response.userInfo = ["message": responsePayload]
            }
            context.completeRequest(returningItems: [response], completionHandler: nil)
        }
        #if os(macOS)
        session.presentationContextProvider = self
        #endif
        session.start()
    }
}

#if os(macOS)
extension SafariWebExtensionHandler: ASWebAuthenticationPresentationContextProviding {
    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        NSApplication.shared.keyWindow ?? NSApplication.shared.windows.first { $0.isVisible } ?? NSWindow()
    }
}
#endif
