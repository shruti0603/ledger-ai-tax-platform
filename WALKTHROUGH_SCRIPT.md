# Walkthrough Script

A guided recording script covering all ten challenges.

**Setup:** have the prototype open on the Dashboard, logged in as **Maria Chen** (client).

1. **(Client dashboard / Challenge 06)** "This is Maria, a client. Her return status uses
   one shared component — a status rail — that a client and a preparer both read the same
   way. Right now it says she's in review, and there's a note explaining exactly what's
   blocking it."

2. **Switch role to Sam Rivera (preparer). (Challenge 07)** "Same shell, completely
   different home screen. This is a dashboard built around 'what should I work on right
   now' — it's ranked by urgency and blocking status, not just a list. I generated 150 mock
   returns so I could actually test the filtering and ranking at scale, not just on three
   demo rows." *(Show the "My queue" / "Firm-wide" toggle and the urgency filter chips.)*

3. **Open Maria Chen's return → Traceability tab. (Challenge 01)** "This is the core
   traceability interface. Click a field on the left..." *(click "Schedule A — cash
   charitable contributions")* "...and on the right you see exactly which document it came
   from, the page and section, and — because this one was a calculation, not a direct
   copy — the actual math the system did to get there."

4. **Same field, note the badge. (Challenge 08)** "Every value in this product carries the
   same badge: a dot, an icon, and — if it's editable — a dashed border. Green means
   verified, purple means AI-extracted and unreviewed, amber means it needs review, gray
   means locked. I use this exact same component on the AI Insights tab and the return
   overview, not a new pattern per screen." *(Click the value to open the inline
   correction.)*

5. **Go to the AI Insights tab. (Challenge 10)** "Here's the trust model. Every AI card
   answers the same five questions: what it did, why, what evidence supports it, how
   confident it is, and what to do next. I deliberately don't show raw model output or
   token-level confidence — three good pieces of evidence build more trust than twelve
   technical ones." *(Click Approve on one card, show it flips the underlying field to
   verified.)*

6. **Go to the Messages tab. (Challenge 02)** "This is the collaboration layer. Notice the
   internal note between Sam and Jill — amber, tagged 'Internal' — versus the message that
   went to Maria. A client would never see the internal one. Every thread is already tied
   to a specific document and task, so it's never a generic inbox."

7. **Click a linked task chip → Task detail page. (Challenge 04)** "This is where
   navigation usually breaks down — a task that touches a document, a return, and a
   message thread. Here they're all one click away, and the Back button up top takes me
   back to the task, not to a generic list, because it's tracking my actual path, not a
   fixed hierarchy."

8. **Go to Documents. (Challenge 09)** "I generated about 370 mock documents across the
   firm so search and filtering would mean something. Type a client's name or a document
   type, and it narrows instantly, with paging instead of rendering everything at once."

9. **Go to First-Time Client Demo. (Challenge 03)** "This is a fictional brand-new client,
   Alex, completely separate from the role switcher. Only the current step is fully
   visible — future steps are muted so they don't compete for attention — and there's a
   single clear next action."

10. **Go to Role Architecture. (Challenge 05)** "Last one — this page explains the role
    model directly: six roles, one shell. Sam Rivera is both a preparer and a personal tax
    client, and I want to call that out specifically — his own return is cross-assigned to
    a different preparer and reviewer in the data itself, so the system enforces 'don't
    review your own work' structurally instead of relying on a policy."

**Close:** "That's the prototype — everything you saw is real, working UI. The document
content, extracted values, and AI outputs are fabricated per the assignment's
instructions; that's all documented in the README."
