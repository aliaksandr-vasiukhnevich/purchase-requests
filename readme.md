# Purchase Requests

Full-stack CAP application for the LeverX SAP BTP course. Employees raise purchase requests with line items; approvers approve or reject them. Requests above 5000 need the finance role, mirroring the SAP Build Process Automation flow from homework 1.

## Domain model

| Entity | Notes |
|---|---|
| `Categories` | `cuid`, `managed` |
| `Suppliers` | `cuid`, `managed` |
| `PurchaseRequests` | `cuid`, `managed`, associations to `Categories` and `Suppliers`, composition of `RequestItems` |
| `RequestItems` | `cuid`, quantity and unit price per line |

Service: `PurchaseService` at `/purchase` (OData V4), draft-enabled, with bound actions `approve` and `rejectRequest`.

## Business rules (`srv/services.js`)

- On activation `lineTotal` and `totalAmount` are calculated from the items; status defaults to `NEW`.
- Requests in `APPROVED` or `REJECTED` cannot be edited or deleted.
- `approve` above 5000 requires the `finance` role; `rejectRequest` requires a reason, which is stored as the request comment.
- Reads are enriched with `statusCriticality` for the Fiori status colour.

## Roles

| Role | Grants |
|---|---|
| `requester` | create and edit requests |
| `approver` | `approve` / `rejectRequest` |
| `finance` | `approve` any amount |

Mock users for local runs: `alice` (requester), `bob` (approver), `carol` (approver + finance), `dave` (no roles). Passwords are empty.

## Run locally

```bash
npm install
cds watch
```

Fiori Elements app: `/leverx.purchaserequests/index.html`.

```bash
npm test   # 11 tests on @cap-js/cds-test
```

## Deploy

```bash
cds build --production
mbt build -t gen --mtar purchase-requests.mtar
cf deploy gen/purchase-requests.mtar
```

Role collections `requester`, `approver` and `finance` are created from `xs-security.json` on deployment. The app is published through SAP Build Work Zone, standard edition.
