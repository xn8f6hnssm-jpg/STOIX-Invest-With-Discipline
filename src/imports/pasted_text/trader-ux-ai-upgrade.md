**Day & Swing Trader UX Improvements + AI Analytics Upgrade**

We need to improve usability, clarity, and AI usefulness for Day and Swing traders. These are mostly UX improvements plus one major AI improvement.

---

**1. Show Trading Style On Dashboard**

On the main dashboard, display the user's selected trading style.

Example:

Day Trader
Swing Trader
Long Term Investor

Placement:

Under username or near discipline stats.

Goal:
Reinforce personalization and clarity of account type.

---

**2. Edit Rules UX Improvement**

When user clicks a rule inside **Edit Rules**:

Make it visually obvious which rule is being edited.

Behavior change:

When a rule is clicked:

Scroll that rule to the top of the screen

Highlight it with a subtle background color

Automatically open editing mode

Example behavior:

User clicks rule #7 → it moves to top → editing field opens.

Goal:
Remove confusion and make editing feel intentional.

---

**3. Collapsible Dropdown Sections**

Add ability to collapse dropdown sections for cleaner UI.

Example sections:

Rule Templates

Strategy Lists

Journal Filters

Add:

Collapse / Expand arrow

Default state:

Expanded first time

Remember user's last state.

Goal:
Reduce clutter and improve focus.

---

**4. Risk/Reward Input Fix (Journal)**

When editing Risk/Reward ratio:

Currently shows:

0.00

When user types:

Make the default zero disappear immediately.

Example:

User types 3 → becomes:

3.00

Not:

03.00

Goal:
Standard modern input behavior.

---

**5. RevengeX "Show Worst Day" Button Bug**

Currently not visible/clickable.

Fix requirements:

Ensure button is visible.

Ensure it is clickable.

Ensure it loads worst discipline day from journal.

Fallback behavior:

If no data exists:

Show:

"No worst day recorded yet."

Goal:
Feature reliability.

Priority:
Medium-High.

---

**6. Sold Button Visibility Fix**

Currently the **Sold button** appears for all users.

Change behavior:

Only show:

SELL / Outcome buttons

For:

Long Term Hold users.

Day/Swing traders should only see:

Trade Closed

Win/Loss

Standard trade exit logging.

Logic:

If trading_style = Long Term Hold
→ Show Sell Outcome Journal

If trading_style = Day/Swing
→ Hide Sell Outcome system.

Goal:
Remove irrelevant UI.

---

**7. Move Account Rules & Discipline Protection**

Currently hard to find.

Move to a new tab called:

**Prop Firm Success**

Add to main menu.

This tab should contain:

Account Rules

Daily Loss Tracker

Drawdown Tracker

Discipline Protection Mode

Behavior Alerts

Goal:
Make this a central hub for serious traders.

Position it as:

**Account Protection Center**

---

**8. Group Challenges Prize Logic Improvement**

Prizes should be optional when creating challenges.

Add toggle:

Prize Enabled: ON/OFF

If ON:

Default prize:

Trophy only.

Rules:

Only users who COMPLETE the challenge receive trophy.

Not just participants.

Add:

Completion validation requirement.

Example:

Complete 5 daily checks

Follow rules for 7 days

Goal:
Encourage completion not participation.

---

**9. Backtesting Mode Statistics Separation**

When user enters:

Backtesting tab inside Journal:

Statistics panel should switch to:

Backtesting Results

Instead of live trading stats.

Add toggle inside AI Analytics:

Tabs:

Live Trading Analytics

Backtesting Analytics

User can switch between them.

Goal:
Separate simulation vs real performance.

Important for serious traders.

---

**10. AI Analyst Upgrade (Major Feature Improvement)**

Current AI feedback is too generic.

We need AI to provide:

**Strategy refinement analysis.**

AI should analyze:

Trade setups

Confluences

RR ratios

Time of day

Strategy tags

Emotional state tags

Checklist results

Backtesting results

AI should detect:

Which combinations produce highest winrate.

Example output:

**Strategy Insight Example:**

"You win 68% of trades when these conditions align:

Liquidity sweep

Market structure break

Trade taken before 11am

RR above 1:2"

Suggestion:

"Focus on this setup. It produces your highest expectancy."

---

**AI Should Also Detect:**

Worst performing combinations.

Example:

"You lose 72% when trading after 1pm with RR under 1:1.5."

Suggestion:

"Avoid this setup."

---

**Backtesting AI Should Also Provide:**

Best performing strategy combinations.

Example:

"Backtesting shows your highest profit factor occurs when using:

Breakout + Retest + Volume confirmation."

Goal:
Make AI feel like a strategy coach.

Not just stats.

---

**AI Output Format Should Follow:**

Observation

Pattern

Recommendation

Example:

Observation:
Winrate higher in mornings.

Pattern:
Trades before 11am outperform.

Recommendation:
Focus on morning session.

---

**Future AI Goal**

AI should help trader answer:

"What should I do more?"

"What should I stop doing?"

"What actually works for me?"

---

**Design Goal**

Day/Swing traders should feel:

The app improves their edge.

Not just tracks trades.

AI should feel like:

**A performance coach.**
