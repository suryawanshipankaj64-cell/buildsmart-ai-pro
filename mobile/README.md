# 🏗️ BuildSmart AI-Pro — Mobile Companion (React Native / Expo)

A production-ready mobile application built for site engineers, project managers, and subcontractors on active construction sites. Designed with a **Dark Blueprint / Technical Architecture Theme** and deep integration with the **Next.js 14 + Prisma + NextAuth** backend.

---

## 🎨 Application Identity & Color Tokens

- **Project Name:** BuildSmart AI-Pro Mobile
- **Design Style:** Dark Blueprint / Technical Architecture Grid
- **Color Palette Tokens:**
  - **Background Deep Navy:** `#071224` & `#0B192C`
  - **Card Surface:** `#122542`
  - **Blueprint Lines / Borders:** `#2A4A6B`
  - **Primary Accent (Signal Teal):** `#2DBF9E`
  - **Secondary / Info (Signal Blue):** `#1A73E8`
  - **Outflow / Expense (Signal Amber):** `#F59E0B`
  - **Critical / Delete (Signal Coral):** `#EF4444`
  - **Text Primary (Paper White):** `#F5F3ED`
  - **Text Muted (Signal Slate):** `#8EABC7`

---

## 🚀 Features & Modules

1. **Dashboard (`screens/DashboardScreen.tsx`)**
   - Profile greeting with dynamic engineer role and online sync status.
   - Live Weather Telemetry widget (Temperature, condition, humidity, wind speed, construction advisories).
   - 2x3 Metric Cards Matrix (Active Projects, Total Budget formatted in Cr/Lakhs, Logged Expenses, Average Progress %, AI Risk Index, Notifications).
   - Recent Project Card Preview with mini progress bar and quick inspection.

2. **Project Progress & Phase Supervision (`screens/ProjectProgressScreen.tsx`)**
   - Overall physical execution progress card with visual fill bar.
   - Subcontractor trade pill filters (*All Trades, Civil Contractor, Plumbing Lead, Electrician, Carpentry*).
   - Phase progress list (*Planning, Substructure & Foundation, Superstructure, Brickwork, MEP Rough-ins, Finishing*).
   - Interactive **`TaskProofModal`**:
     - Status selector pills (*To do, In progress, Done*)
     - Visual progress percentage stepper controls
     - Proof-of-work photo upload with automated GPS geotagging
     - Field remarks / site notes textarea
     - Direct `PATCH /api/tasks/:id` synchronization.

3. **Direct Expense Logger (`screens/ExpenseEntryScreen.tsx`)**
   - Direct transaction logger for site purchases.
   - Category selector (*MATERIAL, LABOUR, EQUIPMENT, OVERHEADS, OTHER*).
   - Item description and numeric amount with float parsing.
   - Date picker with quick presets (*Today, Yesterday, Custom*).
   - Target project selector and recent audited outflow ledger.

4. **Blueprint & Document Vault (`screens/DocumentsScreen.tsx`)**
   - Document browser with search and category pills (*All, Plans, Permits, Contracts, Bills*).
   - Document list items with version badges (*v1.0, v2.1*), file size, and upload timestamps.
   - Selected document preview card with Download, Native Share, and Delete actions.
   - Full version audit log and metadata tagging.
   - **`UploadDocumentModal`** with Role Visibility Gating (*Admin, Engineer, Contractor, Customer*).

5. **Quick Record Drawer (`components/RecordDrawer.tsx`)**
   - Elevated bottom sheet triggered by the central elevated `(+)` action button.
   - 2x3 Quick-Action Grid:
     1. **Expense** (Direct debit logging)
     2. **Site Log** (Daily shift headcount and site log dispatch)
     3. **Phase Update** (Milestone progress adjustment)
     4. **Photo** (GPS-tagged proof of work capture)
     5. **Voice Note** (AI voice memo recorder and transcription)
     6. **Document** (Upload blueprint to vault)

6. **Authentication & Access Gating**
   - **`LoginScreen.tsx`**: JWT token authentication stored securely via `expo-secure-store`.
   - **`PendingApprovalScreen.tsx`**: Blocks dashboard access when `isApproved: false`, displaying pending audit notice and status check.

---

## 🛠️ Step-by-Step Setup & Running Guide

### 1. Install Dependencies
Open a terminal in the `mobile/` directory and install the packages:

```bash
cd mobile
npm install
```

### 2. Configure Backend Host IP
When running on a physical phone or emulator, set your computer's local IP address:

1. Find your computer's local IP (e.g. `ipconfig` on Windows or `ifconfig` on macOS):
   - Example: `192.168.1.15`
2. Start the Next.js backend server from the project root:
   ```bash
   cd ..
   npm run dev
   ```
   *(Backend starts on `http://localhost:3000`)*
3. In the mobile app login screen, tap **"Configure Server Host / IP"** and enter:
   - For Android Emulator: `http://10.0.2.2:3000/api`
   - For iOS Simulator: `http://localhost:3000/api`
   - For Physical Device (Expo Go): `http://192.168.x.x:3000/api`

### 3. Start Expo
Run the Expo development server:

```bash
npx expo start
```

### 4. Open the App
- **Android:** Press `a` in the terminal to launch in an Android Emulator.
- **iOS:** Press `i` in the terminal to launch in iOS Simulator.
- **Physical Device:** Scan the QR code using the **Expo Go** app (Android/iOS).
- **Web Browser:** Press `w` to preview in your browser.

---

## 🔑 Demo Login Accounts

| Role | Email | Password | Status |
|---|---|---|---|
| **Lead Site Engineer** | `engineer@buildsmart.ai` | `engineer123` | Approved (Active) |
| **Executive Admin** | `admin@buildsmart.ai` | `admin123` | Approved (Admin) |
| **Senior PM** | `pm@buildsmart.ai` | `pm123` | Approved (Active) |
| **Client** | `client@buildsmart.ai` | `client123` | Approved (Active) |

*(One-click demo buttons are provided on the login screen for instant credential population)*

