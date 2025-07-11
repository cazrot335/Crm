// backend/api/admin/courses.js
const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  try {
    // GET all courses
    if (req.method === 'GET') {
      const courses = await prisma.course.findMany();
      return res.json(courses);
    }

    // CREATE course
    if (req.method === 'POST') {
      const { name, description } = req.body;
      if (!name) return res.status(400).json({ error: "Course name is required" });
      const course = await prisma.course.create({ data: { name, description } });
      return res.status(201).json(course);
    }

    // UPDATE course
    if (req.method === 'PUT') {
      const { id, name, description } = req.body;
      if (!id || !name) return res.status(400).json({ error: "Course id and name are required" });
      const course = await prisma.course.update({
        where: { id },
        data: { name, description }
      });
      return res.json(course);
    }

    // DELETE course
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Course id is required" });
      await prisma.course.delete({ where: { id } });
      return res.json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};