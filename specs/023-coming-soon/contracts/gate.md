# Contract: Gate decision

`decideGate({ enabled, pathname, method, isAdmin })` returns one of `pass`, `rewrite`, `refuse`.

| enabled | path open (R2) | isAdmin | method | result |
|---------|----------------|---------|--------|--------|
| false | any | any | any | pass |
| true | yes | any | any | pass |
| true | no | true | any | pass |
| true | no | false | GET, HEAD | rewrite to `/demnaechst` |
| true | no | false | other | refuse (`503`, `Retry-After: 86400`) |

Gated responses (`rewrite`, `refuse`) carry `X-Robots-Tag: noindex`.

`/demnaechst` returns 404 when the gate is off.
