# Pockit v2

What changed
1. Treasurer: "Approve and pay" and "Deny" now ask "Are you sure?" first. Approving also lets the treasurer pay a lower amount.
2. Partial reimbursement: if a student spends $60 and the limit is $50, they are paid $50 (instead of being sent to the treasurer). The Rules page has a checkbox to turn this off.
3. Red accents next to the blue (theme colors in app/globals.css).

How to install (does NOT delete anything)
1. Right-click the zip > Extract All, into a temporary folder (for example Downloads\pockit-v2).
2. Open PowerShell in your Pockit project folder and run (change the first path to where you extracted):

   Copy-Item -Recurse -Force "$HOME\Downloads\pockit-v2\pockit-v2\*" .

   Copy-Item merges folders, so nothing is removed. If your extracted folder has no inner pockit-v2 folder, drop one "pockit-v2\" from the path.
3. Restart: Ctrl+C, then npm run dev.

Notes
- Organizations you already created keep their rules, and partial reimbursement is ON for them.
- Receipts now show "Paid $50 of $60". The audit log has a new "Paid" column next to "Receipt total".
- Texts say, for example: "Your reimbursement request was approved! $50.00 of your $60.00 for Team Dinner is on its way to your PayPal. That's the limit for meals."
- The sample receipt meals-over-cap.png ($109.02 meal) now pays $50.
