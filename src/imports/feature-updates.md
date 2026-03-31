IMPORTANT: Only implement the changes listed below. Do NOT redesign or modify any other parts of the app that are not specifically mentioned. I like the current layout and design, so please preserve everything else exactly as it is.

1. Account Persistence
   Ensure user login sessions persist so that if a user logs out of their computer or refreshes the page, their information remains saved and they stay logged in unless they manually log out.

2. Pairs Traded Formatting
   When users type in the “Pairs Traded” field, automatically convert the text to ALL CAPS (for example: eurusd → EURUSD).

3. Dashboard – Recent Activity UI
   Make the posts in the Recent Activity section smaller and more compact so the dashboard looks cleaner and more aesthetically pleasing.

4. Daily Check Section
   Remove the checkbox that says “Journal Entry +10 Points”.

5. Forfeit Wheel UI
   If the user clicks “No”, change the background of the forfeit wheel area to a soft blue (or another subtle color) instead of gray to make it look more visually appealing.

6. Forfeit Wheel Respin Limit
   After the user spins the wheel, they should only be allowed to click “Re-spin” one time. Later we may allow unlimited respins for premium users, but for now limit it to one.

7. Accept Forfeit Screen
   When a user clicks “Accept Forfeit”, remove the “Journal Entry +10 Points” checkbox here as well.

8. Journal System (Customizable – Mini Notion Style)
   Transform the journal section into a customizable system where users can add their own fields.

Default fields should include the basic journal entries already present, but users must be able to add their own sections.

When adding a new field, the user should be able to choose the type of field from a dropdown:

• Text box
• Number input
• Checkbox
• Dropdown
• Date/time

Example:
A user could create a field called “SMT” and set it as a checkbox to track whether the trade had SMT.
Another example: “Session” as a dropdown (London, NY, Asia).

Users should be able to:
• Add fields
• Edit fields
• Remove fields

The description field should be optional.

Also add a section in the journal entry where the user can upload a screenshot of their trade.

9. Trade Tagging
   Add a tagging system to journal entries so traders can attach tags to trades (for example: London Session, Breaker, SMT, Liquidity Sweep). Users should be able to create their own tags.

10. Trader Stats Dashboard
    Add a small trader statistics section to the dashboard that automatically calculates statistics from journal entries.

This section should include:
• Win Rate
• Average Risk-to-Reward
• Total Trades
• Winning Trades
• Losing Trades

Keep this section clean and compact so it fits naturally within the dashboard.

11. Social Feed UI
    Make posts in the Social tab smaller and more aesthetically compact.

12. User Profiles
    When a user clicks on another user's username in the social feed, it should take them to that user's profile page.

13. Post Interaction Rules
    Users should only be able to like a post one time, but they can comment unlimited times.

14. Comment Interface
    When commenting on posts, make the comment interaction feel like modern social media apps (inline comment field under the post) rather than a large textbox.

15. Sidebar Navigation
    Ensure the sidebar options are fully clickable and functional:

• Groups
• Direct Messages
• Notifications
• Settings
• Edit Dashboard
• Edit Rules
• Upgrade
• Log Out

Groups: allow users to create a group or join an existing group.
Direct Messages: allow users to search for a username and send messages similar to Instagram-style DMs.
Edit Rules: show the user's rules and allow them to add, remove, or edit them.
Upgrade: show Free Plan and Premium Plan (details can be added later).

16. Profile Picture Upload
    Add a small “+” icon on the user’s profile picture so they can upload or change their profile photo.

17. Forfeit Post Sharing
    If a user chooses to post their forfeit, it should appear in both:
    • The Social Feed
    • Their Dashboard Recent Activity

18. Social Post Button
    Add a “+” button at the bottom of the Social tab that allows users to create a post manually (not just from daily check).
    When a user creates a post here, it should also appear in the Dashboard Recent Activity section.
