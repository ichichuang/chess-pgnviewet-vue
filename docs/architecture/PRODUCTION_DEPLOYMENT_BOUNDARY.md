# Production Deployment Boundary

Status: `P1H_ACCEPTED`

## Purpose

This document defines the minimum production hosting contract for the P1H
usable product. It does not create a generic gateway, backend, credential
forwarder, or deployment platform.

## Application hosting

- Serve the production Vite output over HTTPS.
- Serve `index.html` for canonical routes and compatibility deep links,
  including `/pgnViewer/*`, `/competitions/*`, `/login`, `/match/*`,
  `/share/*`, and `/cloud/*`.
- Serve hashed JavaScript, CSS, images, piece assets, and Worker assets with
  their emitted paths intact. Do not rewrite asset requests to `index.html`.
- Keep the application and its restricted API boundary on the same trusted
  site when cookie-backed authentication is used.

## Restricted production API route

The Vite development proxy is not present in a production bundle. Production
hosting must provide one of these approved boundaries:

1. Map the same-origin prefix `/api/ksl` to the fixed HTTPS upstream
   `https://wxapi.kaisaile.org`, removing only the leading `/api/ksl` prefix.
2. Set `VITE_KSL_CHESS_API_BASE` to an owner-approved browser-readable HTTPS
   API base with the same documented read-only contracts.

The deployment must not accept a caller-controlled target, wildcard upstream,
generic `/CALL`, `proxyRequest`, credential-bearing URL, arbitrary header
forwarding, request-body logging, or secret logging. TLS verification remains
enabled. Browser code never receives an upstream secret, HMAC key, MQTT
credential, or privileged backend token.

`VITE_KSL_MAIN_API_BASE` and `VITE_KSL_REQUEST_TIMEOUT_MS` must pass the
runtime validation already owned by `src/config/productionApi.ts`. Environment
values are deployment configuration, not a mechanism to bypass the fixed API
contract.

## Runtime behavior

- The application uses one private Axios XHR client and the configured
  same-origin base. Production routes must not require direct browser access to
  an uncontrolled upstream.
- Public tournament reads remain public. Protected replay requires an active
  authenticated session and must preserve the hosting platform's cookie and
  credential policy.
- The product must present network, timeout, permission, empty,
  invalid-contract, and unavailable states without substituting mock or cached
  private payloads.
- MQTT/electronic-board live remains unavailable until a separate owner-approved
  read-only transport contract exists. Hosting must not invent one.

## Operational acceptance

Before promoting a build, validate the production bundle on the deployed
origin:

1. `/pgnViewer/` and every canonical route return a nonblank application with
   no error overlay or console-breaking error.
2. `/api/ksl/liveproxy/GetActList` reaches only the approved upstream and
   returns the documented response shape.
3. A competition list, detail, selected round, display route, and workspace
   handoff complete without document-level horizontal overflow.
4. Worker assets load and stop on route teardown; repeated workspace navigation
   does not accumulate boards or Workers.
5. No response, URL, log, or client storage exposes credentials or private
   replay payloads.

Credentialed login, protected replay success, logout, and post-logout denial
must be revalidated in the deployment environment when the owner supplies a
test account. Absence of such credentials must not be worked around locally.
