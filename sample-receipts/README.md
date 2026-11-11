# Sample receipts (fake, for testing)

All receipts are fictional. Dates fall inside the trip window (Nov 12-15, 2026).

| File | Vendor | Date | Total | Category | Alcohol | Expected decision |
|---|---|---|---|---|---|---|
| meals-under-cap.png | Joe's Taco Shop | 2026-11-13 | 25.59 | meals | no | auto_approve |
| meals-over-cap.png | Harbor Grill & Bistro | 2026-11-14 | 109.02 | meals | no | needs_review (over $50 cap) |
| meals-with-beer.png | The Copper Tap | 2026-11-13 | 43.57 | meals | yes | reject |
| rideshare-under-cap.png | Uber | 2026-11-12 | 27.85 | rideshare | no | auto_approve |
| registration.png | National Student Engineering Conference (NSEC) | 2026-11-12 | 155.00 | registration | no | auto_approve |
| hotel.png | Hampton Inn & Suites | 2026-11-12 | 525.48 | hotel | no | needs_review |
| flight.png | Delta Air Lines | 2026-11-12 | 284.30 | flight | no | needs_review |
| other-supplies.png | Office Depot | 2026-11-13 | 28.80 | other | no | needs_review (uncategorized) |

Note: parse-receipt flags dates in the future as needs_review, so before Nov 12
these will show as flagged. Test extraction accuracy anyway; the decision
results above apply once the dates are not in the future.
