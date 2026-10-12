# FeraEmail Studio qualification — 2026-10-11

The standalone Studio is qualified for local use and repository merge. No public hosting, production Email changes, live SMTP credentials or real-recipient delivery were performed. Matters API source and configuration were not changed.

## Evidence and boundaries

|Check|Result|Boundary|
|---|---|---|
|Canonical source audit|Passed: 12 baseline public, 2 optional qualified read helpers, 5 internal documentation-only|Immutable main, candidate and qualified-release snapshots; SHA validation|
|Node qualification|23 passed, no failures or skips in this workspace|Isolated HTTP fixtures, source functions and actual SMTP sink|
|Playwright Chromium|9 passed|Explicitly intercepted synthetic API sessions; real browser XML/XSLT and iframe rendering|
|Accessibility/responsiveness|Passed automated WCAG A/AA checks across all 12 workspaces, light/dark and 320/390/768 widths|Email iframe contents excluded from axe because of opaque sandbox origin; preview security/content checked separately|
|SMTP transport|Two captured synthetic messages; actual Nodemailer 6.10.1|Ephemeral loopback sink never relays; PDF attachment, CID image, raw submission and footer duplication checked|
|PDF artifact|Valid one-page fictional invoice; rendered and visually inspected|No customer information|
|Build and launch|Vite production build passed; development and built loopback launch passed|No upstream calls during launch check|
|Application production dependencies|npm audit --omit=dev: zero vulnerabilities|Does not certify neighboring legacy backend dependencies|
|Backend correction branch|28 backend tests passed|Includes existing signed-service owner authorization and legacy invoice delivery tests|
|Opt-in live smoke gate|Refused without explicit nonproduction configuration|No API call or send occurred|
|Authenticated live Auth/Email qualification|Not run|No authorized live account or SMTP credentials supplied|
|Remote FeraRender qualification|Not run|Integration implemented but disabled without an explicitly allowed service origin|
|Public deployment|Not performed|Separate authorization required by the brief|

Browser previews use actual XSLT 1.0 and source-supported subject/body wrappers, but are labeled an approximation of backend FeraRender. Tests verify loops, conditionals, escaped XML, invalid XML, isolated scripts/tracking and preview-without-send behavior. SMTP acceptance means provider submission only; final inbox delivery is never claimed.

The [SMTP evidence](smtp-sandbox-qualification.json) records the transport capture. Screenshots are labeled intercepted test fixtures. A standalone clone lacking the neighboring Email backend's Nodemailer installation skips that optional source transport test rather than fabricating its result.

## Protection of existing integrations

The Studio has fixed approved API destinations and explicitly rejects Matters destinations. Writes are limited to resources created in the current Studio session. Owner scope derives from the authenticated session. Sending requires an operator-approved account, recipient and SMTP configuration, a payload/profile/template-bound challenge, exact typed recipient confirmation, and bounded attempts; ambiguous results never retry automatically.

Qualified Email owner middleware was retained. The candidate's different owner logic was not adopted. Two narrow corrections—preserving omitted SMTP passwords and honoring template field projection—are isolated in [backend draft PR #2](https://github.com/feradelinc/feradel.email.api/pull/2), unmerged and undeployed. The Studio compensates for current behavior with complete updates and explicit password replacement.

See [coverage](coverage.md) for the operation matrix, [source findings](backend-discrepancies.md) for remaining discrepancies, [sandbox policy](sandbox.md), and [optional hosting requirements](hosting.md). In-memory sessions and send limits require a separate hosting review before multi-instance deployment.
