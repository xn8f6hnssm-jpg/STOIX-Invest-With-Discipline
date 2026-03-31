IMPORTANT: Only implement the updates listed below. Do NOT redesign, move, or modify any other existing layouts, components, styling, or structure unless it is required for the changes below. Everything else in the app should remain exactly the same.
Login Persistence Fix
When a user clicks “Log In”, make sure the system recognizes previously created accounts and allows the user to log back in using the same email and password they originally signed up with. Ensure the user’s account information is stored correctly so they can return and access their existing profile instead of being forced to create a new account.
Journal Entry Points Label
In the Journal tab, change the button text from “Add Entry” to:
“Add Entry +10 Points”.
Profile Picture Sync
If a user updates their profile picture on the Dashboard, ensure the updated picture automatically appears everywhere their profile appears across the app, including in the Social tab next to their username and posts.
Groups System
When a trader clicks “Create Group”, allow them to create a new group.
Also add a separate option called “Join Group”.
The Join Group section should allow users to:
• Join a group using an invite link
• Search for a group by group name and request to join
Groups must remain accessible through the menu/sidebar as they currently are. Do NOT move Groups into the Social tab.
Direct Message Button on Profiles
When a user clicks another trader’s profile from the Social tab, add a visible “DM” button on that profile page that allows them to start a direct message conversation with that user.
Social Leaderboard (Inside Social Tab)
Inside the Social tab, add a new section called “Leaderboard”.
At the top of the Social page, create a simple toggle or tab switcher that allows users to switch between:
• Feed
• Leaderboard
The Leaderboard should display a ranked list of traders based on discipline metrics (not profit).
Each ranked trader should display:
• Profile picture
• Username
• Discipline percentage
• Rank number
Leaderboard rankings should be influenced by:
• Discipline score
• Journal consistency
• Rule adherence
• Daily check completion
Leaderboard Filters
Add filter options at the top of the leaderboard:
• Global
• Friends
• Weekly
• Monthly
These allow users to view different ranking scopes.
Trade Replay (Trade Review Mode)
Inside the Journal section, after a user logs a trade, allow them to open a “Replay / Review” page for that trade.
This page should display:
• Uploaded chart screenshot
• Entry price
• Stop loss
• Take profit
• Risk-to-reward ratio
• Trade notes
Below this information, include a structured reflection section with the following prompts:
Step 1: Why did you take this trade?
Step 2: Did the setup follow your trading rules?
Step 3: Did you manage the trade according to your plan?
Step 4: Did emotions affect your decisions?
No Trade Day Journaling
In the Journal section, allow users to create a journal entry even if they did not take a trade.
Add a “No Trade Day” option that users can select. When this option is selected, the user should still be able to write a description explaining what happened during the day (for example: observing the market, following rules by not forcing trades, studying charts, etc.).
This entry should still count as a valid journal entry for discipline tracking.
Daily Check – No Trade Option
Inside the Daily Check section, add an option for the user to select “No Trade Today”.
This allows users to still complete their daily check even if they did not take any trades but still followed their rules and stayed disciplined.
Users should still be able to add a description explaining their day.
Revenge Trading Alert
Add a system that detects possible revenge trading behavior (for example: multiple trades shortly after losses).
When detected, display a popup message to the trader:
“⚠️ Revenge Trading Detected
You may be trading emotionally after recent losses.
Take a moment to reset before entering another trade.”
This popup should only warn the trader and encourage discipline. It should NOT block or lock trading.
RevengeX Quote Generator
In the RevengeX tab, add a button labeled “Generate New Quote”.
When pressed, it should display another quote from the revenge trading quote list.
Discipline Share Card
Add a feature that allows traders to generate a shareable “Discipline Share Card”.
This card should summarize a trader’s daily discipline metrics in a clean, minimal format that can be shared externally.
The share card should include:
• Username
• Profile picture
• Discipline percentage
• Number of trades taken that day
• Rules followed (example: 5/5)
• Journal entry completed indicator
• Revenge trades count
• Discipline streak (example: “🔥 8 Day Discipline Streak”)
Include STOIX branding and the phrase:
“Trade With Discipline”.
Add a “Share” button that allows the user to export this card as an image.
This feature can appear:
• On the Dashboard
• After completing the Daily Check
• At the end of a trading day
14. Password Requirements:


Minimum 9 characters


At least one uppercase letter


At least one lowercase letter


At least one number (#)


At least one special character (e.g., !, @, $, etc.)


Username Requirements:


Must be unique; the username cannot already exist in the system


Email Validation:


Must be a real, valid email address


Important: If a user does not meet any of these criteria, prevent account creation and display a clear, specific error message.

Again, do NOT change any other design elements or layouts unless absolutely necessary to implement the features listed above.
