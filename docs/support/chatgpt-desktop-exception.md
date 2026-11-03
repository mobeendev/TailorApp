# ChatGPT desktop floating-pet crash report

User-authorized report, prepared 2026-10-30. **Not submitted:** this session has no supported OpenAI feedback-submission tool. Submit the text below through ChatGPT's Help / support feedback flow, or OpenAI support at help.openai.com. Do not include unrelated shop records or private logs.

## Summary

ChatGPT desktop on macOS throws an uncaught Objective-C bridge exception while updating floating-pet controls after a display-change event. Browser automation transport subsequently became unavailable during a local web-app walkthrough. The temporal association was observed; causality is not established.

## Error supplied by the user

```
Uncaught Exception:
TypeError: Error converting argument 0 of setAcceptsMouseMovedEvents: (on NSKVONotifying_ChromeNodeNSPanel): Expected a number or bigint
at Proxy.methodFunc (file:///Applications/ChatGPT.app/Contents/Resources/app.asar/node_modules/objc-js/dist/index.js:237:54)
at r (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/main-UOTY8NmV.js:140:10894)
at Dpe (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/main-UOTY8NmV.js:140:11230)
at Tpe (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/main-UOTY8NmV.js:140:10162)
at Gpe.updateCssPetControlsProximityTracking (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/main-UOTY8NmV.js:140:43588)
at Gpe.applyLayout (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/main-UOTY8NmV.js:140:67951)
at Gpe.reclampWindowToVisibleDisplay (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/main-UOTY8NmV.js:140:59345)
at Screen.handleDisplayChanged (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/main-UOTY8NmV.js:140:57499)
at Screen.emit (node:events:526:24)
at e.emit (/Applications/ChatGPT.app/Contents/Resources/app.asar/.vite/build/bootstrap-BLyztc2V.js:5:7600)
```

Expected: window and pet relayout handles display changes without throwing. Actual: uncaught exception. Exact desktop app version, macOS version and reproducible trigger have not been established. No Tailor Master database reset was performed.
