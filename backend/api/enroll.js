const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  try {
    // Student: Enroll in a course
    if (req.method === 'POST' && !req.body.followUp) {
      const { studentId, courseId } = req.body;
      if (!studentId || !courseId) return res.status(400).json({ error: "studentId and courseId are required" });

      // Prevent duplicate enrollment
      const exists = await prisma.courseEnrollment.findFirst({
        where: { studentId, courseId }
      });
      if (exists) return res.status(400).json({ error: "Already enrolled" });

      const enrollment = await prisma.courseEnrollment.create({
        data: { studentId, courseId, status: 'LEAD' }
      });
      return res.status(201).json(enrollment);
    }

    // Staff: Add follow-up to an enrollment
    if (req.method === 'POST' && req.body.followUp) {
      const { enrollmentId, type, dateTime, remarks } = req.body.followUp;
      if (!enrollmentId || !type || !dateTime)
        return res.status(400).json({ error: "enrollmentId, type, and dateTime are required" });
      const followUp = await prisma.followUp.create({
        data: { enrollmentId, type, dateTime: new Date(dateTime), remarks }
      });
      return res.status(201).json(followUp);
    }

    // Student: Get my enrollments OR Staff: Get all enrollments
    if (req.method === 'GET') {
      const { studentId, all, enrollmentId } = req.query;

      // Get follow-ups for an enrollment
      if (enrollmentId) {
        const followUps = await prisma.followUp.findMany({
          where: { enrollmentId: Number(enrollmentId) },
          orderBy: { dateTime: 'desc' }
        });
        return res.json(followUps);
      }

      if (all === "1") {
        // Return all enrollments with student and course info
        const enrollments = await prisma.courseEnrollment.findMany({
          include: { student: true, course: true }
        });
        return res.json(enrollments);
      }
      if (!studentId) return res.status(400).json({ error: "studentId is required" });
      const enrollments = await prisma.courseEnrollment.findMany({
        where: { studentId: Number(studentId) },
        include: { student: true, course: true }
      });
      return res.json(enrollments);
    }

    // Staff: Update enrollment status
    if (req.method === 'PUT') {
      const { enrollmentId, status } = req.body;
      if (!enrollmentId || !status) return res.status(400).json({ error: "enrollmentId and status are required" });
      const updated = await prisma.courseEnrollment.update({
        where: { id: enrollmentId },
        data: { status }
      });
      return res.json(updated);
    }

    res.status(405).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};