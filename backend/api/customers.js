const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    // Get all customers
    const customers = await prisma.customer.findMany();
    res.status(200).json(customers);
  } else if (req.method === 'POST') {
    // Add a new customer
    const { name, email } = req.body;
    if (!name || !email) {
      return res.status(400).json({ error: 'Name and email are required' });
    }
    const { added_by_user_id = 1 } = req.body; // fallback to 1 if not provided
    const customer = await prisma.customer.create({
      data: { name, email, added_by_user_id },
    });
    res.status(201).json(customer);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
