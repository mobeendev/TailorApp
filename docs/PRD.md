# Product Requirements Document (PRD)
## Tailor Master — Offline-First Tailoring Management App

**Version:** 1.0  
**Status:** Development-Ready Draft  
**Platforms:** Android First, iOS Future  
**Technology:** Expo, React Native, TypeScript, SQLite  
**Primary Market:** Pakistan  
**Initial Pilot:** 5 Tailor Shops  
**Initial Commercial Target:** 50 Tailor Shops  
**Product Model:** Multi-Shop, Offline-First, Configurable Mobile Application

---

# 1. Product Overview

## 1.1 Product Vision

Tailor Master is a multilingual, offline-first mobile application designed to help tailoring businesses manage customers, clothing measurements, configurable measurement templates, tailoring orders, payments, and delivery schedules.

The application must operate without a mandatory internet connection or cloud database.

Each tailoring shop maintains its own local data using SQLite. Multiple mobile devices belonging to the same shop should be able to synchronize their data over a local Wi-Fi network.

The application must be highly configurable so that tailors can customize measurement templates, required fields, language, units, and business settings without technical knowledge.

## 1.2 Key Objectives

1. Replace paper-based customer measurement registers.
2. Provide ready-to-use garment measurement templates.
3. Allow complete customization of measurement fields.
4. Support multiple languages, including Urdu.
5. Work reliably without internet access.
6. Enable multiple devices to share shop data.
7. Manage customer orders and delivery dates.
8. Allow shop branding and receipt generation.
9. Support expansion from 5 pilot shops to 50+ independent shops.
10. Maintain a clean, modular codebase that is easy to enhance.

## 1.3 Target Users

| Role | Description |
|---|---|
| Shop Owner | Configures the shop, manages employees and orders |
| Tailor | Records customer measurements and garment requirements |
| Shop Assistant | Registers customers and manages orders |
| Administrator | Manages shop settings, templates, backup and device pairing |

A single person may perform multiple roles.

---

# 2. Product Scope

## 2.1 MVP Features

The first release must support:

- First-time setup wizard
- Language selection
- Shop profile configuration
- Predefined measurement templates
- Custom measurement template builder
- Dynamic measurement forms
- Customer management
- Measurement history
- Tailoring order management
- Delivery tracking
- Advance and remaining payments
- Basic dashboard
- Receipt generation
- SQLite local storage
- Manual backup and restore
- Basic device pairing
- Local Wi-Fi synchronization
- Settings and application preferences

## 2.2 Post-MVP Features

The following are planned for future versions:

- Cloud synchronization
- Remote access between shops
- SMS or WhatsApp reminders
- Advanced inventory management
- Employee attendance and salaries
- Online subscriptions
- Online payments
- Public template marketplace
- Advanced business reporting
- Desktop application
- Web dashboard

These features must not block the first production release.

---

# 3. User Onboarding Flow

The application must provide a first-time setup wizard.

### Screen 1 — Welcome and Language Selection

The user selects their preferred language.

Supported languages:

| Language | Code | Layout |
|---|---|---|
| Urdu | ur | RTL |
| English | en | LTR |
| Punjabi (Shahmukhi) | pa-Arab | RTL |
| Pashto | ps | RTL |
| Sindhi | sd | RTL |
| Arabic | ar | RTL |

**Requirements:**

- Display languages in their native scripts.
- Allow language selection without internet.
- Immediately translate supported interface text.
- Apply the correct text alignment and layout direction.
- Persist the selected language locally.
- Allow changing language later through Settings.
- Restart or safely refresh the application when required to apply direction changes.

**Acceptance Criteria:**

- Changing from English to Urdu displays translated interface labels.
- Urdu uses RTL layout where applicable.
- Language preference is preserved after app restart.
- Each device may independently select its language.

### Screen 2 — Shop Information

The user enters the shop profile.

Fields:

| Field | Required |
|---|---|
| Shop Name | Yes |
| Owner Name | Yes |
| Phone Number | Yes |
| Address | No |
| Shop Logo | No |
| Currency | Yes |
| Default Measurement Unit | Yes |

Default currency: PKR  
Default measurement unit: Inches

**Functional Requirements:**

- Select and display a shop logo.
- Save the profile in SQLite.
- Generate a unique Shop ID.
- Allow editing the information later.
- Display shop branding on receipts.

### Screen 3 — Measurement Template Selection

The application presents predefined templates.

**Initial template library:**

1. Shalwar Kameez
2. Kameez Only
3. Shalwar Only
4. Waistcoat

The first three should be featured prominently.

Each template card must include:

- Garment illustration or icon
- Template name
- Short description
- Number of measurement fields
- Preview action
- Select action

The user must be able to select multiple templates.

### Screen 4 — Template Customization

After selecting a template, the user may customize its fields.

Supported operations:

- Add field
- Edit field
- Remove field
- Enable or disable field
- Set required or optional
- Reorder fields
- Change field type
- Change measurement unit
- Add dropdown options
- Rename fields
- Duplicate template
- Save as custom template

Predefined templates must remain available as defaults, with shop-specific customizations stored separately.

### Screen 5 — Template Preview

Display the final measurement form as the tailor will see it during customer registration.

**Requirements:**

- Show field labels in the selected language.
- Clearly distinguish required and optional fields.
- Display configured measurement units.
- Display dropdown and checkbox controls where applicable.
- Allow the user to return and edit the template.
- Allow saving and activating the template.

### Screen 6 — Setup Completion

The final onboarding page displays:

- Selected language
- Shop name
- Selected measurement templates
- Default currency and units
- Setup completion confirmation

The user selects **Finish Setup** and enters the dashboard.

The onboarding wizard must not appear again unless requested or required after a reset.

---

# 4. Dashboard Requirements

The dashboard should be simple, fast, and suitable for non-technical shop employees.

## 4.1 Dashboard Components

**Header:**

- Shop name
- Shop logo
- Current date
- Settings access

**Summary Cards:**

- Total Customers
- Today's Orders
- Pending Orders
- Ready Orders
- Upcoming Deliveries

**Main Actions:**

- Add Customer
- Create Order
- Customers
- Orders
- Measurement Templates
- Reports
- Backup
- Settings

**Functional Requirements:**

- Dashboard statistics must be generated from SQLite.
- Dashboard must work without internet.
- Primary actions must be easy to access.
- Support full Urdu and other configured languages.

---

# 5. Customer Management Module

## 5.1 Customer Information

Each customer record must support:

| Field | Type | Required |
|---|---|---|
| Customer ID | UUID | Auto |
| Shop ID | UUID | Auto |
| Customer Name | Text | Yes |
| Phone Number | Text | No |
| Address | Text | No |
| Notes | Text | No |
| Created At | DateTime | Auto |
| Updated At | DateTime | Auto |

## 5.2 Customer Operations

The application must allow:

- Create customer
- Update customer
- Search customer
- View customer details
- View measurement history
- View order history
- Add new measurements
- Archive customer

Search should support customer name and phone number.

Customer records must not be physically deleted when linked to existing orders unless a controlled data removal process is explicitly implemented.

## 5.3 Customer Details Screen

Display:

- Customer name
- Phone number
- Active measurements
- Previous measurements
- Active orders
- Completed orders
- Add Measurement button
- Create Order button

---

# 6. Measurement Template Management

This is a core product module.

## 6.1 Template Types

The application must support:

**System Templates:** Bundled with the application.

**Shop Templates:** Customized versions of system templates or independently created templates.

## 6.2 Predefined Template — Shalwar Kameez

Suggested fields:

| Field | Data Type | Default |
|---|---|---|
| Kameez Length | Decimal | Required |
| Chest | Decimal | Required |
| Shoulder | Decimal | Required |
| Sleeve Length | Decimal | Required |
| Neck Size | Decimal | Optional |
| Collar Style | Dropdown | Optional |
| Cuff | Decimal | Optional |
| Waist | Decimal | Optional |
| Hip | Decimal | Optional |
| Shalwar Length | Decimal | Required |
| Shalwar Waist | Decimal | Optional |
| Shalwar Bottom | Decimal | Optional |
| Shalwar Ghera | Decimal | Optional |
| Special Instructions | Multiline Text | Optional |

Default required flags are configurable.

## 6.3 Predefined Template — Kameez Only

Suggested fields:

- Kameez Length
- Chest
- Shoulder
- Sleeve Length
- Neck Size
- Collar Style
- Cuff
- Waist
- Hip
- Special Instructions

## 6.4 Predefined Template — Shalwar Only

Suggested fields:

- Shalwar Length
- Waist
- Hip
- Thigh
- Knee
- Bottom Opening
- Ghera
- Style
- Special Instructions

## 6.5 Template Builder

The template builder must support:

| Field Type | Example |
|---|---|
| Decimal Number | Shirt Length: 42.5 |
| Integer | Number of Pockets: 2 |
| Text | Fabric Notes |
| Multiline Text | Special Instructions |
| Dropdown | Collar Style |
| Radio Selection | Sleeve Style |
| Checkbox | Include Pocket |
| Date | Special Fitting Date |

Each field must support:

- Unique Field ID
- Stable Field Key
- Multilingual Labels
- Field Type
- Default Value
- Required Flag
- Enabled Flag
- Display Order
- Validation Rules
- Measurement Unit
- Dropdown Options
- Helper Text

## 6.6 Template Versioning

Templates must be versioned.

Example:

- Shalwar Kameez V1
- Shalwar Kameez V2
- Shalwar Kameez V3

Editing an active template must create a new version when changes affect its structure.

Previously saved measurements must retain references to the version used when they were recorded.

**Acceptance Criteria:**

- Users can add a custom field without changing the database schema.
- Users can save multiple custom templates.
- Existing measurement data remains valid when templates change.
- Required-field validation responds to each template's configuration.
- Template changes can be synchronized to other authorized devices.
- New templates work without an application update.

---

# 7. Dynamic Measurement Form Engine

Measurement screens must be generated dynamically from the selected template definition.

## 7.1 Measurement Flow

1. Open customer.
2. Select **Add Measurement**.
3. Choose a garment template.
4. Load the active template configuration.
5. Render corresponding fields.
6. Enter measurement values.
7. Validate required fields.
8. Display a review screen.
9. Save measurements locally.

## 7.2 Form Requirements

- Numeric keyboard for measurement fields.
- Support fractional decimal values.
- Show units such as inches or centimeters.
- Support required and optional fields.
- Show field validation errors.
- Support long text instructions.
- Allow updating previously saved measurements by creating a new revision or measurement entry.
- Support measurement history.

## 7.3 Dynamic Form Example

```json
{
  "templateId": "shalwar-kameez",
  "version": 1,
  "fields": [
    {
      "id": "shirt_length",
      "type": "decimal",
      "labelKey": "shirt_length",
      "required": true,
      "unit": "inch",
      "order": 1
    },
    {
      "id": "chest",
      "type": "decimal",
      "labelKey": "chest",
      "required": true,
      "unit": "inch",
      "order": 2
    },
    {
      "id": "collar_style",
      "type": "select",
      "labelKey": "collar_style",
      "required": false,
      "options": ["simple", "ban", "shirt_collar"],
      "order": 3
    }
  ]
}
```

Measurement values should be stored separately from template definitions.

**Important:** Numeric values must be normalized or stored with explicit measurement units to avoid confusion when unit preferences change.

---

# 8. Order Management Module

## 8.1 Order Information

Each order should include:

- Order ID
- Shop ID
- Customer ID
- Order Number
- Order Date
- Expected Delivery Date
- Garment Type
- Quantity
- Measurement Reference
- Special Instructions
- Total Amount
- Advance Amount
- Remaining Amount
- Order Status

## 8.2 Order Statuses

Supported states:

1. New
2. In Progress
3. Ready
4. Delivered
5. Cancelled

## 8.3 Order Features

- Create order for existing customer.
- Create customer while placing an order.
- Attach one or multiple garment items.
- Attach relevant measurement versions to order items.
- Record advance payment.
- Calculate outstanding balance.
- Modify order status.
- Search and filter orders.
- View upcoming deliveries.
- Generate order receipt.

Financial amounts must be represented using safe fixed-decimal handling or minor currency units rather than imprecise floating-point calculations.

---

# 9. Receipt Generation

The application must generate customer receipts.

## 9.1 Receipt Content

- Shop logo
- Shop name
- Shop phone
- Shop address
- Receipt/order number
- Customer name
- Customer phone
- Order date
- Delivery date
- Garment details
- Total amount
- Advance received
- Remaining balance

## 9.2 Receipt Features

- Printable layout
- PDF generation
- Share through Android sharing options
- Optional measurement details
- Shop branding
- Appropriate RTL rendering for Urdu

---

# 10. Multi-Language System

## 10.1 Localization Technology

Recommended:

- i18next
- react-i18next
- expo-localization
- AsyncStorage for device language preference

## 10.2 Localization Rules

- Interface translations must be stored in dedicated language resource files.
- All static UI strings must use localization keys.
- No user-facing interface string should be hardcoded in a component.
- Language preference must be device-specific.
- Each device may use a different language while sharing the same shop data.
- Custom field labels should support localized values.
- Missing custom translations must use a documented fallback order.
- Customer-entered names and notes must remain unchanged unless edited by a user.

## 10.3 Layout Direction

RTL languages:

- Urdu
- Punjabi (Shahmukhi)
- Pashto
- Sindhi
- Arabic

LTR language:

- English

Layout direction must be handled explicitly, including navigation, alignment, icons, and forms.

---

# 11. Shop Configuration and Settings

The application must provide centralized shop configuration.

## 11.1 Shop Settings

These settings should synchronize across the shop's linked devices:

- Shop name
- Shop logo
- Shop address
- Phone number
- Currency
- Receipt settings
- Available measurement templates
- Default measurement template
- Employee and device permissions

## 11.2 Device Settings

These settings remain local to each device:

- App language
- Theme preference
- Device notification preferences
- Device name
- Local synchronization preferences

## 11.3 Settings Screen

Main sections:

- Language
- Shop Information
- Measurement Templates
- Customer Preferences
- Receipt Settings
- Backup and Restore
- Device Management
- Data Synchronization
- About Application

---

# 12. Offline-First Architecture

## 12.1 Primary Requirements

The application must operate locally without an internet connection.

SQLite is the primary database on every mobile device.

**Core operations must not depend on network availability:**

- Create customer
- Edit customer
- Save measurements
- Create order
- Update order
- Search records
- Generate local reports
- View previously synchronized data

## 12.2 Recommended Architecture

```text
React Native UI
       |
Application Services
       |
Repository Layer
       |
SQLite Database
       |
Local Change Log / Outbox
       |
Synchronization Engine
       |
Local Wi-Fi Transport
       |
Other Authorized Devices
```

UI components must never access raw database tables directly.

All database operations should use repositories or clearly defined data services.

## 12.3 SQLite Storage

Recommended library: expo-sqlite.

Required database capabilities:

- Schema migrations
- Transactions
- Indexed search
- Foreign keys
- Versioned records
- Change tracking
- Backup and restore

---

# 13. Multi-Device Synchronization

## 13.1 Objective

A shop owner may operate the same shop from 2–3 Android devices.

Example:

- Device A — Shop Owner
- Device B — Tailor
- Device C — Assistant

All authorized devices must eventually receive the same shop records when synchronization is possible.

## 13.2 Initial Synchronization Model

**Recommended MVP Approach:** Primary-device local Wi-Fi synchronization.

- Each mobile device maintains its own SQLite database.
- One authorized device acts as the shop's primary synchronization node.
- Other devices connect to that node over the same local Wi-Fi network.
- Changes are stored locally first.
- Devices exchange new changes when connectivity is available.
- Local operations remain available when disconnected.

The primary device must be reachable for synchronization, but secondary devices must remain usable offline.

## 13.3 Device Pairing

Device registration flow:

1. Shop owner opens **Device Management**.
2. Owner selects **Add Device**.
3. Application generates a time-limited pairing token.
4. Owner displays a QR code.
5. New device scans QR code.
6. Devices establish local connectivity.
7. Existing authorized device approves pairing.
8. Secure shop credentials and initial data are provisioned.
9. Device becomes a member of the shop.

A QR code alone must not provide unrestricted access.

Pairing must involve authenticated approval and secure key exchange.

## 13.4 Synchronization Data

Synchronize:

- Shop configuration
- Customers
- Measurement templates
- Template versions
- Customer measurements
- Orders
- Order items
- Payments
- Relevant receipt metadata

Device-specific settings must not synchronize.

## 13.5 Change Tracking

Each synchronized record must include:

- Unique Record ID
- Shop ID
- Created At
- Updated At
- Record Version
- Last Modified Device ID
- Deleted/Archived Marker where applicable

Maintain a separate synchronization outbox or change log.

Use UUIDs for record identification to avoid collisions between devices.

Do not depend exclusively on device timestamps for synchronization ordering.

## 13.6 Conflict Resolution

Conflicts occur when two devices modify the same record independently.

Example:

- Device A changes chest measurement to 40.
- Device B changes chest measurement to 42.
- Both devices reconnect.

The system must not silently discard important measurement changes.

**Required policy:**

- Detect concurrent changes.
- Automatically merge unrelated changes when safe.
- Preserve competing versions of sensitive measurements.
- Provide an understandable conflict-resolution interface where necessary.
- Record resolution outcomes.

Last-write-wins must not be the universal conflict policy.

## 13.7 Synchronization States

The UI must display:

- Synced
- Pending Changes
- Syncing
- Connection Unavailable
- Conflict Detected
- Sync Failed

The application must support both automatic and manual synchronization.

## 13.8 Important Platform Constraint

A mobile-hosted local sync server may be suspended when Android backgrounds the application.

The MVP must not promise uninterrupted background synchronization.

The implementation must test local server hosting, reconnection, screen locking, Android lifecycle behavior, and battery optimization.

If persistent synchronization is required later, a dedicated local hub or optional cloud relay may be considered.

A shared login across devices in this design means shop membership established through secure local pairing, not an internet-based global account.

---

# 14. Backup and Restore

## 14.1 Backup Requirements

The application must allow:

- Manual backup
- Full SQLite data export
- Template backup
- Shop settings backup
- Restore from backup
- Backup sharing through the Android system

## 14.2 Backup Format

Backup packages should contain:

- Database snapshot
- Database schema version
- Shop metadata
- Referenced local assets such as shop logos
- Manifest/checksum

Backups containing customer information must support encryption and safe handling.

## 14.3 Restore Requirements

- Validate backup compatibility.
- Detect corrupted or incomplete packages.
- Display a confirmation before replacing existing data.
- Prevent accidental cross-shop data merging.
- Support version migration when technically possible.
- Preserve transactional consistency.
- Provide a clear restore success or failure result.

---

# 15. Database Design

## 15.1 Core Entities

```text
Shops
  |
  +-- ShopSettings
  |
  +-- Devices
  |
  +-- ShopUsers
  |
  +-- Customers
  |      |
  |      +-- CustomerMeasurements
  |      |
  |      +-- Orders
  |              |
  |              +-- OrderItems
  |              |
  |              +-- Payments
  |
  +-- MeasurementTemplates
  |      |
  |      +-- TemplateVersions
  |              |
  |              +-- TemplateFields
  |
  +-- SyncChanges
  |
  +-- SyncConflicts
  |
  +-- BackupHistory
```

## 15.2 Data Design Principles

- Use UUID primary keys.
- Scope all shop-owned records by Shop ID.
- Enforce foreign key relationships.
- Use migrations for schema changes.
- Index frequently searched fields.
- Preserve measurement history.
- Preserve template version history.
- Support soft deletion where synchronization requires tombstones.
- Ensure sensitive local data can be encrypted as needed.
- Separate domain models from persistence models.

---

# 16. Technical Architecture

## 16.1 Technology Stack

| Component | Technology |
|---|---|
| Mobile Framework | Expo / React Native |
| Language | TypeScript |
| Navigation | Expo Router |
| Local Database | expo-sqlite |
| Forms | React Hook Form |
| Validation | Zod |
| State Management | Zustand |
| Localization | i18next |
| UI Components | Custom Components / React Native Paper |
| QR Scanner | expo-camera |
| PDF and Printing | Compatible Expo print/share APIs |
| Local Synchronization | LAN HTTP API / Sync Protocol |
| Unit Testing | Jest |
| App Testing | React Native Testing Library |
| End-to-End Testing | Maestro or equivalent |
| Builds | EAS Build or local Android builds |

Native modules may be necessary for local network discovery and device-hosted server functionality. Compatibility with the selected Expo SDK must be verified before committing to a transport implementation.

## 16.2 Suggested Project Structure

```text
src/
├── app/
│   ├── onboarding/
│   ├── dashboard/
│   ├── customers/
│   ├── measurements/
│   ├── templates/
│   ├── orders/
│   ├── settings/
│   └── sync/
│
├── components/
│   ├── ui/
│   ├── forms/
│   ├── measurements/
│   └── layout/
│
├── features/
│   ├── shop/
│   ├── customers/
│   ├── templates/
│   ├── measurements/
│   ├── orders/
│   └── payments/
│
├── database/
│   ├── migrations/
│   ├── repositories/
│   ├── seeds/
│   └── connection.ts
│
├── localization/
│   ├── en.json
│   ├── ur.json
│   ├── pa-Arab.json
│   ├── ps.json
│   ├── sd.json
│   └── ar.json
│
├── services/
│   ├── sync/
│   ├── backup/
│   ├── printing/
│   └── security/
│
├── stores/
├── hooks/
├── types/
├── utils/
└── constants/
```

## 16.3 Engineering Standards

- Enable TypeScript strict mode.
- Separate presentation and business logic.
- Use reusable UI components.
- Centralize validation.
- Keep database access behind repositories.
- Implement schema migration scripts.
- Provide automated tests for domain services.
- Avoid hardcoded measurement field definitions in screens.
- Avoid coupling localization to stored business data.
- Document synchronization behavior and conflict policies.

---

# 17. UI/UX Requirements

## 17.1 Design Direction

The application should follow a modern, clean mobile design with Urdu-friendly typography.

Suggested visual identity:

- Primary: Deep emerald green
- Secondary: Dark navy
- Background: White / soft gray
- Cards: Rounded corners
- Icons: Simple line icons
- Inputs: Large touch-friendly controls
- Typography: Readable Urdu and English fonts

## 17.2 Interface Principles

1. Keep screens simple for non-technical users.
2. Avoid overly complex navigation.
3. Use clear visual hierarchy.
4. Provide large touch targets.
5. Support both RTL and LTR layouts.
6. Clearly mark required fields.
7. Provide inline validation.
8. Show explicit success and error feedback.
9. Avoid unnecessary animations.
10. Support common Android screen sizes.

## 17.3 Required Screens

| # | Screen |
|---|---|
| 1 | Welcome / Language Selection |
| 2 | Shop Information |
| 3 | Template Selection |
| 4 | Template Customization |
| 5 | Add/Edit Template Field |
| 6 | Template Preview |
| 7 | Dashboard |
| 8 | Customer List |
| 9 | Customer Details |
| 10 | Add/Edit Customer |
| 11 | Measurement Entry |
| 12 | Measurement Visual Guide |
| 13 | Create Order |
| 14 | Order Summary |
| 15 | Orders List |
| 16 | Receipt Preview |
| 17 | Settings |
| 18 | Device Management |
| 19 | Sync Status |
| 20 | Backup and Restore |

---

# 18. Security and Privacy

## 18.1 Requirements

- Store shop data locally by default.
- Do not require customers to register online.
- Do not collect customer data centrally.
- Restrict synchronization to authorized devices.
- Protect pairing credentials and device keys.
- Use encrypted local communication for synchronization.
- Use secure storage for credentials.
- Avoid storing passwords in plaintext.
- Do not log sensitive customer measurements or credentials.
- Provide backup encryption.
- Require confirmation before destructive operations.
- Establish appropriate shop-user access controls.

## 18.2 Multi-Shop Isolation

Each tailoring shop must maintain an independent data environment.

Data from Shop A must never synchronize to Shop B without an explicitly authorized migration or transfer process.

---

# 19. Non-Functional Requirements

## 19.1 Performance Targets

Target performance on supported mid-range Android devices:

| Operation | Target |
|---|---|
| App cold start | Under 3 seconds |
| Open customer list | Under 2 seconds |
| Search local customers | Under 1 second |
| Save measurement | Under 1 second |
| Load template | Under 1 second |
| Dashboard refresh | Under 2 seconds |

These are development targets, not guaranteed performance across all devices.

## 19.2 Scalability Targets

The MVP should be tested against:

- 50 independent shops (separate installations)
- At least 3 devices per shop
- At least 5,000 customer records per shop
- At least 20,000 order records per shop
- At least 100 measurement templates and versions per shop

These are test targets; no central server is needed simply because additional independent shops install the app.

## 19.3 Reliability Requirements

- Prevent data loss during app interruption.
- Use database transactions.
- Preserve pending changes until acknowledged.
- Make synchronization idempotent.
- Support safe retry of failed operations.
- Keep locally created data available during network failures.
- Handle application upgrades through migrations.

---

# 20. Pilot Testing Plan

## Phase 1 — Local Development

Validate:

- Onboarding
- Localization
- Template builder
- Customer registration
- Measurement entry
- Order creation
- Backup and restore

## Phase 2 — Multi-Device Testing

Use three real Android devices.

Test:

- Initial device pairing
- Initial database replication
- Automatic synchronization
- Manual synchronization
- Device disconnection
- Duplicate message handling
- Concurrent customer updates
- Concurrent measurement updates
- Primary device unavailability
- Reconnection and conflict resolution

## Phase 3 — Pilot With 5 Tailors

Each pilot shop should test:

- Shop configuration
- Ready-made templates
- Custom fields
- Customer search
- Measurement registration
- New orders
- Receipts
- Backup and restore
- Synchronization where multiple devices are available

Collect feedback on:

- Ease of use
- Missing measurement fields
- Urdu translation quality
- Speed
- Form usability
- Reliability
- Data recovery

## Phase 4 — Commercial Release

After fixing pilot issues:

- Stabilize the application.
- Complete Android testing.
- Prepare the Play Store listing.
- Complete applicable Google Play testing and policy requirements.
- Set up support and update procedures.
- Prepare deployment for additional shops.

---

# 21. MVP Acceptance Criteria

The MVP is considered ready for pilot use when all of the following are met:

**Onboarding**

- User can complete first-time setup without internet.
- User can save and edit shop configuration.
- User can select and activate measurement templates.

**Localization**

- All six configured languages are selectable.
- Every released language has reviewed translations for supported screens.
- RTL and LTR layouts display correctly.

**Templates**

- At least three predefined templates are available.
- User can create a custom template.
- User can add, remove, and reorder fields.
- User can mark fields required or optional.
- Saved measurements remain readable after template modifications.

**Customers**

- User can create and search customers.
- User can store multiple measurement entries for a customer.
- Customer history is preserved.

**Orders**

- User can create an order.
- User can set a delivery date.
- User can record an advance.
- Remaining balance is calculated correctly.
- User can change order status.
- User can generate a receipt.

**Offline Operation**

- All primary shop operations work without internet.
- Data persists after app restart.
- Backup and restore work with valid backup files.

**Synchronization**

- Three authorized devices can join one shop.
- Offline changes are retained.
- Pending changes synchronize after reconnection.
- Duplicate events do not create duplicate business records.
- Concurrent measurement conflicts are detected and preserved.
- Synchronization failure does not delete valid local data.

**Quality**

- No known critical data-loss defects.
- No known critical security defects.
- Database migrations are tested.
- Core business operations have automated tests.
- Pilot users can operate the app without developer assistance for routine tasks.

---

# 22. Development Phases and Estimated Timeline

Estimates assume one experienced developer using Codex or Claude Code, with sufficient time for testing.

| Phase | Deliverables | Estimate |
|---|---|---|
| 1 | Project setup, navigation, localization | 1–2 days |
| 2 | Shop onboarding and configuration | 1–2 days |
| 3 | Template builder and dynamic forms | 3–5 days |
| 4 | Customer and measurement management | 2–3 days |
| 5 | Orders, payments, and receipts | 2–3 days |
| 6 | Backup and restore | 1–2 days |
| 7 | Local Wi-Fi device synchronization | 5–10 days |
| 8 | Testing, fixes, and pilot hardening | 4–7 days |

**Estimated core single-device MVP:** 1–2 weeks.

**Estimated offline multi-device pilot:** Approximately 3–5 weeks.

A commercial-quality release may require additional time depending on sync reliability, Android device compatibility, language validation, and defects discovered in testing.

---

# 23. Product Success Metrics

During the pilot, measure:

- Number of active tailoring shops
- Number of customers registered
- Number of orders recorded
- Percentage of completed onboarding flows
- Number of custom templates created
- Average time to record a measurement
- Synchronization success rate
- Number of unresolved synchronization conflicts
- Number of confirmed data-loss incidents
- User satisfaction and feedback

**Critical target:** Zero known reproducible data-loss defects before broader commercial release.

---

# 24. Risks and Mitigation

| Risk | Mitigation |
|---|---|
| Mobile device lost | Encrypted backup and recovery |
| Conflicting offline edits | Version tracking and conflict resolution |
| Primary device unavailable | Continue local operation and queue changes |
| Android background restrictions | Foreground synchronization and lifecycle testing |
| Custom template breaks old records | Immutable template versions |
| Poor Urdu rendering | Device testing and appropriate fonts |
| Data corruption during restore | Validation and transactional restore |
| Unauthorized device access | Secure pairing and revocation |
| Complex configuration | Guided onboarding and sensible defaults |
| Maintenance complexity | Modular architecture and automated tests |

---

# 25. Future Roadmap

## Version 1.0

- Offline-first Android app
- Six languages
- Shop configuration
- Measurement templates
- Dynamic forms
- Customer management
- Order management
- Receipts
- Backup and restore
- Local Wi-Fi synchronization

## Version 1.1

- Improved reports
- Measurement illustration library
- Advanced template sharing
- Enhanced sync conflict management
- Improved device permissions

## Version 2.0

- Optional cloud synchronization
- Remote device access
- Cross-device account recovery
- Subscription/licensing management
- Optional web dashboard
- Advanced analytics

---

# 26. Final Product Requirements Summary

Tailor Master must be a configurable, multilingual, offline-first mobile tailoring management system.

Its primary differentiators are:

1. **Customizable Measurement Templates:** Tailors can create, modify, duplicate, and reuse garment measurement forms.

2. **Multilingual Experience:** Urdu, English, Punjabi, Pashto, Sindhi, and Arabic with appropriate layout directions.

3. **Offline-First Operation:** Core functionality is available without a cloud database or internet access.

4. **Local Multi-Device Synchronization:** Multiple devices in the same shop can exchange data over a local Wi-Fi connection, with secure pairing and conflict handling.

5. **Complete Shop Configuration:** Each shop can customize branding, business information, measurement templates, and receipt settings.

6. **Maintainable Architecture:** The system must use Expo, React Native, TypeScript, SQLite, modular services, versioned schemas, and automated testing.

**Primary Development Priority:** Build a reliable dynamic measurement template engine and single-device offline workflow before implementing complex multi-device synchronization.

**End of PRD — Version 1.0**
