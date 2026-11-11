# Design feedback, round 1 (HTML mockups)

Author's feedback on the draft mockups in `docs/design/mockups/`. Round 2 is expected. Nothing here has been applied to the mockups yet. Items marked **SPEC** change or conflict with the SPEC and need a decision in `SPEC-DECISIONS.md` before they are final.

## Import and review

1. **Missing category blocks saving. SPEC.** A row with no category is "needs fixing" before saving. Keep the "? Unknown category" flag, but disable "Save transactions" while any row has no category. Reason: no category means low-quality data.
   - Conflicts with D-012, D-020 and J5: today an unknown category does not block saving, and the row is saved as `uncategorised`. It also touches the scenario "Unknown stays uncategorised" and the "partial" view state (an "Uncategorised" slice in the charts).
   - To settle: does the block apply to every row, or can the user choose "save as uncategorised" explicitly? Can a stored transaction ever be uncategorised after this? (Demo data deliberately includes some, J9.)
2. **Step indicator.** The numbered chips (Choose source, Review, Save) become icons, with arrows between the steps instead of numbers.

## Navigation and layout

3. **Tab order. SPEC (draft assumption).** Insights first, Transactions second, Import after. Reason: more time will be spent in Insights.
4. **Icons on the tabs** (Insights, Transactions, Import).
5. **Accent details.** The design feels bland: minimalist logo and a dark background. Add accent touches. Ideas to offer: an accent colour used on the active tab, icons and key numbers; a small logo mark; subtle gradient or tinted card headers; empty-state illustrations. Not yet decided.
6. **Logo size** changes to 30px.
7. **Header:** add a GitHub icon with the visible text "Project repo", linking to the project repo, placed to the right of "Reset demo".
8. **Reset demo behaviour. SPEC.** After a reset the page returns to Import, on the "Choose source" step. (SPEC J10 says the app goes to the empty state, which offers "Load demo data" and "Import a statement"; to reconcile.)
9. **Mobile layout:** the card layout on narrow screens looks good. Keep it, for the transaction screens.

## Transactions

10. **Context column.** Show context as small tags with the name on them (the mood, motivation and outcome values), plus a "View context" link that opens a dialog with everything written about that transaction (values and note).
11. **"Add context" prompt where there is none:** approved as drafted.
12. **Editing a row:** the author asks how editing works (edit button, or click the row and edit cells in place) and what the table library offers. See the answer in the conversation and the decision to record (SPEC D-034, ADR-001 open decision 18).

## Insights

13. **Section order:** Behaviour first, By category second, 12-month trend third.
14. **Mood by category chart. SPEC.** New chart showing correlations between mood and category (what is spent on when happy or stressed). Mock it. Extends J8, which only has spending grouped by one of mood, motivation or outcome.
15. **"Add context to your biggest unexplained spending":** keep it. The "18% of spending has context" box gets a link to that section, with the call to action "Add more context".

## Demo layer

16. **Question: what does the "Checklist" button do?** Answered in the conversation (J9, D-027, D-029): it reopens the demo checklist panel.
17. **Question: what does "Reset demo" do from Transactions or Insights?** Same action from every screen (see item 8, J10).

## To do before applying

- Record decisions for the SPEC items (1, 3, 8, 14) as D-037 onwards, with the author's answers.
- Apply the changes to the mockups after round 2 arrives.

## Round 1b: decisions and further feedback

Author's answers. Still not applied to the mockups or the SPEC; the SPEC items are batched and written as D-037 onwards once round 2 is in.

### Decisions on the SPEC items

- **Item 1 (missing category): decided.** Saving is blocked while any row has no category. The row keeps its "? Unknown category" flag and counts as needs-fix, and "Save transactions" is disabled until every row has a category. Replaces D-012/D-020's "unknown does not block saving", so J5, the scenario "Unknown stays uncategorised" and the `uncategorised` category source need rewriting. To settle when writing it up: the demo data (J9) still needs some way to show uncategorised rows, and the "partial" view state may no longer occur.
- **Item 3 (tab order): decided.** Insights, Transactions, Import. To be added to the SPEC as a navigation rule, to be used when the screens are built in code.
- **Item 8 (reset): decided.** Reset wipes the whole visitor copy, from any screen, and the app returns to Import on "Choose source". Same behaviour on Transactions, Insights and Import (item 17).
- **Item 14 (mood by category chart): dropped for now.** No change to the Insights mockup, and nothing added to J8.

### New and changed feedback

- **Remove the "Checklist" button** from the header. The author sees no checklist panel in the mockups and does not understand the button. **Decided:** only the header button is removed; the guided demo itself (J9, D-027, D-029) stays. This conflicts with J9, which says the checklist can be reopened from a button in the header and that the header button is hidden in user mode. To settle when writing it up: how a dismissed checklist is reopened, if at all.
- **Context tags (item 10), two sample transactions in the Transactions mockup:**
  1. mood "happy", motivation "impulse": tags on the row and a "View context" link opening a dialog.
  2. mood "sad": tag on the row and a "View context" link opening a dialog with the extra information added (note, motivation, outcome).
  **Decided:** both rows use the label "View context".
- **Editing:** click to edit inline, confirmed (D-034, ADR-001 open decision 18). A spike still verifies it at 5,000 rows.

### Lists (D-023 updated)

- **Mood:** unchanged: happy, stressed, bored, sad, anxious, excited, calm, tired.
- **Motivation:** need, planned, habit, impulse, treat, social pressure, deal or sale, social media, unwell (feeling under the weather, or buying for health reasons).
- **Outcome:** glad I bought it, regret it, used it, unused, returned, sold.
- **Spending categories (decided):** Groceries, Eating out, Transport, Housing (rent, mortgage), Bills and utilities, Subscriptions, Shopping, Health and fitness, Other, plus Income and Transfers, which stay out of the spending charts (D-006). Entertainment and Travel were dropped from the proposal. 9 spending categories, 11 in total. Open: how the charts show 9 categories when only six colours are validated on the dark background (show the top 5 or 6 and group the rest as "Other", or add colours and rely on labels and the table view).
- The mockup text said "impulse buying"; the list value is "impulse". Using the list value.
