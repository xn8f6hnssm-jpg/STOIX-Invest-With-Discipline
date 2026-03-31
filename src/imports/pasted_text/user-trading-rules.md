**Rules System Behavior (Onboarding → RevengeX → Edit Rules)**

Rules entered during onboarding should be saved as part of the user's profile and reused across multiple parts of the app.

---

**Onboarding Rules Entry:**

During onboarding, the user must add at least **5 rules**.

Each rule should include:

• Rule text (required)
• Optional category (Psychology, Entry, Risk, Exit, Discipline)
• Optional **"Critical Rule"** toggle ⭐

There should be:

**+ Add Rule button**

When pressed:
A new input field appears.

Example:

Rule: Only trade 9:30–11am
Category: Entry

These rules must be saved to the user's account database.

---

**RevengeX → Read My Rules Button Behavior:**

When the user presses **Read My Rules** in the RevengeX tab:

It should open a modal or new screen displaying:

**My Trading Rules**

At the TOP of this screen:

Show **3 randomly selected rules** first (prioritize Psychology and Risk category rules if possible since they help most with revenge trading).

Label this section:

**Rules To Remember Right Now**

Example:

⭐ No revenge trading
⭐ Stop after daily max loss
• Never move stop loss

Under this section add a button:

**View All Rules**

---

When user presses **View All Rules**:

Show the full rule list.

Rules must be **automatically sorted by category** in this order:

Psychology
Risk
Entry
Exit
Discipline

Example layout:

**PSYCHOLOGY**
• No revenge trading
• Stop after 2 losses

**RISK**
• Max 1% risk
• Never move stop

**ENTRY**
• Only trade 9:30–11am
• Must have liquidity sweep

If rules are marked Critical:
Show a ⭐ icon next to them.

This screen is **READ ONLY**.
No editing here.

Purpose:
Remind trader of commitments during emotional moments.

---

**Edit Rules Tab Behavior:**

In Settings (or profile menu), there should be:

**Edit Rules**

When opened:

User sees the same rule list but editable.

Rules should still be automatically sorted by category.

Each rule should have:

Edit button
Delete button

User can:

Add new rules
Edit existing rules
Delete rules
Change category
Toggle critical rule

Changes should automatically update everywhere rules appear (RevengeX and Daily Check).

---

**Important Functional Requirement:**

Rules must be stored centrally and referenced across:

• Onboarding
• RevengeX (Read Rules)
• Edit Rules
• Daily Check (future reminders)

This means rules are not duplicated — they are pulled from one source.

---

**Design Goal:**

Rules should feel like the trader’s personal contract with themselves.

The RevengeX tab should feel like:

"You wrote these rules. Follow them."

The goal psychologically is to make the trader confront their own commitments during emotional trading moments.
