const express = require('express');
const bodyParser = require('body-parser');
const customersHandler = require('./api/customers.js');
const leadsHandler = require('./api/leads.js');
const registerHandler = require('./api/register.js');
const loginHandler = require('./api/login.js');
const staffHandler = require('./api/admin/staff.js');
const coursesHandler = require('./api/admin/courses.js');
const studentsHandler = require('./api/admin/students.js');
const cors = require('cors');
const adminLoginHandler = require('./api/admin-login.js');

const app = express();
app.use(cors({ origin: ['http://localhost:3000', 'http://localhost:5173'], credentials: true }));
app.use(bodyParser.json());

app.all('/api/customers', (req, res) => customersHandler(req, res));
app.all('/api/leads', (req, res) => leadsHandler(req, res));
app.all('/api/register', (req, res) => registerHandler(req, res));
app.all('/api/login', (req, res) => loginHandler(req, res));
app.all('/api/admin-login', (req, res) => adminLoginHandler(req, res));
app.all('/api/admin/staff', (req, res) => staffHandler(req, res));
app.all('/api/admin/courses', (req, res) => coursesHandler(req, res));
app.all('/api/admin/students', (req, res) => studentsHandler(req, res));

const PORT = 3001;
app.listen(PORT, () => {
  console.log(`Backend server running on http://localhost:${PORT}`);
});