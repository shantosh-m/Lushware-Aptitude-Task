const dotenv = require('dotenv');
dotenv.config();
const connectDB = require('./config/db');
const Asset = require('./models/Asset');
const Technician = require('./models/Technician');
const WorkOrder = require('./models/WorkOrder');
const PreventiveTask = require('./models/PreventiveTask');
const User = require('./models/User');

(async function seed(){
  await connectDB();
  await Promise.all([
    Asset.deleteMany({}), Technician.deleteMany({}), WorkOrder.deleteMany({}), PreventiveTask.deleteMany({}), User.deleteMany({})
  ]);

  const admin = new User({ email: 'admin@example.com', name: 'Admin', role: 'admin', passwordHash: 'temp' });
  await admin.setPassword('Passw0rd!'); await admin.save();

  const residentUser = new User({ email: 'resident@example.com', name: 'Resident User', role: 'resident', passwordHash: 'temp' });
  await residentUser.setPassword('ResidentPass1!'); await residentUser.save();

  console.log('Seed complete');
  process.exit(0);
})();
