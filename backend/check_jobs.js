const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/dummy_db';

const JobPostSchema = new mongoose.Schema({
  title: String,
  company: String,
  status: String,
  paymentInfo: mongoose.Schema.Types.Mixed
});
const JobPost = mongoose.model('JobPost', JobPostSchema);

async function check() {
  await mongoose.connect(uri);
  const jobs = await JobPost.find().exec();
  console.log('Total Jobs in DB:', jobs.length);
  jobs.forEach(j => {
    console.log(`- ${j.title} at ${j.company} | Status: ${j.status}`);
  });
  await mongoose.disconnect();
}

check();
