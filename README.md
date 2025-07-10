# CRM Student-Staff-Course Management App

## 📚 Overview

This is a simple CRM (Customer Relationship Management) web application for managing student enrollments, course progress, and CRM stages (Lead, Follow-up, Payment, Admitted, Rejected).  
It features **role-based dashboards** for Students, Staff, and Admins, and supports full tracking of course enrollments, status changes, and follow-up actions.

---

## 🛠️ Tech Stack

- **Frontend:** React (Vite), JavaScript, CSS
- **Backend:** Node.js, Express.js
- **ORM:** Prisma
- **Database:** MySQL
- **API:** RESTful endpoints
- **Other:** JWT (for authentication, if implemented), dotenv

---

## 🚀 Features

### 1. **Admin Dashboard**
- Add, edit, delete courses.
- Add staff and students manually (via SQL or UI).

### 2. **Student Dashboard**
- View all available courses and enroll.
- See "My Courses" with CRM status (LEAD, FOLLOWUP, PAYMENT, ADMITTED, REJECTED).
- View all follow-up remarks added by staff for their enrollments.
- Status is **read-only** for students.

### 3. **Staff Dashboard**
- View all student enrollments with student and course info.
- Change enrollment status (only allowed transitions, but can also revert if needed).
- Add follow-ups (Type: Call, Email, Visit, Message; Date & Time; Remarks) for each enrollment.
- View follow-up history for each enrollment.

### 4. **CRM Stages**
- Status transitions:  
  `LEAD → FOLLOWUP → PAYMENT → ADMITTED/REJECTED`
- Only staff can change status and add follow-ups.

---

## ⚙️ How Features Are Implemented

- **Role-based Dashboards:**  
  Rendered based on user role after login.

- **Course Management:**  
  Admin can CRUD courses via `/api/admin/courses`.

- **Enrollment:**  
  Students enroll via `/api/enroll` (POST).  
  Staff can view all enrollments via `/api/enroll?all=1`.

- **Status Management:**  
  Staff can update status via `/api/enroll` (PUT).  
  Only allowed transitions are shown in the dropdown.

- **Follow-ups:**  
  Staff add follow-ups via `/api/enroll` (POST with `followUp` object).  
  All follow-ups for an enrollment can be fetched via `/api/enroll?enrollmentId=...`.

- **Student View:**  
  Students see their enrollments and all follow-up remarks.

---

## 🗄️ Prisma Schema

```prisma
generator client {
  provider = "prisma-client-js"
  output   = "../generated/prisma"
}

datasource db {
  provider = "mysql"
  url      = env("DATABASE_URL")
}

model User {
  id       Int                @id @default(autoincrement())
  email    String             @unique
  name     String
  password String
  role     Role               @default(STAFF)
  phone    String?
  courses  CourseEnrollment[]
  leads    Lead[]             @relation("UserLeads")
}

model Lead {
  id             Int        @id @default(autoincrement())
  name           String
  email          String
  phone          String
  parentContact  String?
  courseInterest String
  source         String
  status         LeadStatus @default(LEAD)
  assignedToId   Int?
  createdAt      DateTime   @default(now())
  admission      Deal?
  assignedTo     User?      @relation("UserLeads", fields: [assignedToId], references: [id])
  @@index([assignedToId], map: "Lead_assignedToId_fkey")
}

model Course {
  id          Int                @id @default(autoincrement())
  name        String
  description String?
  enrollments CourseEnrollment[]
}

model CourseEnrollment {
  id        Int        @id @default(autoincrement())
  student   User       @relation(fields: [studentId], references: [id])
  studentId Int
  course    Course     @relation(fields: [courseId], references: [id])
  courseId  Int
  status    LeadStatus @default(LEAD)
  followUps FollowUp[]
}

model FollowUp {
  id           Int              @id @default(autoincrement())
  enrollment   CourseEnrollment @relation(fields: [enrollmentId], references: [id])
  enrollmentId Int
  type         String
  dateTime     DateTime
  remarks      String?
  createdAt    DateTime         @default(now())
}

model Deal {
  id     Int    @id @default(autoincrement())
  course String
  fee    Float
  leadId Int    @unique
  status String
  lead   Lead   @relation(fields: [leadId], references: [id])
}

enum Role {
  ADMIN
  STAFF
  STUDENT
}

enum LeadStatus {
  LEAD
  FOLLOWUP
  PAYMENT
  ADMITTED
  REJECTED
}
```

---

## 🏁 Getting Started

1. **Clone the repo and install dependencies:**
   ```sh
   npm install
   ```

2. **Set up your `.env` with your MySQL connection string.**

3. **Run migrations:**
   ```sh
   npx prisma migrate dev
   ```

4. **Start backend and frontend:**
   ```sh
   # In /backend
   node server.js

   # In /frontend
   npm run dev
   ```

5. **Add admin/staff/student users and courses via SQL or UI.**

---

## 📝 Notes

- Make sure your Node.js version is 18+ for Vite compatibility.
- All status and follow-up logic is enforced in both backend and frontend.
- For production, always secure your API endpoints and hash passwords.

---

**Enjoy
