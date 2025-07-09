// backend/api/admin-login.js
const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).end();
  const { email, password, adminCode } = req.body;
  if (adminCode !== process.env.ADMIN_CODE) return res.status(403).json({ error: "Forbidden" });

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || user.role !== 'ADMIN' || user.password !== password) {
    return res.status(401).json({ error: "Invalid credentials" });
  }
  res.status(200).json({ id: user.id, email: user.email, role: user.role, name: user.name });
};