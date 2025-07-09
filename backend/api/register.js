const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { name, email, password, phone } = req.body;
  if (!name || !email || !password || !phone) {
    return res.status(400).json({ error: 'Name, email, phone, and password are required' });
  }

  // Check if user already exists
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return res.status(409).json({ error: 'User already exists' });
  }

  // Create user with STUDENT role
  const user = await prisma.user.create({
    data: {
      name,
      email,
      password, // In production, hash the password!
      phone,
      role: 'STUDENT'
    }
  });

  res.status(201).json({ id: user.id, email: user.email, role: user.role, phone: user.phone });
}