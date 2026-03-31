App Fixes & Adjustments
1. Password Error Message Clarification

If a user attempts to create an account and the password does not meet the required criteria, display a clear error message.

The message should say:

“Password must be at least 9 characters and include:
• One uppercase letter
• One lowercase letter
• One number
• One special character (!, ?, @, #, $, %, &, *)”

This message should appear immediately when the password is rejected.

Do not change the existing password requirements. Only update the error message wording.

2. Journal Entry Button Text

In the Journal tab, change the button text from:

“Add Entry”

to:

“Add Entry +10 Points”

Do not change the button’s design, placement, or styling.

3. Journal Entry Points Cooldown

When a user posts a journal entry, they should receive:

+10 Points

However, points can only be awarded once every 6 hours.

Rules:

Users can still create unlimited journal entries.

Points should only be granted if 6 hours have passed since the last point-awarded entry.

If a user posts another entry before the cooldown expires, the entry should still post normally but no points should be awarded.

Do not limit journaling itself. Only limit the points reward.

4. RevengeX Quote Generator UI Fix

When generating a new quote in the RevengeX tab, adjust the UI behavior:

Place the “Generate New Quote” button directly to the right of the quote, or directly underneath the quote, as long as it is clearly associated with the quote.

Additionally:

Remove the descriptive words currently shown with the quote:

“stoic, dark, calm”

The quote should now display only the quote text itself.

Do not change the design of the rest of the RevengeX page.

5. Daily Check Adjustment

Modify the Daily Check options as follows:

Remove the option:

“I didn’t trade today.”

Instead:

Under the option “Yes, I followed my rules”, add a checkbox labeled:

“No trades taken.”

This allows users to confirm they followed their rules even if they did not trade.

Users should still be able to add a description of their day if desired.

Do not modify any other Daily Check elements.

6. Email Verification Requirement

When a new user signs up, require email verification before the account becomes fully active.

Rules:

Send a verification email to the user’s email address after signup.

The user must click the verification link in the email to activate their account.

If the email is not verified, restrict access to the app until verification is completed.

Provide an option to resend the verification email if needed.

This helps prevent fake or spam accounts.

7. Username Character Rules

When creating a username, enforce the following rules:

Usernames must be unique (cannot already exist in the system).

Only allow the following characters:

Letters (A–Z)

Numbers (0–9)

Underscores (_)

Periods (.)

Restrictions:

No spaces

No special characters other than _ and .

Username length should be between 3 and 20 characters

If a username does not meet these rules, display a clear error message explaining the requirements.