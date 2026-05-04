
const mongoose = require('mongoose');
const path = require('path');
const dotenv = require('dotenv');

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/token_db';

const JobCategorySchema = new mongoose.Schema({
  name: { type: String, required: true },
  icon: String,
  imageUrl: String,
  subCategories: [{ name: String, icon: String }]
}, { collection: 'jobcategories' });
const JobCategory = mongoose.model('JobCategory', JobCategorySchema);

async function check() {
  try {
    await mongoose.connect(uri);
    console.log('Connected to DB');
    const categories = await JobCategory.find();
    console.log('Total Categories in DB:', categories.length);
    categories.forEach(c => console.log('- ' + c.name));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

check();
