const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  try {
    // GET all students (with enrolled courses)
    if (req.method === 'GET') {
      const students = await prisma.user.findMany({
        where: { role: 'STUDENT' },
        include: {
          courses: { include: { course: true } }
        }
      });
      return res.json(students);
    }

    // CREATE student
    if (req.method === 'POST') {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
      const student = await prisma.user.create({
        data: { name, email, password, phone, role: 'STUDENT' }
      });
      return res.status(201).json(student);
    }

    // UPDATE student
    if (req.method === 'PUT') {
      const { id, name, email, password, phone } = req.body;
      if (!id) return res.status(400).json({ error: "Student id is required" });
      const student = await prisma.user.update({
        where: { id },
        data: { name, email, password, phone }
      });
      return res.json(student);
    }

    // DELETE student
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Student id is required" });
      await prisma.user.delete({ where: { id } });
      return res.json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};