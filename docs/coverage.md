# Operation coverage

Generated from exact audited router registrations; candidate OpenAPI is metadata, not deployment proof.

|Method|Route|Permission|Status|
|---|---|---|---|
|POST|`/api/v1/configurations`|EDIT.CONFIGURATION|Executable|
|GET|`/api/v1/configurations`|VIEW.CONFIGURATION|Executable|
|GET|`/api/v1/configurations/n/{name}`|VIEW.CONFIGURATION|Executable|
|DELETE|`/api/v1/configurations/{uuid}`|EDIT.CONFIGURATION|Executable|
|POST|`/api/v1/templates`|EDIT.TEMPLATE|Executable|
|POST|`/api/v1/templates/r/i/{uuid}`|EDIT.TEMPLATE|Executable|
|GET|`/api/v1/templates/n/{named}/o/{owner}/f/{fields}`|VIEW.TEMPLATE|Executable|
|GET|`/api/v1/templates/g`|VIEW.TEMPLATE|Executable|
|GET|`/api/v1/templates`|VIEW.TEMPLATE|Executable|
|GET|`/api/v1/templates/{uuid}`|VIEW.TEMPLATE|Executable|
|DELETE|`/api/v1/templates/{uuid}`|EDIT.TEMPLATE|Executable|
|POST|`/api/v1/send`|CAN.SEND|Executable|
|GET|`/api/v1/send/preflight`|CAN.SEND|Qualified read helper; profile-gated|
|GET|`/api/v1/send/operations/{operationId}`|CAN.SEND|Qualified read helper; profile-gated|
|POST|`/api/v1/internal/provisioning/license-product`|Privileged HMAC signed event|Documentation only|
|POST|`/api/v1/internal/settings/license-product`|Privileged HMAC signed event|Documentation only|
|POST|`/api/v1/internal/deprovisioning/license-product`|Privileged HMAC signed event|Documentation only|
|POST|`/api/v1/internal/lifecycle/license-product`|Privileged HMAC signed event|Documentation only|
|POST|`/api/v1/internal/signature-owner/provision`|Internal authenticated provisioner; never public|Documentation only|

Candidate: 17 behaviors + 16 aliases = 33 callable contracts. Main: 12 public + 4 internal behaviors. Qualified release: 14 public + 5 internal; baseline alias registrations repeated under /api are excluded from execution. Health is supplemental.
