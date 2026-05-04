const express = require('express');
const mongoose = require('mongoose');
const { Schema } = mongoose;
const cors = require('cors');
const dotenv = require('dotenv');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const Razorpay = require('razorpay');
const crypto = require('crypto');
const nodemailer = require('nodemailer');

// Global error handlers to prevent silent crashes
process.on('uncaughtException', (err) => console.error('CRITICAL: Uncaught Exception:', err));
process.on('unhandledRejection', (reason, promise) => console.error('CRITICAL: Unhandled Rejection at:', promise, 'reason:', reason));

dotenv.config({ path: path.resolve(__dirname, '..', '.env.local') });

const app = express();
app.use(cors({
  origin: ['https://mern-jobportalproject.netlify.app', 'http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));
app.use(express.json());

// Request logger for debugging
app.use((req, res, next) => {
  console.log(`📡 [${new Date().toLocaleTimeString()}] ${req.method} ${req.url}`);
  next();
});

// Assets setup - Ensure uploads directory exists in backend
const uploadsDir = path.resolve(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// Email Transporter Setup
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'demo@gmail.com',
    pass: process.env.EMAIL_PASS || 'demo123'
  }
});
transporter.verify((err) => {
  if (err) console.warn('❌ Mail Server: Credentials potentially invalid', err.message);
  else console.log('✅ Mail Server: Ready to fly!');
});

// Multer for Resume/CV Uploads
const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + '-' + file.originalname.replace(/\s/g, '_'));
  }
});
const upload = multer({ storage });

// Database Connection
const uri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/token_db';
console.log('🔗 Attemping DB Connection with URI:', uri.substring(0, 20) + '...');
let isDbConnected = false;

let dbError = '';

mongoose.set('strictQuery', false);
mongoose.connect(uri)
  .then(async () => {
    console.log('✅ Connected to MongoDB Atlas Successfully');
    isDbConnected = true;
    dbError = '';
    // Only seed if the collection is empty - preserve admin changes
    // Intelligent Seeding: Add only missing categories
    console.log('🔍 Checking for missing categories...');
    for (const cat of fullCategories) {
      const exists = await JobCategory.findOne({ name: cat.name });
      if (!exists) {
        console.log(`🌱 Adding missing category: ${cat.name}`);
        await new JobCategory({
          name: cat.name,
          icon: cat.icon,
          subCategories: cat.subCategories
        }).save();
      }
    }
    const finalCount = await JobCategory.countDocuments();
    console.log(`✅ Job categories synced. Total: ${finalCount}`);
  })
  .catch(err => {
    console.error('❌ MongoDB Connection Failed:', err.message);
    isDbConnected = false;
    dbError = err.message;
  });

// Full 31-category list used for seeding
const fullCategories = [
  { name: 'Accounting / Finance', icon: 'payments', subCategories: [{ name: 'Accountant', icon: 'calculate' }, { name: 'Chartered Accountant', icon: 'workspace_premium' }, { name: 'Billing Clerk', icon: 'receipt' }, { name: 'Financial Analyst', icon: 'analytics' }] },
  { name: 'Automobile', icon: 'directions_car', subCategories: [{ name: 'Mechanic', icon: 'build' }, { name: 'Driver', icon: 'drive_eta' }, { name: 'Auto Electrician', icon: 'electric_bolt' }, { name: 'Body Shop Technician', icon: 'car_repair' }] },
  { name: 'Beauty / Salon', icon: 'face', subCategories: [{ name: 'Hairdresser', icon: 'content_cut' }, { name: 'Beautician', icon: 'spa' }, { name: 'Makeup Artist', icon: 'brush' }, { name: 'Nail Technician', icon: 'colorize' }] },
  { name: 'Cleaner / Housekeeper', icon: 'cleaning_services', subCategories: [{ name: 'House Cleaner', icon: 'home' }, { name: 'Commercial Cleaner', icon: 'business' }, { name: 'Laundry Worker', icon: 'local_laundry_service' }] },
  { name: 'Construction', icon: 'construction', subCategories: [{ name: 'Civil Engineer', icon: 'engineering' }, { name: 'Mason / Bricklayer', icon: 'foundation' }, { name: 'Carpenter', icon: 'handyman' }, { name: 'Painter', icon: 'format_paint' }] },
  { name: 'Cook / Chef', icon: 'restaurant', subCategories: [{ name: 'Head Chef', icon: 'restaurant_menu' }, { name: 'Sous Chef', icon: 'food_bank' }, { name: 'Baker', icon: 'bakery_dining' }, { name: 'Kitchen Helper', icon: 'kitchen' }] },
  { name: 'Customer Service / Call Centre', icon: 'support_agent', subCategories: [{ name: 'Call Centre Agent', icon: 'phone' }, { name: 'Customer Support Executive', icon: 'headset_mic' }, { name: 'Chat Support', icon: 'chat' }] },
  { name: 'Data Management & Analysis', icon: 'analytics', subCategories: [{ name: 'Data Entry Operator', icon: 'keyboard' }, { name: 'Data Analyst', icon: 'bar_chart' }, { name: 'Database Admin', icon: 'storage' }] },
  { name: 'Design', icon: 'draw', subCategories: [{ name: 'Graphic Designer', icon: 'design_services' }, { name: 'UI/UX Designer', icon: 'devices' }, { name: 'Interior Designer', icon: 'chair' }, { name: 'Fashion Designer', icon: 'checkroom' }] },
  { name: 'Driver / Delivery', icon: 'delivery_dining', subCategories: [{ name: 'Delivery Rider', icon: 'two_wheeler' }, { name: 'Truck Driver', icon: 'local_shipping' }, { name: 'Personal Driver', icon: 'directions_car' }] },
  { name: 'Education', icon: 'school', subCategories: [{ name: 'Primary Teacher', icon: 'child_care' }, { name: 'High School Teacher', icon: 'menu_book' }, { name: 'Academic Counselor', icon: 'psychology' }, { name: 'Librarian', icon: 'local_library' }] },
  { name: 'Engineering', icon: 'engineering', subCategories: [{ name: 'Mechanical Engineer', icon: 'settings' }, { name: 'Electrical Engineer', icon: 'electric_bolt' }, { name: 'Civil Engineer', icon: 'foundation' }, { name: 'Chemical Engineer', icon: 'science' }] },
  { name: 'Event Management & Operations', icon: 'event', subCategories: [{ name: 'Event Coordinator', icon: 'event_note' }, { name: 'Event Decorator', icon: 'celebration' }, { name: 'AV Technician', icon: 'videocam' }] },
  { name: 'Handyman / Technician', icon: 'handyman', subCategories: [{ name: 'Plumber', icon: 'plumbing' }, { name: 'AC Technician', icon: 'ac_unit' }, { name: 'Electrician', icon: 'electrical_services' }, { name: 'Painter', icon: 'format_paint' }] },
  { name: 'HR / Admin', icon: 'badge', subCategories: [{ name: 'HR Executive', icon: 'people' }, { name: 'Admin Assistant', icon: 'admin_panel_settings' }, { name: 'Recruitment Officer', icon: 'person_add' }] },
  { name: 'Information Technology', icon: 'computer', subCategories: [{ name: 'Software Developer', icon: 'code' }, { name: 'System Admin', icon: 'dns' }, { name: 'Data Entry Operator', icon: 'keyboard' }, { name: 'Technical Support', icon: 'support' }] },
  { name: 'Legal Services', icon: 'gavel', subCategories: [{ name: 'Lawyer', icon: 'account_balance' }, { name: 'Legal Assistant', icon: 'description' }, { name: 'Paralegal', icon: 'policy' }] },
  { name: 'Logistics & Distribution', icon: 'local_shipping', subCategories: [{ name: 'Warehouse Staff', icon: 'warehouse' }, { name: 'Logistics Coordinator', icon: 'route' }, { name: 'Inventory Manager', icon: 'inventory' }] },
  { name: 'Manufacturing / Warehouse', icon: 'factory', subCategories: [{ name: 'Production Worker', icon: 'precision_manufacturing' }, { name: 'Quality Inspector', icon: 'verified' }, { name: 'Forklift Operator', icon: 'forklift' }] },
  { name: 'Marine Captain / Crew', icon: 'directions_boat', subCategories: [{ name: 'Marine Captain', icon: 'anchor' }, { name: 'Deck Officer', icon: 'sailing' }, { name: 'Marine Engineer', icon: 'engineering' }] },
  { name: 'Marketing / Advertising', icon: 'campaign', subCategories: [{ name: 'Marketing Executive', icon: 'trending_up' }, { name: 'Digital Marketer', icon: 'ads_click' }, { name: 'Content Writer', icon: 'edit_note' }, { name: 'SEO Specialist', icon: 'manage_search' }] },
  { name: 'Media, Art & Entertainment', icon: 'movie', subCategories: [{ name: 'Journalist', icon: 'newspaper' }, { name: 'Photographer', icon: 'camera_alt' }, { name: 'Video Editor', icon: 'movie_edit' }, { name: 'Actor', icon: 'theater_comedy' }] },
  { name: 'Medical / Healthcare', icon: 'medical_services', subCategories: [{ name: 'Nurse', icon: 'local_hospital' }, { name: 'Lab Technician', icon: 'biotech' }, { name: 'Pharmacy Assistant', icon: 'medication' }, { name: 'Home Caretaker', icon: 'home_health' }] },
  { name: 'Real Estate', icon: 'apartment', subCategories: [{ name: 'Real Estate Agent', icon: 'real_estate_agent' }, { name: 'Property Manager', icon: 'domain' }, { name: 'Leasing Consultant', icon: 'key' }] },
  { name: 'Restaurant Operations', icon: 'lunch_dining', subCategories: [{ name: 'Restaurant Manager', icon: 'restaurant' }, { name: 'Waiter / Waitress', icon: 'room_service' }, { name: 'Cashier', icon: 'point_of_sale' }] },
  { name: 'Sales / Business Development', icon: 'trending_up', subCategories: [{ name: 'Sales Executive', icon: 'sell' }, { name: 'Business Dev Manager', icon: 'handshake' }, { name: 'Store Manager', icon: 'storefront' }, { name: 'Field Sales Rep', icon: 'map' }] },
  { name: 'Secretarial / Front Office', icon: 'desk', subCategories: [{ name: 'Receptionist', icon: 'front_desk' }, { name: 'Office Secretary', icon: 'edit_calendar' }, { name: 'Data Entry Clerk', icon: 'keyboard' }] },
  { name: 'Security / Guard', icon: 'security', subCategories: [{ name: 'Security Guard', icon: 'shield' }, { name: 'CCTV Operator', icon: 'videocam' }, { name: 'Bouncer', icon: 'security' }] },
  { name: 'Sports & Fitness', icon: 'fitness_center', subCategories: [{ name: 'Personal Trainer', icon: 'sports_gymnastics' }, { name: 'Yoga Instructor', icon: 'self_improvement' }, { name: 'Sports Coach', icon: 'sports' }] },
  { name: 'Travel & Hospitality', icon: 'hotel', subCategories: [{ name: 'Hotel Receptionist', icon: 'hotel' }, { name: 'Travel Agent', icon: 'flight' }, { name: 'Tour Guide', icon: 'tour' }, { name: 'Housekeeping', icon: 'cleaning_services' }] },
  { name: 'Others', icon: 'more_horiz', subCategories: [] },
];

// fallback memory store (matches the full list, used when DB is offline)
let memoryCategories = fullCategories.map((c, i) => ({ ...c, id: `cat-${i}`, _id: `cat-${i}` }));

// Models
const JobPost = mongoose.model('JobPost', new Schema({
  title: String, company: String, companyLogo: String, imageUrl: String, location: String, salary: String,
  type: { type: String, default: 'Full-Time' }, experience: String, education: String, description: String,
  requirements: [String], skills: [String], workMode: String, category: String,
  isFeatured: Boolean, status: { type: String, default: 'pending' },
  postedAt: String, recruiterEmail: String,
  paymentInfo: { planId: String, planName: String, amount: Number, method: String, paymentId: String, isVerified: { type: Boolean, default: false } }
}, { timestamps: true }));

const Application = mongoose.model('Application', new Schema({
  jobId: String, applicantName: String, applicantEmail: String, applicantMobile: String, resumeUrl: String, 
  qualification: String, expectedSalary: String,
  status: { type: String, default: 'Applied' }, appliedAt: { type: Date, default: Date.now }, score: { type: Number, default: 85 }
}));

const Conversation = mongoose.model('Conversation', new Schema({
  participantName: String, participantRole: String, participantAvatar: String, online: Boolean,
  lastMessage: String, lastMessageTime: String, unread: Boolean
}, { timestamps: true }));

const Message = mongoose.model('Message', new Schema({
  conversationId: { type: Schema.Types.ObjectId, ref: 'Conversation' },
  sender: String, text: String, time: String
}, { timestamps: true }));

const Plan = mongoose.model('Plan', new Schema({ role: String, name: String, price: Number, durationDays: Number, status: String, isRecommended: Boolean, features: [String], credits: Schema.Types.Mixed }));
const Subscription = mongoose.model('Subscription', new Schema({ 
  userId: String, 
  userName: String, 
  role: String, 
  planId: String, 
  planName: String, 
  startDate: String, 
  expiryDate: String, 
  status: { type: String, default: 'active' },
  creditsTotal: { type: Number, default: 0 },
  creditsUsed: { type: Number, default: 0 }
}));
const Transaction = mongoose.model('Transaction', new Schema({ userEmail: String, userName: String, planName: String, amount: Number, status: String, method: String, date: String, time: String }));
const Coupon = mongoose.model('Coupon', new Schema({ code: String, role: String, discountType: String, value: Number, validUntil: String, usageLimit: Number, usageCount: Number }));
const AuditLog = mongoose.model('AuditLog', new Schema({ adminName: String, action: String, details: String, timestamp: String }));
const Company = mongoose.model('Company', new Schema({ name: String, industry: String, status: { type: String, default: 'Active' }, email: String, website: String, activeJobs: { type: Number, default: 0 }, location: String, logoUrl: String }, { timestamps: true }));
const Candidate = mongoose.model('Candidate', new Schema({ 
  name: String, 
  role: String, 
  status: { type: String, default: 'Active' }, 
  email: String, 
  mobile: String, 
  experience: String, 
  skills: String, 
  resumeUrl: String,
  photoUrl: String,
  hasBoughtPlan: { type: Boolean, default: false }
}, { timestamps: true }));
const Notification = mongoose.model('Notification', new Schema({
  userEmail: String, title: String, message: String, type: { type: String, default: 'info' }, read: { type: Boolean, default: false }, timestamp: { type: Date, default: Date.now }
}));
const User = mongoose.model('User', new Schema({ username: String, email: String, password: { type: String, select: false }, role: String, phone: String, createdAt: { type: Date, default: Date.now } }));

const JobCategorySchema = new Schema({
  name: { type: String, required: true },
  icon: String,
  imageUrl: String,
  subCategories: [{ name: String, icon: String }]
}, { collection: 'jobcategories' });
const JobCategory = mongoose.model('JobCategory', JobCategorySchema);

const FlaggedItemSchema = new Schema({
  type: String,
  content: String,
  reason: String,
  priority: String,
  status: { type: String, default: 'Pending' },
  date: { type: String, default: () => new Date().toLocaleDateString() }
});
const FlaggedItem = mongoose.model('FlaggedItem', FlaggedItemSchema);

// Admin Auth
app.post('/api/admin/login', (req, res) => {
  const { username, password } = req.body;
  if (username === 'admin' && password === 'token_admin_2025') {
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Invalid credentials' });
});

let memoryJobs = [];
let memoryApplications = [];
let memoryCandidates = [];
let memoryPlans = [];
let memorySubscriptions = [];
let memoryTransactions = [];
let memoryCoupons = [];
let memoryAuditLogs = [];
let memoryCompanies = [];
let memoryFlaggedItems = [];
let memoryUsers = [];
let memoryNotifications = [];

const fallbackFile = path.resolve(__dirname, 'fallback.json');
try {
  if (fs.existsSync(fallbackFile)) {
    const data = JSON.parse(fs.readFileSync(fallbackFile, 'utf-8'));
    memoryJobs = data.jobs || [];
    memoryApplications = data.applications || [];
    memoryCandidates = data.candidates || [];
    if (data.categories && data.categories.length > 0) {
      memoryCategories = data.categories;
    }
    memoryPlans = data.plans || [];
    memorySubscriptions = data.subscriptions || [];
    memoryTransactions = data.transactions || [];
    memoryCoupons = data.coupons || [];
    memoryAuditLogs = data.auditLogs || [];
    memoryCompanies = data.companies || [];
    memoryFlaggedItems = data.flaggedItems || [];
    memoryUsers = data.users || [];
    memoryNotifications = data.notifications || [];
  }
} catch(e){}

const saveFallback = () => {
  try {
    fs.writeFileSync(fallbackFile, JSON.stringify({ 
      jobs: memoryJobs, 
      applications: memoryApplications, 
      categories: memoryCategories, 
      candidates: memoryCandidates,
      plans: memoryPlans,
      subscriptions: memorySubscriptions,
      transactions: memoryTransactions,
      coupons: memoryCoupons,
      auditLogs: memoryAuditLogs,
      companies: memoryCompanies,
      flaggedItems: memoryFlaggedItems,
      users: memoryUsers,
      notifications: memoryNotifications
    }, null, 2));
  } catch(e){}
};

// Jobs API
app.get('/api/jobs', async (_req, res) => {
  try { res.json(isDbConnected ? await JobPost.find({ status: 'active' }).sort({ createdAt: -1 }) : memoryJobs.filter(j => j.status === 'active')); }
  catch (e) {
    console.error('SERVER ERROR: /api/jobs:', e); 
    res.json([]); 
  }
});

app.get('/api/admin/jobs', async (_req, res) => {
  try { res.json(isDbConnected ? await JobPost.find().sort({ createdAt: -1 }) : memoryJobs); }
  catch (e) { 
    console.error('Error fetching /api/admin/jobs:', e.message);
    res.status(500).json({ error: e.message }); 
  }
});

app.post('/api/jobs', async (req, res) => {
  try { 
    if (isDbConnected) {
      const job = await new JobPost(req.body).save();
      
      // Auto-sync with Company collection
      if (req.body.company) {
        const updateData = { 
          industry: req.body.category, 
          location: req.body.location,
          status: 'Active' 
        };
        if (req.body.companyLogo) updateData.logoUrl = req.body.companyLogo;

        await Company.findOneAndUpdate(
          { name: req.body.company },
          { 
            $inc: { activeJobs: 1 },
            $set: updateData
          },
          { upsert: true, new: true }
        );
      }
      
      res.status(201).json(job); 
    } else {
      const newJob = { status: 'pending', ...req.body, _id: 'job_' + Date.now(), id: 'job_' + Date.now(), createdAt: new Date().toISOString() };
      memoryJobs.push(newJob);
      
      const compIdx = memoryCompanies.findIndex(c => c.name === req.body.company);
      if (compIdx !== -1) {
        memoryCompanies[compIdx].activeJobs = (memoryCompanies[compIdx].activeJobs || 0) + 1;
      } else {
        memoryCompanies.push({ name: req.body.company, activeJobs: 1, status: 'Active', createdAt: new Date().toISOString(), _id: 'comp_' + Date.now() });
      }
      
      saveFallback();
      res.status(201).json(newJob);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/jobs/:id', async (req, res) => {
  try { 
    if (isDbConnected) {
      res.json(await JobPost.findByIdAndUpdate(req.params.id, req.body, { new: true })); 
    } else {
      const idx = memoryJobs.findIndex(j => j._id === req.params.id || j.id === req.params.id);
      if (idx !== -1) {
        memoryJobs[idx] = { ...memoryJobs[idx], ...req.body };
        if (req.body['paymentInfo.paymentId']) {
          memoryJobs[idx].status = 'paid';
          memoryJobs[idx].paymentInfo = {
            paymentId: req.body['paymentInfo.paymentId'],
            isVerified: true,
            paidAt: req.body['paymentInfo.paidAt'] || new Date().toISOString()
          };
        }
        saveFallback();
        res.json(memoryJobs[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/jobs/:id', async (req, res) => {
  try { 
    if (isDbConnected) {
      await JobPost.findByIdAndDelete(req.params.id); 
    } else {
      memoryJobs = memoryJobs.filter(j => j._id !== req.params.id && j.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true }); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Applications & Uploads
app.post('/api/applications', async (req, res) => {
  try { 
    if (isDbConnected) {
      const application = await new Application(req.body).save();
      
      // Auto-sync with Candidate collection
      if (req.body.applicantEmail) {
        await Candidate.findOneAndUpdate(
          { email: req.body.applicantEmail },
          { 
            $set: { 
              name: req.body.applicantName,
              resumeUrl: req.body.resumeUrl,
              qualification: req.body.qualification,
              status: 'Active'
            }
          },
          { upsert: true, new: true }
        );
      }
      
      res.status(201).json(application); 
    } else {
      const newApp = { status: 'Applied', ...req.body, _id: 'app_' + Date.now(), id: 'app_' + Date.now(), createdAt: new Date().toISOString() };
      memoryApplications.push(newApp);
      
      const candIdx = memoryCandidates.findIndex(c => c.mobile === req.body.applicantMobile || c.email === req.body.applicantEmail);
      if (candIdx !== -1) {
        memoryCandidates[candIdx] = { ...memoryCandidates[candIdx], ...req.body, mobile: req.body.applicantMobile };
      } else {
        memoryCandidates.push({ email: req.body.applicantEmail, name: req.body.applicantName, mobile: req.body.applicantMobile, resumeUrl: req.body.resumeUrl, status: 'Active', createdAt: new Date().toISOString(), _id: 'cand_' + Date.now() });
      }
      
      saveFallback();
      res.status(201).json(newApp);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/applications', async (_req, res) => {
  try {
    if (isDbConnected) {
      // Manual join becauseJobID is a string, not ObjectId in current schema
      const apps = await Application.find().sort({ appliedAt: -1 }).lean();
      const enrichedApps = await Promise.all(apps.map(async (app) => {
        const job = await JobPost.findById(app.jobId).select('title company companyLogo').lean();
        return { ...app, jobDetails: job };
      }));
      res.json(enrichedApps);
    } else {
      const enrichedApps = memoryApplications.map((app) => {
        const job = memoryJobs.find(j => j._id === app.jobId || j.id === app.jobId);
        return { ...app, jobDetails: job };
      });
      res.json(enrichedApps.sort((a, b) => (b.createdAt || '').localeCompare(a.createdAt || '')));
    }
  }
  catch (e) {
    console.error('SERVER ERROR: /api/applications:', e);
    res.json([]); 
  }
});
app.put('/api/applications/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    if (isDbConnected) {
      await Application.findByIdAndUpdate(req.params.id, { status });
    } else {
      const idx = memoryApplications.findIndex(a => a._id === req.params.id || a.id === req.params.id);
      if (idx !== -1) {
        memoryApplications[idx].status = status;
        saveFallback();
      }
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/applications/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await Application.findByIdAndDelete(req.params.id);
    } else {
      memoryApplications = memoryApplications.filter(a => a._id !== req.params.id || a.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Candidates API
app.get('/api/candidates', async (_req, res) => {
  try { res.json(isDbConnected ? await Candidate.find().sort({ createdAt: -1 }) : memoryCandidates); }
  catch (e) { 
    console.error('SERVER ERROR: /api/candidates:', e);
    res.json([]); 
  }
});

app.post('/api/candidates', async (req, res) => {
  try { 
    if (isDbConnected) {
      res.status(201).json(await new Candidate(req.body).save()); 
    } else {
      const newCand = { status: 'Active', ...req.body, _id: 'cand_' + Date.now(), id: 'cand_' + Date.now(), createdAt: new Date().toISOString() };
      memoryCandidates.push(newCand);
      saveFallback();
      res.status(201).json(newCand);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/candidates/:id', async (req, res) => {
  try { 
    if (isDbConnected) {
      res.json(await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true })); 
    } else {
      const idx = memoryCandidates.findIndex(c => c._id === req.params.id || c.id === req.params.id);
      if (idx !== -1) {
        memoryCandidates[idx] = { ...memoryCandidates[idx], ...req.body };
        saveFallback();
        res.json(memoryCandidates[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/candidates/:id', async (req, res) => {
  try { 
    if (isDbConnected) {
      await Candidate.findByIdAndDelete(req.params.id); 
    } else {
      memoryCandidates = memoryCandidates.filter(c => c._id !== req.params.id && c.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true }); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Categories API
app.get('/api/categories', async (_req, res) => {
  try { res.json(isDbConnected ? await JobCategory.find().sort({ name: 1 }) : memoryCategories); }
  catch (e) { 
    console.error('SERVER ERROR: /api/categories:', e);
    res.json(memoryCategories); 
  }
});

app.post('/api/categories', async (req, res) => {
  try { 
    if (isDbConnected) {
      res.status(201).json(await new JobCategory(req.body).save()); 
    } else {
      const newCat = { ...req.body, _id: 'cat_' + Date.now(), id: 'cat_' + Date.now() };
      memoryCategories.push(newCat);
      saveFallback();
      res.status(201).json(newCat);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/categories/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await JobCategory.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memoryCategories.findIndex(c => c._id === req.params.id || c.id === req.params.id);
      if (idx !== -1) {
        memoryCategories[idx] = { ...memoryCategories[idx], ...req.body };
        saveFallback();
        res.json(memoryCategories[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/categories/:id', async (req, res) => {
  try { 
    if (isDbConnected) {
      await JobCategory.findByIdAndDelete(req.params.id); 
    } else {
      memoryCategories = memoryCategories.filter(c => c._id !== req.params.id && c.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true }); 
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/upload', upload.single('file'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  res.json({ success: true, url: `/uploads/${req.file.filename}` });
});

// Admin All Data (Bulk Fetch for Dashboard)
app.get('/api/admin/all', async (_req, res) => {
  try {
    if (!isDbConnected) return res.json({ plans: memoryPlans, subscriptions: memorySubscriptions, transactions: memoryTransactions, coupons: memoryCoupons, auditLogs: memoryAuditLogs, companies: memoryCompanies, candidates: memoryCandidates, flaggedItems: memoryFlaggedItems, users: memoryUsers });
    const [plans, subs, tx, cp, logs, comps, cands, flagged, users] = await Promise.all([
      Plan.find(), Subscription.find(), Transaction.find(), Coupon.find(), AuditLog.find(), Company.find(), Candidate.find(), FlaggedItem.find(), User.find()
    ]);
    res.json({ plans, subscriptions: subs, transactions: tx, coupons: cp, auditLogs: logs, companies: comps, candidates: cands, flaggedItems: flagged, users });
  } catch (e) { res.status(500).json({ message: 'Error loading admin data', error: e.message }); }
});

// Helper to automatically add an Audit Log
const addAuditLog = async (action, target, details) => {
  const logData = {
    adminName: 'Platform Admin',
    action,
    target, 
    details,
    timestamp: new Date().toISOString()
  };
  try {
    if (isDbConnected) {
      await new AuditLog(logData).save();
    } else {
      memoryAuditLogs.push({ ...logData, _id: 'log_' + Date.now(), id: 'log_' + Date.now() });
      saveFallback();
    }
  } catch(e) { console.warn('Failed to auto-log audit event', e); }
};

// Generic Fetch/Store for Admin Modules
app.get('/api/plans', async (_req, res) => res.json(isDbConnected ? await Plan.find() : memoryPlans));
app.post('/api/plans', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new Plan(req.body).save());
    } else {
      const newPlan = { ...req.body, _id: 'plan_' + Date.now(), id: 'plan_' + Date.now() };
      memoryPlans.push(newPlan);
      saveFallback();
      res.status(201).json(newPlan);
    }
    addAuditLog('Plan Created', req.body.name || 'Unknown', `Price: ₹${req.body.price}`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/plans/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await Plan.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memoryPlans.findIndex(p => p._id === req.params.id || p.id === req.params.id);
      if (idx !== -1) {
        memoryPlans[idx] = { ...memoryPlans[idx], ...req.body };
        saveFallback();
        res.json(memoryPlans[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/plans/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await Plan.findByIdAndDelete(req.params.id);
    } else {
      memoryPlans = memoryPlans.filter(p => p._id !== req.params.id && p.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/subscriptions', async (_req, res) => res.json(isDbConnected ? await Subscription.find() : memorySubscriptions));
app.post('/api/subscriptions', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new Subscription(req.body).save());
    } else {
      const newSub = { ...req.body, _id: 'sub_' + Date.now(), id: 'sub_' + Date.now() };
      memorySubscriptions.push(newSub);
      saveFallback();
      res.status(201).json(newSub);
    }
    addAuditLog('Subscription Added', req.body.userName || req.body.userId, `Plan: ${req.body.planName}`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/subscriptions/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await Subscription.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memorySubscriptions.findIndex(s => s._id === req.params.id || s.id === req.params.id);
      if (idx !== -1) {
        memorySubscriptions[idx] = { ...memorySubscriptions[idx], ...req.body };
        saveFallback();
        res.json(memorySubscriptions[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/subscriptions/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await Subscription.findByIdAndDelete(req.params.id);
    } else {
      memorySubscriptions = memorySubscriptions.filter(s => s._id !== req.params.id && s.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/subscriptions/active/:email', async (req, res) => {
  try {
    const email = (req.params.email || '').trim().toLowerCase();
    if (isDbConnected) {
      const sub = await Subscription.findOne({ userId: email, status: 'active' }).sort({ createdAt: -1 });
      if (sub) {
        const remaining = (sub.creditsTotal || 0) - (sub.creditsUsed || 0);
        return res.json({ ...sub.toObject(), remainingCredits: Math.max(0, remaining) });
      }
    } else {
      const sub = memorySubscriptions.find(s => s.userId === email && s.status === 'active');
      if (sub) {
        const remaining = (sub.creditsTotal || 0) - (sub.creditsUsed || 0);
        return res.json({ ...sub, remainingCredits: Math.max(0, remaining) });
      }
    }
    res.json({ remainingCredits: 0 });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/subscriptions/use-credit', async (req, res) => {
  try {
    const { email } = req.body;
    const formattedEmail = (email || '').trim().toLowerCase();
    if (isDbConnected) {
      await Subscription.findOneAndUpdate(
        { userId: formattedEmail, status: 'active' },
        { $inc: { creditsUsed: 1 } }
      );
    } else {
      const idx = memorySubscriptions.findIndex(s => s.userId === formattedEmail && s.status === 'active');
      if (idx !== -1) memorySubscriptions[idx].creditsUsed = (memorySubscriptions[idx].creditsUsed || 0) + 1;
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/transactions', async (_req, res) => res.json(isDbConnected ? await Transaction.find() : memoryTransactions));
app.post('/api/transactions', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new Transaction(req.body).save());
    } else {
      const newTx = { ...req.body, _id: 'tx_' + Date.now(), id: 'tx_' + Date.now() };
      memoryTransactions.push(newTx);
      saveFallback();
      res.status(201).json(newTx);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/transactions/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await Transaction.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memoryTransactions.findIndex(t => t._id === req.params.id || t.id === req.params.id);
      if (idx !== -1) {
        memoryTransactions[idx] = { ...memoryTransactions[idx], ...req.body };
        saveFallback();
        res.json(memoryTransactions[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/transactions/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await Transaction.findByIdAndDelete(req.params.id);
    } else {
      memoryTransactions = memoryTransactions.filter(t => t._id !== req.params.id && t.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/coupons', async (_req, res) => res.json(isDbConnected ? await Coupon.find() : memoryCoupons));
app.post('/api/coupons', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new Coupon(req.body).save());
    } else {
      const newCoupon = { ...req.body, _id: 'coupon_' + Date.now(), id: 'coupon_' + Date.now() };
      memoryCoupons.push(newCoupon);
      saveFallback();
      res.status(201).json(newCoupon);
    }
    addAuditLog('Coupon Created', req.body.code, `Discount: ${req.body.value}${req.body.discountType === 'PERCENT' ? '%' : '₹'}`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/coupons/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await Coupon.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memoryCoupons.findIndex(c => c._id === req.params.id || c.id === req.params.id);
      if (idx !== -1) {
        memoryCoupons[idx] = { ...memoryCoupons[idx], ...req.body };
        saveFallback();
        res.json(memoryCoupons[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
    addAuditLog('Coupon Updated', req.body.code || req.params.id, `Status: ${req.body.status || 'Updated'}`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/coupons/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await Coupon.findByIdAndDelete(req.params.id);
    } else {
      memoryCoupons = memoryCoupons.filter(c => c._id !== req.params.id && c.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/auditlogs', async (_req, res) => res.json(isDbConnected ? await AuditLog.find().sort({ timestamp: -1 }) : memoryAuditLogs));
app.post('/api/auditlogs', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new AuditLog(req.body).save());
    } else {
      const newLog = { ...req.body, _id: 'log_' + Date.now(), id: 'log_' + Date.now(), timestamp: new Date().toISOString() };
      memoryAuditLogs.push(newLog);
      saveFallback();
      res.status(201).json(newLog);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/auditlogs/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await AuditLog.findByIdAndDelete(req.params.id);
    } else {
      memoryAuditLogs = memoryAuditLogs.filter(l => l._id !== req.params.id && l.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/companies', async (_req, res) => res.json(isDbConnected ? await Company.find() : memoryCompanies));
app.post('/api/companies', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new Company(req.body).save());
    } else {
      const newCompany = { status: 'Pending', activeJobs: 0, ...req.body, _id: 'comp_' + Date.now(), id: 'comp_' + Date.now() };
      memoryCompanies.push(newCompany);
      saveFallback();
      res.status(201).json(newCompany);
    }
    addAuditLog('Company Added', req.body.name, `Industry: ${req.body.industry || 'Unknown'}`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/companies/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await Company.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memoryCompanies.findIndex(c => c._id === req.params.id || c.id === req.params.id);
      if (idx !== -1) {
        memoryCompanies[idx] = { ...memoryCompanies[idx], ...req.body };
        saveFallback();
        res.json(memoryCompanies[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
    addAuditLog('Company Updated', req.body.name || req.params.id, `Status: ${req.body.status || 'Updated'}`);
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/companies/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await Company.findByIdAndDelete(req.params.id);
    } else {
      memoryCompanies = memoryCompanies.filter(c => c._id !== req.params.id && c.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/candidates', async (_req, res) => {
  try {
    res.json(isDbConnected ? await Candidate.find() : memoryCandidates);
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/candidates', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new Candidate(req.body).save());
    } else {
      const newCand = { ...req.body, _id: 'cand_' + Date.now(), id: 'cand_' + Date.now() };
      memoryCandidates.push(newCand);
      saveFallback();
      res.status(201).json(newCand);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.put('/api/candidates/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await Candidate.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memoryCandidates.findIndex(c => c._id === req.params.id || c.id === req.params.id);
      if (idx !== -1) {
        memoryCandidates[idx] = { ...memoryCandidates[idx], ...req.body };
        saveFallback();
        res.json(memoryCandidates[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/flaggeditems', async (_req, res) => res.json(isDbConnected ? await FlaggedItem.find() : memoryFlaggedItems));
app.post('/api/flaggeditems', async (req, res) => {
  try {
    if (isDbConnected) {
      res.status(201).json(await new FlaggedItem(req.body).save());
    } else {
      const newItem = { status: 'Pending', priority: 'Medium', ...req.body, _id: 'flag_' + Date.now(), id: 'flag_' + Date.now(), date: new Date().toISOString().split('T')[0] };
      memoryFlaggedItems.push(newItem);
      saveFallback();
      res.status(201).json(newItem);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.put('/api/flaggeditems/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      res.json(await FlaggedItem.findByIdAndUpdate(req.params.id, req.body, { new: true }));
    } else {
      const idx = memoryFlaggedItems.findIndex(f => f._id === req.params.id || f.id === req.params.id);
      if (idx !== -1) {
        memoryFlaggedItems[idx] = { ...memoryFlaggedItems[idx], ...req.body };
        saveFallback();
        res.json(memoryFlaggedItems[idx]);
      } else {
        res.status(404).json({ error: 'Not found' });
      }
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});
app.delete('/api/flaggeditems/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await FlaggedItem.findByIdAndDelete(req.params.id);
    } else {
      memoryFlaggedItems = memoryFlaggedItems.filter(f => f._id !== req.params.id && f.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.get('/api/admin/menu', (_req, res) => res.json([]));

// Clear all old candidates (fresh start)
app.post('/api/auth/reset-candidates', async (_req, res) => {
  try {
    if (isDbConnected) {
      await Candidate.deleteMany({});
    }
    memoryCandidates = [];
    saveFallback();
    res.json({ success: true, message: 'All old candidates cleared' });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// User Registration API
app.post('/api/register', async (req, res) => {
  try {
    let { username, email, password, role, phone } = req.body;
    if (!username || !email || !password || !role || !phone) {
      return res.status(400).json({ message: 'All fields are required including phone' });
    }

    const normalizedEmail = String(email || '').trim().toLowerCase();

    if (isDbConnected) {
      const existingUser = await User.findOne({ email: normalizedEmail });
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      const newUser = await new User({ username, email: normalizedEmail, password, role, phone }).save();
      res.status(201).json({ message: 'User registered successfully', user: { _id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role, phone: newUser.phone } });
    } else {
      const existingUser = memoryUsers.find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail);
      if (existingUser) {
        return res.status(409).json({ message: 'User with this email already exists' });
      }
      const newUser = { _id: 'user_' + Date.now(), id: 'user_' + Date.now(), username, email: normalizedEmail, password, role, phone, createdAt: new Date().toISOString() };
      memoryUsers.push(newUser);
      saveFallback();
      res.status(201).json({ message: 'User registered successfully', user: { _id: newUser._id, username: newUser.username, email: newUser.email, role: newUser.role, phone: newUser.phone } });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

app.post('/api/login', async (req, res) => {
  try {
    const { email, password, role } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    
    if (isDbConnected) {
      const user = await User.findOne({ email: normalizedEmail }).select('+password');
      if (!user) {
        return res.status(404).json({ message: 'Account not found. Please sign up first.' });
      }
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      // If role mismatch, we still log in but return their actual role
      res.json({ success: true, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
    } else {
      const user = memoryUsers.find(u => String(u.email || '').trim().toLowerCase() === normalizedEmail);
      if (!user) {
        return res.status(404).json({ message: 'Account not found. Please sign up first.' });
      }
      if (user.password !== password) {
        return res.status(401).json({ message: 'Invalid password' });
      }
      res.json({ success: true, user: { _id: user._id, username: user.username, email: user.email, role: user.role } });
    }
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});


// Conversations & Messaging
app.get('/api/conversations', async (_req, res) => res.json(isDbConnected ? await Conversation.find().sort({ updatedAt: -1 }) : []));
app.post('/api/conversations', async (req, res) => res.json(await new Conversation(req.body).save()));
app.get('/api/conversations/:id/messages', async (req, res) => res.json(isDbConnected ? await Message.find({ conversationId: req.params.id }).sort({ createdAt: 1 }) : []));
app.post('/api/conversations/:id/messages', async (req, res) => {
  if (!isDbConnected) return res.status(503).json({ error: 'DB not ready' });
  const msg = await new Message({ ...req.body, conversationId: req.params.id }).save();
  await Conversation.findByIdAndUpdate(req.params.id, { lastMessage: req.body.text, unread: req.body.sender === 'them', updatedAt: new Date() });
  res.json(msg);
});

// Razorpay initialization is now done per-request to ensure latest env keys are used.

app.post('/api/payments/create-order', async (req, res) => {
  const { amount, currency } = req.body;
  const keyId = (process.env.RAZORPAY_KEY_ID || '').trim();
  const keySecret = (process.env.RAZORPAY_KEY_SECRET || '').trim();

  console.log(`💳 [PAYMENT] Creating order... Amount: ${amount}`);
  console.log(`🔑 [DEBUG] Key: [${keyId}], Secret: [${keySecret ? 'PRESENT' : 'MISSING'}]`);
    // If no real keys, or dummy keys found, use Mock Mode
    if (!keyId || keyId === 'rzp_test_DUMMY' || keyId.trim() === '' || !keySecret || keySecret === 'DUMMY') {
      console.log("🛠️ [PAYMENT] Using MOCK MODE (Keys missing or DUMMY)");
      return res.json({ 
        id: 'mock_order_' + Date.now(), 
        amount: Math.round((amount || 0) * 100), 
        currency: currency || 'INR',
        key: 'rzp_test_DUMMY',
        mock: true
      });
    }
    
    const razorpay = new Razorpay({ 
      key_id: keyId, 
      key_secret: keySecret 
    });
    
    try {
      const order = await razorpay.orders.create({ 
        amount: parseInt((Math.round((amount || 0) * 100)).toString()), 
        currency: currency || 'INR', 
        receipt: `rcpt_${Date.now()}`,
        notes: { website: "satyazon.com", merchant_name: "TokenJobs" }
      });
    console.log("✅ [PAYMENT] Razorpay Order Created:", order.id);
    res.json({ ...order, key: keyId });

  } catch (e) { 
    // Log error details to console only (writing files triggers Vite HMR reload)
    console.error('❌ [PAYMENT] Order creation error:', e?.message || e);

    const errorDetail = (e.error && e.error.description) || e.description || e.message || 'Unknown Reason';
    const isAuthError = errorDetail.toLowerCase().includes('auth') || errorDetail.toLowerCase().includes('key') || (e.statusCode === 401);

    if (isAuthError) {
      console.error("🚫 [PAYMENT] Authentication failed! Falling back to MOCK MODE for stability.");
      return res.json({ 
        id: 'mock_order_' + Date.now(), 
        amount: Math.round((amount || 0) * 100), 
        currency: currency || 'INR',
        key: 'rzp_test_DUMMY',
        mock: true,
        auth_failed: true
      });
    }

    res.status(500).json({ 
      success: false, 
      error: 'Payment initialization failed', 
      details: errorDetail 
    }); 
  }
});

app.post('/api/payments/verify', async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature, jobId } = req.body;
  const keySecret = process.env.RAZORPAY_KEY_SECRET;
  
  let isVerified = false;
  
  // Robust mock verification
  if (razorpay_order_id.startsWith('mock_')) {
    console.log("🛠️ [PAYMENT] Verifying MOCK PAYMENT");
    isVerified = true;
  } else {
    const razorpay = new Razorpay({ 
      key_id: process.env.RAZORPAY_KEY_ID || 'rzp_test_DUMMY', 
      key_secret: keySecret || 'DUMMY' 
    });
    
    try {
      const sign = razorpay_order_id + "|" + razorpay_payment_id;
      const expectedSign = crypto.createHmac("sha256", keySecret || 'DUMMY').update(sign).digest("hex");
      isVerified = (razorpay_signature === expectedSign);
    } catch (e) {
      console.error("❌ [PAYMENT] Signature Verification Crash:", e);
      isVerified = false;
    }
  }
  
  if (isVerified) {
    if (jobId && jobId !== 'service_purchase') {
      if (isDbConnected) {
        await JobPost.findByIdAndUpdate(jobId, { 
          status: 'paid', 
          'paymentInfo.paymentId': razorpay_payment_id, 
          'paymentInfo.isVerified': true,
          'paymentInfo.paidAt': new Date().toISOString()
        }).catch(() => {});
      } else {
        const idx = memoryJobs.findIndex(j => j._id === jobId || j.id === jobId);
        if (idx !== -1) {
          memoryJobs[idx].status = 'paid';
          memoryJobs[idx].paymentInfo = {
            ...memoryJobs[idx].paymentInfo,
            paymentId: razorpay_payment_id,
            isVerified: true,
            paidAt: new Date().toISOString()
          };
          saveFallback();
        }
      }
    }
    res.json({ success: true });
  } else {
    res.status(400).json({ success: false, message: 'Payment verification failed' });
  }
});
app.get('/api/notifications/:email', async (req, res) => {
  try {
    const email = req.params.email;
    const emailWithSuffix = email.includes('@') ? email : `${email}@example.com`;
    
    console.log(`📬 Fetching notifications [DB Connected: ${isDbConnected}] for: ${email} OR ${emailWithSuffix}`);
    
    if (isDbConnected) {
      // Find where userEmail is either just mobile or mobile@example.com
      const docs = await Notification.find({ 
        userEmail: { $in: [email, emailWithSuffix] } 
      }).sort({ timestamp: -1 });
      console.log('✅ Result Counts:', docs.length);
      res.json(docs);
    } else {
      const filtered = memoryNotifications.filter(n => n.userEmail === email || n.userEmail === emailWithSuffix).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      console.log('✅ Result Counts (Memory):', filtered.length);
      res.json(filtered);
    }
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/notifications/:id', async (req, res) => {
  try {
    if (isDbConnected) {
      await Notification.findByIdAndDelete(req.params.id);
    } else {
      memoryNotifications = memoryNotifications.filter(n => n._id !== req.params.id && n.id !== req.params.id);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.delete('/api/notifications/clear/:email', async (req, res) => {
  try {
    if (isDbConnected) {
      await Notification.deleteMany({ userEmail: req.params.email });
    } else {
      memoryNotifications = memoryNotifications.filter(n => n.userEmail !== req.params.email);
      saveFallback();
    }
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

app.post('/api/notifications', async (req, res) => {
  try {
    const { userEmail, realEmail, title, message } = req.body;
    console.log('🚀 Sending notification to:', userEmail, '| Title:', title);
    
    let notif;
    if (isDbConnected) {
      notif = await new Notification(req.body).save();
    } else {
      notif = { ...req.body, _id: 'notif_' + Date.now(), id: 'notif_' + Date.now(), timestamp: new Date().toISOString(), read: false };
      memoryNotifications.push(notif);
      saveFallback();
    }
    
    // Attempt to send real email
    // 1. Check if realEmail is provided
    // 2. Check if userEmail is a valid email
    // 3. Fallback: Lookup in DB
    let recipientMail = realEmail;
    if (!recipientMail && userEmail && userEmail.includes('@')) {
       recipientMail = userEmail;
    }
    
    if (!recipientMail && userEmail && isDbConnected) {
       // Search in Candidates first (for mobile match)
       const candidate = await Candidate.findOne({ mobile: userEmail });
       if (candidate && candidate.email && !candidate.email.includes('@example.com')) {
          recipientMail = candidate.email;
       } else {
          // If not found or fallback email, search in Users (for email/username match)
          const user = await User.findOne({ 
             $or: [
                { email: userEmail },
                { username: userEmail }
             ]
          });
          if (user && user.email) {
             recipientMail = user.email;
          }
       }
    }

    if (recipientMail) {
      const mailOptions = {
        from: `"TokenJobs Support" <${process.env.EMAIL_USER}>`,
        to: recipientMail,
        subject: title || 'Application Status Update',
        html: `
          <div style="background-color: #f1f5f9; padding: 40px 20px; font-family: 'Outfit', 'Plus Jakarta Sans', Arial, sans-serif;">
            <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 24px; overflow: hidden; box-shadow: 0 4px 15px rgba(0,0,0,0.05);">
              <div style="background: linear-gradient(135deg, #6366f1 0%, #4338ca 100%); padding: 40px 20px; text-align: center;">
                 <h1 style="color: #ffffff; margin: 0; font-size: 32px; font-weight: 900; letter-spacing: -0.025em; text-transform: uppercase;">Token</h1>
                 <p style="color: rgba(255,255,255,0.7); margin-top: 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; tracking: 0.1em;">Jobs Made Simple • Smart Updates</p>
              </div>
              
              <div style="padding: 40px 30px;">
                <h2 style="color: #1e1b4b; font-size: 22px; font-weight: 800; margin-bottom: 20px; text-align: center;">${title}</h2>
                <div style="background-color: #f8fafc; padding: 24px; border-radius: 20px; border: 1px solid #f1f5f9; margin-bottom: 35px;">
                    <p style="font-size: 16px; color: #475569; line-height: 1.7; margin: 0; font-weight: 500; text-align: center;">${message}</p>
                </div>
                
                <div style="text-align: center; margin-bottom: 10px;">
                   <a href="https://token-jobs.vercel.app/" style="display: inline-block; background-color: #6366f1; color: #ffffff; padding: 18px 36px; border-radius: 16px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.05em;">View Application Status</a>
                </div>
                <p style="text-align: center; font-size: 11px; color: #94a3b8; margin-top: 20px;">Or visit our portal at token-jobs.vercel.app</p>
              </div>
              
              <div style="padding: 30px; background-color: #f8fafc; border-top: 1px solid #f1f5f9; text-align: center;">
                <p style="font-size: 11px; color: #94a3b8; line-height: 1.5; margin: 0;">This is an automated notification from the Token recruitment engine. Please do not reply directly to this mail.</p>
                <div style="margin-top: 20px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
                   <p style="font-size: 10px; color: #cbd5e1; font-weight: 700; text-transform: uppercase; letter-spacing: 0.1em;">© 2026 Token Platform • Future of Hiring</p>
                </div>
              </div>
            </div>
          </div>
        `
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) console.error('🚫 Mail Error:', error.message);
        else console.log('📧 Mail Sent successfully to:', recipientMail);
      });
    } else {
       console.log('⚠️ [NOTIF] No valid email found for delivery, skipping Nodemailer call.');
    }

    res.status(201).json(notif);

  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ========================
// AUTHENTICATION SYSTEM
// ========================

// EMAIL LOGIN: Simple login without OTP
app.post('/api/auth/login-email', async (req, res) => {
  try {
    const { email, name } = req.body;
    if (!email || !email.includes('@')) return res.status(400).json({ error: 'Valid email is required' });

    console.log(`📧 Login attempt for: ${email}`);

    // Check if user exists
    let userExists = false;
    let user = null;
    if (isDbConnected) {
      user = await Candidate.findOne({ email });
      if (!user) {
         // Try mobile field too since we're migrating
         user = await Candidate.findOne({ mobile: email });
      }
      if (user) userExists = true;
    } else {
      user = memoryCandidates.find((c) => c.email === email || c.mobile === email);
      if (user) userExists = true;
    }

    if (userExists) {
      // Existing user - login complete
      return res.json({ 
        success: true, 
        isNewUser: false, 
        user: { _id: user._id || user.id, name: user.name, email: user.email || user.mobile } 
      });
    }

    // New user - if name provided, create!
    if (name && name.trim()) {
      let newUser;
      if (isDbConnected) {
        newUser = await new Candidate({ 
          name: name.trim(), 
          email, 
          mobile: email, // use email as mobile for backward compatibility
          role: 'Job Seeker', 
          status: 'Active' 
        }).save();
      } else {
        newUser = { 
          name: name.trim(), 
          email, 
          mobile: email,
          role: 'Job Seeker', 
          status: 'Active', 
          _id: 'cand_' + Date.now(), 
          id: 'cand_' + Date.now(), 
          createdAt: new Date().toISOString() 
        };
        memoryCandidates.push(newUser);
        saveFallback();
      }
      return res.json({ 
        success: true, 
        isNewUser: true, 
        user: { _id: newUser._id || newUser.id, name: newUser.name, email: newUser.email } 
      });
    }

    // New user - need name
    res.json({ success: true, isNewUser: true, needsName: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Transactions
app.get('/api/transactions', async (_req, res) => res.json(memoryTransactions));
app.post('/api/transactions', async (req, res) => {
  const transaction = { ...req.body, id: Date.now().toString() };
  memoryTransactions.push(transaction);
  saveFallback();
  res.status(201).json(transaction);
});

// Health/Status check
app.get('/api/health', (_req, res) => res.json({ 
  status: 'live', 
  db: isDbConnected ? 'connected' : 'disconnected',
  dbError: isDbConnected ? null : dbError,
  razorpayKey: process.env.RAZORPAY_KEY_ID || 'MISSING',
  uri: uri.substring(0, 20) + '...'
}));

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => console.log(`🚀 Server running on port ${PORT}`));

// Global Error Handler
app.use((err, req, res, next) => {
  console.error("❌ GLOBAL ERROR LOG:", {
    method: req.method,
    url: req.url,
    body: req.body,
    error: err.message,
    stack: err.stack
  });
  res.status(500).json({ 
    success: false, 
    error: err.message || 'Internal Server Error',
    path: req.url
  });
});
