# Dash — Design Change Brief

Changes to apply to the existing prototypes following the product review. **No new modules.** Every change below deepens a screen that already exists, or adds a screen inside a product that already exists.

Affected products: **Dash DMS**, **Dash Merchant**, **Dash Driver App**, **Dash 3PL**, **Dash Freelancer App**, **Dash Admin**.

---

## Read this first — two foundations

Two things did not exist before and everything else depends on them. Build these concepts first or the rest will not make sense.

### SLA is now a real thing

Until now, Control Tower showed alerts for "late" and "stuck" orders with no definition behind them. There is now an explicit SLA policy: a pickup SLA, a delivery SLA, an at-risk threshold, a late threshold, and a tolerance window for scheduled orders.

This produces a state that every order carries: **On Time / At Risk / Late**. It appears on order rows, in the order detail, as a filter, and in reports. Treat it as a first-class status alongside the delivery status, not a decoration.

### Settlement is one source of truth

There is now a per-order financial record — the rate applied, what the merchant owes, what the driver is paid, what the 3PL is paid, and any COD handled. It lives in one place and every product reads from it.

Dash Merchant does not calculate its own delivery charges. Dash 3PL does not calculate its own payables. They display the same numbers from the same record. Any screen showing money should read as a view onto a shared ledger, not an independent calculation.

---

## 1. Control Tower — order trace

**Applies to: Dash DMS, Dash Merchant, Dash 3PL, Dash Admin**

The Control Tower board is already designed. What is missing is what happens when an operator clicks a single order. That detail view now needs real depth.

**The order detail view should show:**

- Current status and a full lifecycle timeline — every status change with a timestamp
- SLA state and how long the order has been aging
- Merchant and branch
- Driver, fleet, and order source
- Current location and how fresh that location is
- Assignment and reassignment history — who was assigned, who changed it, when, and why
- Offer attempts — offered to driver A and timed out, offered to driver B and rejected, offered to driver C and accepted
- Delays, failures, and interventions
- Operator actions with the actor's name and timestamp on every manual action

The offer attempts and assignment history are the most valuable part. An operator looking at a 40-minute-late order currently sees only that it is late. They need to see it sat unassigned for 25 minutes and two drivers timed out — otherwise they can fix the symptom but never the cause.

**Design note:** this is a timeline, not a table. It should read chronologically and make the gaps visible — the eye should land on the 25-minute pause without hunting for it.

**Three filters to add to the board:**

- **SLA State** — On Time / At Risk / Late
- **Quick search** — order ID, external reference, or customer, to jump straight to one order
- **Branch** — already in Dash Merchant, missing in Dash DMS

**Per product:**

- **Dash DMS** — the full version above
- **Dash Merchant** — timeline, SLA state, branch, who is fulfilling, delays and failures. No assignment internals; they do not dispatch
- **Dash 3PL** — timeline, SLA state, offer attempts, delays. Read only, as before
- **Dash Admin** — the full version, plus dispatch diagnostics (below)

---

## 2. Needs Intervention — a case, not an alert

**Applies to: Dash DMS Control Tower, Dash Admin Global Control Tower**

Alerts currently appear and disappear. An intervention is now a case with a lifecycle, and it lives inside Control Tower rather than in a separate screen.

Each case carries:

- Type and reason, with a severity
- State — **Open / Acknowledged / Resolved**
- Linked order, and driver where relevant
- Owner — which operator picked it up
- Created time, action taken, resolution, resolved time

Cases also appear in the order's timeline, so someone reading the trace later sees that a problem was raised and how it was closed.

**Design note:** the important interaction is acknowledging. An operator needs to be able to claim a case so two people do not work the same problem. Make ownership visible on the case itself.

---

## 3. Driver App — Report an Issue

**Applies to: Dash Driver App, Dash Freelancer App**

A new screen. Today a driver can only cancel or fail an order, and both are terminal. They need a way to say "something is wrong" while the order stays alive.

**Reasons:**

- Customer unavailable or cannot contact customer
- Merchant delay or order not ready
- Wrong address or customer changed location
- Vehicle problem or accident
- Order or item issue
- COD or payment issue
- Other

The report flows into Control Tower as a Needs Intervention case carrying the order, driver, current status, time, and reason.

**Design note:** this must be clearly separate from cancel and fail. A driver under pressure should never confuse the two. Reporting an issue is asking for help; cancelling is ending the order. Different placement, different weight, different colour.

The driver should also see that their issue is open and be told when it is resolved. Reporting into silence is worse than not reporting.

**Where it goes:** from the Dash Driver App into the DMS Control Tower. From the Dash Freelancer App into Dash Admin, since a freelancer has no fleet behind them.

---

## 4. SLA and Service Policy

**New screen in: Dash DMS, Dash Admin**
**Read-only view in: Dash Merchant**

The configuration screen where the thresholds are set.

- Pickup SLA
- Delivery SLA
- At-risk threshold
- Late threshold
- Scheduled delivery window and tolerance

Variation is allowed by merchant, by branch, by order or service type, and by zone — but only where operationally required.

**Design note:** this is not a rule builder. Resist any interface that looks like conditional logic with nested clauses. It should read as a short settings form with a small number of optional exceptions. One clear definition of late, with a few named overrides.

**Dash Merchant** gets a read-only version: promised pickup and delivery times on every order, the On Time / At Risk / Late state, and SLA performance in reports. Merchants read SLA; they do not set it.

---

## 5. Operational Settlement

**New screen in: Dash DMS, Dash Admin**
**Views onto it in: Dash Merchant, Dash 3PL**

The per-order financial record and the settlement cycle built on top of it.

**Per order:**

- Rate applied
- Merchant receivable
- Driver payable where applicable
- 3PL or supply payable where applicable
- COD handover and reconciliation
- Adjustments, each with a reason and an actor
- Dispute status

**Per settlement period:**

- Settlement cycle
- State — **Unsettled / Ready / Settled / Disputed**
- Statement and export
- Audit trail on every financial change

**Design note:** the four states are the backbone of this screen. An operator's main question is "what is ready to settle and what is stuck," so the state should be the primary organising principle, not a column buried on the right.

**Dash Merchant** shows delivered orders, delivery charges, rate applied, adjustments, COD, statement period and amount due, settled or unsettled status, and a downloadable statement.

**Dash 3PL** shows the same shape from the payable side — rate applied, adjustments, settlement period and state, statements, dispute status.

Both are reading from the same record. They should feel consistent with the DMS and Admin views, not like separate finance products.

---

## 6. Capacity Planning

**New screen in: Dash DMS**

Forward-looking, and deliberately separate from Control Tower. Control Tower answers *what is happening now*. Capacity Planning answers *what capacity will we need next*.

**Demand:**
- Expected demand by city, zone and hour
- Scheduled demand already committed

**Supply:**
- Required versus planned drivers
- Planned supply by shift and driver group
- Available versus committed capacity
- Dash Network and 3PL capacity where relevant

**Gap:**
- Shortage or excess by zone
- Planned versus actual capacity

**Design note:** the gap is the point. Demand and supply are inputs; the screen exists so someone can see they are four drivers short in Zone North at 7pm tomorrow and do something about it today. Design toward the shortage being obvious at a glance.

No forecasting engine in the first version — scheduled orders, historical demand, and planned supply are enough.

**Priority:** this is not first-build. It comes in the first six months after the core operating loop is stable.

---

## 7. Dispatch diagnostics

**Applies to: Dash DMS Order Assignment, Dash Admin**

The routing engine should be able to explain itself. Inside the existing Order Assignment experience, not as a new module.

- Why this driver or 3PL was selected
- Why another driver or 3PL was excluded
- Why an order failed to assign

Eligibility inputs to surface: zone or geofence, vehicle type, shift, availability, current capacity or task, GPS freshness.

**Design note:** this is diagnostic, so it belongs one level down — reachable from an order, not occupying the main screen. A short list of candidates with a reason against each is enough. It should feel like an explanation, not a log file.

---

## 8. Integration Health

**Applies to: Dash Merchant (Integrations), Dash DMS and Dash 3PL (Developer Settings), Dash Admin (Client Management)**

Connection health exists as a concept but has no substance. Add:

- Connected or Error state
- Last successful request or sync
- Last error, and count of failed ingestions
- External order ID and reference
- Retry or reprocess, where permitted
- Webhook delivery status

**Design note:** the audience is not a developer reading logs. It is an operations person asking "is my Shopify connection working, and if not, since when." Keep it plain.

---

## 9. Reports to add

**Applies to: Dash DMS, Dash Merchant, Dash 3PL, Dash Admin**

The existing reporting scope is sound. These are additions, and both depend on SLA and Settlement existing first.

- SLA performance and breach reports
- Intervention and failure root cause reports
- Settlement and reconciliation reports

Existing behaviour stays: date range, filters, CSV and Excel export, scheduled reports.

---

## 10. Conditional — build only if needed

### Bulk order import
**Dash Merchant, inside Orders**

Only if early merchants need manual high-volume or scheduled uploads. If they will integrate through the API, defer it.

- CSV or Excel upload
- Multiple orders per upload, with a scheduled date and time per order
- Validation before submission
- Row-level error reporting

### Branch-level overrides
**Dash Merchant, inside Dispatch Configuration**

Merchant-wide configuration stays the default and remains what most merchants ever touch. Overrides are inheritance with exceptions, never per-branch setup from scratch.

Overridable where a real operational need exists:
- Operating hours
- SLA
- Service type
- Vehicle requirement
- Preferred 3PL or pool

**Design note:** a branch should visibly show what it inherits versus what it overrides. If a designer cannot tell at a glance which values are inherited, neither can a merchant.

---

## Priority order for the prototypes

**First — the core operating loop**

1. Order trace inside Control Tower
2. SLA and Service Policy, and the SLA state everywhere it appears
3. Operational Settlement
4. Driver App Report an Issue
5. Dispatch diagnostics

**Second**

6. Needs Intervention case lifecycle
7. Integration Health
8. The three new reports

**Third**

9. Capacity Planning — after the core loop is stable

**Only if required**

10. Bulk order import
11. Branch-level overrides

---

## What is explicitly not changing

The product structure stays as it is. Do not create separate modules for dispatching, exceptions, rules, compliance, additional zones, driver groups, shifts, marketplace surfaces, or network surfaces.

The instruction is to deepen the screens that exist rather than increase the number of screens.
