# Scout — Documentation Index

Last updated to reflect the shipped build: email OTP verification at signup, provider self-registration, admin verification UI, Brevo SMTP delivery.

## Requirements

- [Functional & Non-Functional Requirements](./Functional%20%26%20Non-Functional%20Requirements.md)
- [Data Dictionary](./Data%20Dictionary.md)

## Diagrams

Each diagram is provided twice: a Mermaid Markdown source (text, diffable, editable) and an HTML render (loads the Mermaid source via CDN; open in any browser).

| Diagram | Source | Rendered |
|---|---|---|
| Entity Relationship | [ERD.md](./ERD.md) | [ERD.html](./ERD.html) |
| Class Diagram | [Class Diagram.md](./Class%20Diagram.md) | [Class Diagram.html](./Class%20Diagram.html) |
| Use Case Diagram | [Use Case Diagram.md](./Use%20Case%20Diagram.md) | [Use Case Diagram.html](./Use%20Case%20Diagram.html) |
| Sequence Diagrams | [Sequence Diagrams.md](./Sequence%20Diagrams.md) | [Sequence Diagrams.html](./Sequence%20Diagrams.html) |
| Activity Diagrams | [Activity Diagrams.md](./Activity%20Diagrams.md) | [Activity Diagrams.html](./Activity%20Diagrams.html) |
| Application Architecture | [Application Architecture.md](./Application%20Architecture.md) | [Application Architecture.html](./Application%20Architecture.html) |

## Narrative references

- [System Architecture (overview)](./system%20architecture.html)
- [Backend Architecture (Django apps)](./backend%20architecture.html)
- [API Design](./API%20design.html)
- [Eligibility Matching Engine](./Eligibility%20Matching%20Engine.md)
- [Opportunity Eligibility Matching](./Opportunity%20Eligibility%20Matching.md)

## Updating diagrams

The `.md` files are the source of truth. The matching `.html` files embed the same Mermaid source and render it via Mermaid v10 from jsDelivr. To change a diagram, edit the `.md` source and copy the updated block into the `<pre class="mermaid">` of the matching HTML file.
