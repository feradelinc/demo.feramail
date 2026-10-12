# Inspectable examples

`email.http` covers every baseline canonical method/path and the two profile-gated read helpers, with a second template-send example on the same `/api/v1/send` route. Internal routes and compatibility aliases have no execution recipes. `operation-payloads.json` records audited headers, input fields, outputs and errors.

Copy `data.xml`, `welcome-template.json`, `raw-email.json` and `template-email.json` into the corresponding source editors. All identities/documents are fictional. Replace placeholders only with operator-approved nonproduction configuration and a verified recipient. Direct examples bypass the Studio's confirmation layer: review before explicitly running a send. Provider acceptance is not final inbox delivery, and retrying can duplicate a message.

`email.js` builds PDF/CID attachment bytes from the repository's synthetic assets; it does not give Nodemailer a path or URL. `email.curl` uses an in-memory environment token and a reviewed payload file. No password, key or JWT value is provided. Keep credential-bearing payload files outside the repository.
