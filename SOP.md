# Standard Operating Procedure: Attendance & Calendar System

This document outlines the operational rules and features of the ABM Academy Attendance and Payroll Management System.

## 1. Employee Attendance Protocol

### 1.1 Shift Start (Clock-In)
- **Base Login Time**: Defined per employee in their profile settings (e.g., 9:30 AM).
- **Grace Period**: Employees have a standard 15-minute grace period.
- **On-Time Entry**: A login within the 15-minute window is marked as "Present".

### 1.2 Late Login & Permissions
- **Late Detection**: Any login after the grace period (e.g., 9:46 AM) is automatically flagged as "Late".
- **Automatic Permission Request**: 
  - The system calculates the delay from the *Base Login Time*.
  - Example: Login at 9:46 AM results in a 16-minute permission request.
  - Employees must provide a reason in the "Late Login Detected" dialog to proceed.
- **Approval Workflow**: Late logins remain in a "Pending" permission state until an Admin approves or rejects the reason.

### 1.3 Lunch Breaks
- **Protocol**: Employees must log "Lunch Out" and "Lunch In" during their designated break.
- **Monitoring**: Cumulative break time is tracked to ensure compliance with company policy.

---

## 2. Monthly Calendar (Employee View)

The calendar provides a 30/31-day overview of shift status using the following color codes:

| Color | Meaning | Description |
| :--- | :--- | :--- |
| **Indigo** | Holiday / Sunday | Company-wide off days. |
| **Emerald** | Present | On-time clock-in and full session completion. |
| **Amber** | Late / Half-Day | Late arrivals or sessions meeting half-day criteria. |
| **Rose** | Absent / Leave | Approved leaves or no session activity recorded. |

### 2.1 Interactivity
- **Hover/Click**: Hovering over any date displays a tooltip with:
  - Exact Check-In and Check-Out times.
  - Break status.
  - Leave or Permission reasons (if applicable).

---

## 3. Administrative Controls

### 3.1 Weekend Rules
Admins can globally configure how Saturdays are treated:
- **Holiday**: No operations; Saturday marked as Indigo.
- **Half Day**: 4-hour session required for "Full" attendance; marked as Amber.
- **Full Day**: Normal working day rules apply.

### 3.2 View/Edit Mode (Payroll Settings)
To prevent accidental changes to critical system limits:
1. **View Mode (Default)**: Settings are read-only.
2. **Edit Mode**: Click the **"Edit Settings"** button to unlock fields.
3. **Action**: After modifying, click **"Save Global Settings"** to persist or **"Cancel"** to revert.

---

## 4. System Maintenance
- **Global Multipliers**: Salary rate multipliers (Half-Day vs Full-Day) affect payroll disbursements. Use extreme caution when updating these values.
- **Limit Updates**: Monthly permission and leave quotas are reset on the 1st of every month based on these settings.

---

## 5. System Operational Flow

### 5.1 Onboarding & Setup
1. **Role Assignment**: Admin can add **Sub-admins** (with limited permissions) and **Employees**.
2. **Profile Configuration**: Define individual `baseSalary` and `timingSettings` (Login, Logout, Grace, Lunch) for each employee.
3. **Working Days**: Admin configures global working days and Saturday rules.

### 5.2 Daily Operational Loop
1. **Clock-In**: Employee selects mode (WFH/WFO).
   - If late (> Grace Period): Required to provide **Late Login Reason** -> creates a Permission Request.
2. **Lunch Session**: 
   - Employee marks **Lunch Out**.
   - Employee marks **Lunch In**.
   - If Duration > 45 mins: Required to provide **Delay Reason** -> creates a Lunch Delay Request.
3. **Clock-Out**: Employee marks end of session.

### 5.3 Leave & Permission Policy
- **Casual Leave (CL)**: Limited to 1 day/month.
- **Monday/Saturday Leave**: Always results in **Double LOP** (2 days deduction). It does not count as a casual leave.
- **Other Days Leave**: 1 day LOP. *Exception*: If total non-restricted leaves <= CL limit, no LOP is deducted.
- **Approvals**: Admin/Sub-admin reviews all Late Login, Lunch Delay, Early Logout, and Leave requests. Rejected requests may be postponed upon employee request.

### 5.4 Salary & Payroll Calculation (Month-End)
Final Salary is calculated automatically based on attendance data:
1. **Daily Rate**: `Base Salary / Total Days in Month` (including Sundays & holidays).
2. **Deductions (LOP)**:
   - **Restricted Day Absence (Mon/Sat)**: **2 Days Deduction (Double LOP)** regardless of whether the leave was approved or unapproved.
   - **General Absence (Tue-Fri)**: **1 Day Deduction** regardless of approval, **unless** it counts as an available Casual Leave (within monthly limit).
   - **Permission Tiers**: 
     - Tier 1 (globally set, e.g., > 3hrs): **0.5 Day Deduction**.
     - Tier 2 (globally set, e.g., > 5hrs): **1.0 Day Deduction**.
   - **Early Logout**: 
     - Time between logout and lunch (1st half session) is added to **Permission minutes**. 
     - The second half session is marked as **Half-day Leave** (incurring 0.5 day LOP if no CL remains).
3. **Calculation Formula**: `Daily Rate * (DaysInMonth - TotalDeductionDays)`.

### 5.5 Support & Feedback
- **Complaints**: Employees can raise complaints directly within the system.
- **Tracking**: Employees see their "Estimated Earnings" in real-time on the tracker page.
