# Potential features

Features below use only the current anomaly snapshot. Each row already has:

`type`, `agentIP`, `srcIP`, `dstIP`, `srcPort`, `dstPort`, `ipProtocol`, `packetSize`, `inVlan`, `userclass`, `row_id`, `true_userclass`, `predicted_userclass`, `max_probability`, `anomaly_tier`

`summary.json` and `metrics.json` already have counts, status, thresholds, accuracy, class list, and misclassification pairs.

There is no timestamp, hostname, owner, or asset inventory. Do not plan time windows, historical baselines, directory lookups, or external alerting until those exist.

## 1. Grouped anomaly queue

Replace the flat flow list as the default anomalies view with groups an operator can open.

- Group by one of: `srcIP`, `srcIP` + `dstIP`, `inVlan`, `agentIP`, or `true_userclass` → `predicted_userclass`.
- Each group shows flow count, count of `high` vs `maybe`, max `max_probability`, and the distinct ports and protocols inside the group.
- Opening a group applies the existing table filters and shows the individual flows.
- Keep the current row drawer for a single flow.

## 2. Rank groups from existing fields

Sort the queue so the first rows are the ones to review.

- `high` before `maybe`.
- Then higher `max_probability`.
- Then larger flow count.
- Optional boost when `dstPort` is in a fixed well-known set (22, 53, 80, 443, 445, 3389, 5353). This is a label on `dstPort`, not an asset criticality score.

## 3. Same-snapshot source baseline

Within this export only, summarize each `srcIP`.

- Majority `true_userclass` for that address.
- Flows whose `predicted_userclass` differs from that majority.
- Show the sentence in the group header and in the flow drawer: this source is mostly class A here, and these rows were predicted as class B.

This is the mix inside the current test split, not behavior over time.

## 4. Overview aimed at review

Keep model accuracy and the confusion chart on the class-patterns page.

On the overview, compute from `anomalies.json`:

- Open counts already in `summary.json` (non-anomalies, maybe, high, flows evaluated).
- Top sources, top VLANs, top agents, and top true-to-predicted pairs.
- Each item navigates to the anomalies page with that filter applied.

## 5. Readable flow details

In the table and the drawer:

- Map `ipProtocol` to a name (6 TCP, 17 UDP, 1 ICMP, otherwise the number).
- Map common `dstPort` and `srcPort` values to service names, and still show the number.
- Add a short static glossary for the class labels present in `metrics.classes` and the rows (`Student`, `Researcher`, `RemoteControl`, `External`, and any others in the file).
- Lead the drawer with tier, true class, predicted class, and confidence. Flow attributes stay below that.

## 6. Local triage state

Stored in the browser (`localStorage`), keyed by `row_id` or by the group key. No new columns in the CSV or JSON.

- Status: new, acknowledged, false positive.
- Optional note.
- Hide acknowledged and false-positive groups by default, with a control to show them.

## 7. Export the current view

- Download the filtered flows as CSV using the columns already on the row.
- Copy a short text summary of the active filter: row count, top class pair, top source IP.

## Out of scope until the data changes

- Last hour, versus yesterday, sparklines, or “new since last refresh.” No timestamp column.
- Hostname, department, owner, or crown-jewel hosts. No inventory join.
- Email, chat, or ticket alerts.
- A live ingest health check. The status banner stays the existing green / yellow / red rule from misclassification counts.

## Suggested order

1. Grouped queue and ranking (sections 1–2). This is the review workflow.
2. Overview links into those groups (section 4).
3. Protocol, port, and class labels in the drawer (section 5).
4. Same-snapshot baseline sentence (section 3).
5. Local triage and CSV export (sections 6–7).