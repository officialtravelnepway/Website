Travel Nepway & Tours Pvt. Ltd. — V3 Sky-Blue Standard Website

Changes in this version:
- Homepage reduced to the supplied reference-style flight hero + Contact section only.
- Sky-blue visual system across header, page heroes, page backgrounds, cards, and footer.
- Standardized header/footer/navigation across all pages.
- Responsive mobile/tablet navigation and layouts retained.
- Existing flight, tour, visa, services, deals, enquiry tracking and admin functionality retained.
- Home flight form keeps the existing JavaScript IDs and mailto workflow.

Important production note:
The current admin/enquiry storage uses browser localStorage/sessionStorage. It is not a shared secure database. For production, connect it to a backend/database and real authentication.


V3 REVIEW / LAUNCH BLOCKERS:
- Seeded flights in script.js are illustrative demo records, not live availability or confirmed fares.
- Admin login is client-side and credentials are embedded in script.js; it is not secure authentication.
- Flight inventory and enquiry tracking use browser storage and are not shared with the agency across devices.
- mailto/WhatsApp handoff does not guarantee server-side receipt or create a reliable agency-side record.
- Before public launch: implement backend API + database, server-side authentication/authorization,
  server-side enquiry creation and tracking, input validation, privacy notice/consent, and clear fare
  disclaimers (or a verified live flight supplier integration).
- Until those changes are complete, use only as a demo/prototype; do not collect sensitive passenger data.

AGENCY ENQUIRY MODEL:
- Flight requests are requests for quotations only; submission does not book or confirm a ticket.
- Staff check supplier channels independently and provide fare, baggage, rules, validity, and next steps.
- Before live use, route form submissions to a secure backend and shared database; mailto/WhatsApp alone cannot guarantee receipt.
