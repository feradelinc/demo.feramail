# Optional hosting requirements

This task does not authorize deployment to a public server, production Email changes or live SMTP credential provisioning. No hosting deployment was performed. Existing Calendar hosting remains separate.

The implementation is ready for separately qualified hosting: loopback binding, exact HTTPS PUBLIC_ORIGIN, loopback-only proxy trust, Secure/HttpOnly/SameSite cookies, bounded transient sessions, login/request throttling, fixed HTTPS upstream allowlists, strict send account/recipient/SMTP policy and a separate rollback path. Do not simply expose the local port.

A later deployment must define an exact hostname, host, dedicated runtime user/service, immutable source/build artifact, certificate/renewal, reverse-proxy forwarding-header overwrite, memory limits, health checks and rollback. Keep changes independent of the managed API fleet and Matters configuration. Optional FeraRender must be expressly authorized and separately allowlisted.

Sending should remain disabled until the exact authorized accounts, verified recipients, SMTP destinations and approved profiles are recorded outside the browser. Local sandbox exemptions must never apply to hosting. TLS certificates/host allowlists do not constitute recipient verification. Monitor send limits, uncertain outcomes and credential handling; no automated retries or live qualification sends should be added during a general deployment/audit.
