# Auth del panel

## Roles en `operators`

| Rol | `tenant_id` | Entra al panel | Entra a la taquilla |
|-----|-------------|----------------|---------------------|
| `cashier` | recinto | no | sí |
| `supervisor` | recinto | no | sí |
| `admin` | recinto | sí, solo ese recinto | no |
| `platform` | null | sí, todos los recintos | no |

`tenant_id` es nulo solo para `platform`.

## Login

`POST /api/Admin/Login` con `{ email, password }`.

No usa el login del comprador (`users`) ni exige `x-conexion-id`.

Respuesta: token opaco, `role`, `tenantId`, vencimiento a las 12 horas. El token se guarda en `operator_sessions` y viaja en `x-operator-token`, igual que la caja.

Un cajero que llama `Admin/*` recibe 403. Un admin que llama `Taquilla/Login` recibe 403.
