**Onboarding Update – Primary Trading Style & Conditional Layout**

We need to update onboarding so the app adapts based on the user’s trading style.

---

**Primary Trading Style Selection**

During onboarding, add a required field:

**Primary Trading Style**

Options should be:

Day Trader
Swing Trader
Long Term Hold
Other

(Keep same design style currently used, just reorder so Long Term Hold replaces where Position was previously.)

User must select one before continuing.

This selection must be saved to the user profile as:

**trading_style**

---

**Conditional App Behavior**

The app should slightly change wording and layout depending on the selected trading style.

Day and Swing traders:
Keep current layout and wording.

Long Term Hold users:
Adjust certain wording and journal structure to better match investing behavior instead of active trading.

---

**Changes for Long Term Hold Users**

Daily Check question should change from:

"Did you follow all your trading rules today?"

To:

"Did you follow your investing rules today?"

---

**Journal Adjustments (Long Term Hold Users)**

For Long Term Hold users, the journal should function as an **Investment Discipline Journal** instead of a trade execution journal.

Journal entry fields should include:

Asset Name (required)
Action (Buy / Hold / Sell)
Reason for decision
Investment Thesis (required for Buy entries)
Invalidation Condition (optional but recommended)
Planned Hold Time (example: 6 months, 1 year, 3–5 years)
Screenshot (optional)
Notes (free text)

---

**Investment Thesis Tracker (Important Feature)**

When a Long Term Hold user logs a BUY action:

Require:

**Investment Thesis**
(Why they are buying this asset)

Example:
"I believe this company will grow due to AI demand over the next 3–5 years."

Optional field:

**Invalidation Condition**
(What would make them sell)

Example:
"If revenue growth slows or fundamentals change."

Optional:

**Planned Hold Time**
Example:
1 year / 3 years / long term

---

**Future Behavior Using Thesis Data**

This data should be stored so it can later be referenced in:

Journal review
RevengeX prompts
Future discipline analytics

Example future prompt:

"You bought this asset because of AI growth. Has your thesis changed?"

---

**Premium Features For Long Term Investors**

Premium users should unlock additional discipline tools specifically for investing behavior.

These include:

**Investment Discipline Dashboard (Premium)**

Shows behavioral statistics such as:

Plan Adherence Rate
(Number of times user followed planned hold time)

Early Sell Count
(Number of times positions were sold before planned hold time)

Thesis Discipline Score
(How often user followed their original investment thesis)

Example display:

Plan Adherence: 88%
Early Exits: 3
Strong Holds: 12

---

**Thesis Review Reminders (Premium)**

Premium users can enable scheduled thesis reviews.

Example:
User sets review every 90 days.

App prompts:

"Has your investment thesis changed?"

Options:

No → Continue holding
Yes → Update thesis

---

**Emotional Selling Detection Prompt (Premium)**

When a Long Term Hold user logs a SELL:

App asks:

"Is your thesis broken or are you reacting to price?"

Options:

Thesis Broken
Emotional Reaction

If Emotional Reaction selected:

App displays their original Investment Thesis.

Goal:
Prevent panic selling.

---

**Monthly Investment Discipline Report (Premium)**

Premium users receive monthly behavior summaries.

Example:

Monthly Discipline Report:

Plan Adherence: 91%
Emotional sells prevented: 2
Early exits: 1
Thesis reviews completed: 3

This can be a simple dashboard card or downloadable report later.

---

**RevengeX Tab Text Adjustments**

RevengeX should still exist, but wording should feel relevant to investors.

Examples:

Quotes about panic selling
Quotes about long term discipline
Quotes about emotional investing mistakes

Title can remain RevengeX but internally it should adapt text based on trading style.

---

**Future Flexibility Requirement**

Trading style should control:

• Journal fields
• Daily Check wording
• Some quote types
• Investment thesis fields
• Investor discipline analytics
• Optional future analytics

This should be implemented as conditional UI, not separate screens.

Example logic:

If trading_style = Long Term Hold
→ Load investing version of labels and journal structure

If trading_style = Day or Swing
→ Load trading version

---

**Important Design Goal**

The app should feel tailored without feeling like a different product.

Only wording and a few fields change.

Core discipline system remains identical.

---

**Technical Note**

Trading style must be stored in user profile and referenced when loading:

Dashboard
Daily Check
Journal
RevengeX

Investment thesis data must also be stored per journal entry for Long Term Hold users.

This should not require separate accounts or flows.
