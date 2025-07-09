const { PrismaClient } = require('../../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  try {
    // GET all staff
    if (req.method === 'GET') {
      const staff = await prisma.user.findMany({
        where: { role: 'STAFF' }
      });
      return res.json(staff);
    }

    // CREATE staff
    if (req.method === 'POST') {
      const { name, email, password, phone } = req.body;
      if (!name || !email || !password) return res.status(400).json({ error: "Name, email, and password are required" });
      const staff = await prisma.user.create({
        data: { name, email, password, phone, role: 'STAFF' }
      });
      return res.status(201).json(staff);
    }

    // UPDATE staff
    if (req.method === 'PUT') {
      const { id, name, email, password, phone } = req.body;
      if (!id) return res.status(400).json({ error: "Staff id is required" });
      const staff = await prisma.user.update({
        where: { id },
        data: { name, email, password, phone }
      });
      return res.json(staff);
    }

    // DELETE staff
    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) return res.status(400).json({ error: "Staff id is required" });
      await prisma.user.delete({ where: { id } });
      return res.json({ success: true });
    }

    res.status(405).end();
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};