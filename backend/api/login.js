const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', ['POST']);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  }

  const { email, password } = req.body;
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  // Find user by email
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Check password and allow only STAFF, STUDENT, or ADMIN
  if (user.password !== password) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  // Only allow login for staff, student, or admin roles
  if (!['STAFF', 'STUDENT', 'ADMIN'].includes(user.role)) {
    return res.status(403).json({ error: 'Unauthorized role' });
  }

  // Return user info (never return password)
  res.status(200).json({
    id: user.id,
    email: user.email,
    role: user.role,
    name: user.name,
    phone: user.phone
  });
};