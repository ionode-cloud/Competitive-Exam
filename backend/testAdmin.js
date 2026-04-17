const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config();

const AdminSchema = new mongoose.Schema({
  email: { type: String, required: true },
  password: { type: String, required: true },
  plainPassword: { type: String }
});

const Admin = mongoose.model('Admin', AdminSchema);

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    const admins = await Admin.find();
    console.log(JSON.stringify(admins, null, 2));
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
