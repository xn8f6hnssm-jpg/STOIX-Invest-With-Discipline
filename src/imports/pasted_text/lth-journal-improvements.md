**Bug Fixes & Improvements – Long Term Hold Journal + Rules + Strategy Naming**

We need to fix a few issues and improve structure for Long Term Hold users.

---

**1. Long Term Hold Journal Structure Improvement**

Currently the journal treats everything like one entry. For Long Term Hold users this should be split into two phases:

**Investment Entry Journal (When buying)**
and
**Investment Outcome Journal (When selling)**

This better matches how investors actually operate.

**Investment Entry Journal (BUY action):**

Fields:

Asset Name (required)

Action (Buy)

Investment Thesis (required)

Reason for decision

Invalidation Condition (optional)

Planned Hold Time (example: 1 year, 3–5 years)

Screenshot (optional)

Notes

This entry becomes the "Investment Record".

---

**Investment Outcome Journal (SELL action):**

When user logs a SELL for an asset they previously bought:

App should automatically link it to the original BUY journal.

New fields should appear:

Outcome Review:

Did you follow your plan? (Yes/No)

Was the thesis still valid? (Yes/No)

Why did you sell?

Lesson learned

Profit/Loss result

Screenshot (optional)

Notes

Goal:
Make investors reflect on decisions AFTER the trade completes, not just entry.

---

**2. Manage Strategies Naming Fix**

In **Manage Strategies** section:

Currently it shows:
"All Strategies"

Users should be able to rename this.

Add:

Edit name button (pencil icon)

Allow custom naming.

Example:

"My Setups"

"My Investment Strategies"

"My Playbook"

Default should remain "All Strategies" until changed.

This should save to user profile.

---

**3. Rules Showing From Old Account (Critical Bug)**

When clicking **Read My Rules**, rules from a previous account appeared.

This is a data separation issue.

Rules MUST be:

Account specific

User ID linked

Loaded only from that user's database record

Rules should NEVER persist between accounts.

Fix requirements:

Rules must be tied to:
**user_id**

When user logs out:
Clear cached rule data.

When user logs in:
Fetch only that user's rules.

If no rules exist:
Show:

"No rules created yet"

Add button:

**Add Rules**

Possible cause:
Rules may currently be stored locally instead of per account.

This must be corrected so rules are always pulled from the correct user profile.

Priority:
HIGH (data integrity issue)

---

**Design Goal**

Long Term Hold journaling should feel like:

**Investment lifecycle tracking**

Not trade logging.

Rules must feel personal and account-specific.

Strategy naming should feel customizable and personal.
