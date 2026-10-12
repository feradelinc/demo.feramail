# Isolated SMTP capture

An SMTP sink is a developer test service, not Feradel's actual delivery provider. Run it locally, on the same machine/network as a separately configured nonproduction Email API. The app itself does not open SMTP connections except its isolated source qualification test.

```powershell
docker run --rm --name feramail-sink -p 127.0.0.1:1025:1025 -p 127.0.0.1:8025:8025 axllent/mailpit --smtp-auth-accept-any --smtp-auth-allow-insecure
```

Open the capture UI at http://127.0.0.1:8025. Authenticate to an expressly authorized nonproduction Email instance. Set `SMTP_SANDBOX=true` only with loopback Email upstream and empty PUBLIC_ORIGIN. Create a new session-prefixed configuration at `127.0.0.1:1025`, with deliberately supplied synthetic-only username/password. Port 1025 selects plaintext locally; persisted secure does not override source transport. The sandbox exception is never enabled for a remote upstream or hosted Studio.

Actual API-backed test sends also need `SEND_ENABLED=true`, exact `SEND_ACCOUNTS=instanceUUID:userUUID`, `RECIPIENT_ALLOWLIST` for the test address, and either an explicitly approved `SEND_CONFIGURATIONS` name or a profile created in the current session. All To/CC/BCC recipients must be allowlisted. Preview and configuration saves still never submit a message. Click Prepare recipient confirmation, review, type the exact supplied SEND string, then separately click Send Email.

The normal source qualification test uses actual Nodemailer and pinned send-service code with an ephemeral in-memory loopback SMTP socket. All authentication, model and audit dependencies are explicit fixtures. It captures synthetic MIME with PDF/CID attachments and opt-out footer, never relays it, never loads production credentials, and destroys the socket after the test. This verifies local SMTP submission mechanics; it does not prove live FerAuth/product authorization, a real provider, exact FeraRender output or final delivery.

`npm run smoke` refuses without `SMOKE_NONPRODUCTION=true`, authorized instance and test credentials. `SMOKE_ALLOW_SEND=true` is a separate gate and additionally requires verified `SMOKE_RECIPIENT`, approved `SMOKE_CONFIGURATION`, and the send policy. Cleanup defaults to false and deletes only recorded session-created resources. Never point a sandbox demonstration at live provider credentials or an unverified recipient.
