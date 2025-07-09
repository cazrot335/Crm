const { PrismaClient } = require('../generated/prisma');
const prisma = new PrismaClient();

module.exports = async function handler(req, res) {
  if (req.method === 'GET') {
    // Fetch all leads with assigned user and admission deal
    const leads = await prisma.lead.findMany({
      include: {
        assignedTo: true,
        admission: true,
        followUps: true,
      },
    });
    res.status(200).json(leads);
  } else if (req.method === 'POST') {
    // Create a new lead (for demo, assignedToId is optional)
    const { name, email, phone, parentContact, courseInterest, source, assignedToId } = req.body;
    if (!name || !email || !phone || !courseInterest || !source) {
      return res.status(400).json({ error: 'Missing required fields' });
    }
    const lead = await prisma.lead.create({
      data: {
        name,
        email,
        phone,
        parentContact,
        courseInterest,
        source,
        assignedToId,
      },
    });
    res.status(201).json(lead);
  } else {
    res.setHeader('Allow', ['GET', 'POST']);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}