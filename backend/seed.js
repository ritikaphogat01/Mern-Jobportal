const mongoose = require('mongoose');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env.local' });

const uri = process.env.MONGODB_URI || '';

async function main() {
  await mongoose.connect(uri);
  console.log('Connected to MongoDB for seeding');

  const adminSchema = new mongoose.Schema({ username: String, password: String });
  const Admin = mongoose.model('Admin', adminSchema);

  const existing = await Admin.findOne({ username: 'admin' });
  if (!existing) {
    await Admin.create({ username: 'admin', password: 'token_admin_2025' });
    console.log('Inserted default admin (admin/token_admin_2025)');
  } else {
    console.log('Admin already exists');
  }

  // optionally seed a default navigation/menu configuration
  const menuSchema = new mongoose.Schema({ group: String, items: mongoose.Schema.Types.Mixed });
  const AdminMenu = mongoose.model('AdminMenu', menuSchema);
  const existingMenu = await AdminMenu.findOne({ group: 'Overview' });
  if (!existingMenu) {
    await AdminMenu.insertMany([
      { group: 'Overview', items: [{ label: 'Dashboard', icon: 'grid_view' }] },
      { group: 'Monetization', items: [
          { label: 'Plans Master', icon: 'inventory_2' },
          { label: 'Subscriptions', icon: 'card_membership' },
          { label: 'Billing', icon: 'receipt_long' },
          { label: 'Coupons', icon: 'confirmation_number' }
        ]
      },
      { group: 'Users & Content', items: [
          { label: 'Companies', icon: 'business_center' },
          { label: 'Candidates', icon: 'person_search' },
          { label: 'Moderation', icon: 'gavel', alert: '4' }
        ]
      },
      { group: 'System', items: [
          { label: 'Audit Logs', icon: 'history_edu' },
          { label: 'Settings', icon: 'settings_suggest' }
        ]
      }
    ]);
    console.log('Seeded default admin menu structure');
  } else {
    console.log('Admin menu already seeded');
  }

  // Seed Plans
  const planSchema = new mongoose.Schema({
    role: String,
    name: String,
    durationDays: Number,
    price: Number,
    status: String,
    isRecommended: Boolean,
    features: [String],
    credits: mongoose.Schema.Types.Mixed
  });
  const Plan = mongoose.model('Plan', planSchema);
  const existingPlans = await Plan.findOne({});
  if (!existingPlans) {
    await Plan.insertMany([
      {
        role: 'EMPLOYER',
        name: 'Elite Recruiter',
        durationDays: 30,
        price: 4999,
        status: 'Active',
        isRecommended: true,
        features: ['Unlimited Posts', 'AI Shortlisting', 'Premium Support'],
        credits: { jobPosts: 50, resumeUnlocks: 200 }
      },
      {
        role: 'EMPLOYEE',
        name: 'Profile Boost Pro',
        durationDays: 15,
        price: 999,
        status: 'Active',
        isRecommended: false,
        features: ['Top Search Result', 'Premium Badge', 'Priority Alerts'],
        credits: { profileBoostDays: 15, premiumAlerts: 10 }
      },
      {
        role: 'EMPLOYER',
        name: 'Starter Pack',
        durationDays: 7,
        price: 1499,
        status: 'Active',
        isRecommended: false,
        features: ['Basic Posts', 'Standard Support'],
        credits: { jobPosts: 10, resumeUnlocks: 50 }
      }
    ]);
    console.log('Seeded 3 pricing plans');
  } else {
    console.log('Plans already exist');
  }

  // Seed Subscriptions
  const subSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    role: String,
    planId: String,
    planName: String,
    startDate: String,
    expiryDate: String,
    status: String,
    creditsRemaining: mongoose.Schema.Types.Mixed
  });
  const Subscription = mongoose.model('Subscription', subSchema);
  const existingSubs = await Subscription.findOne({});
  if (!existingSubs) {
    await Subscription.insertMany([
      {
        userId: 'u101',
        userName: 'TechNova Solutions',
        role: 'EMPLOYER',
        planId: 'p1',
        planName: 'Elite Recruiter',
        startDate: '2025-01-01',
        expiryDate: '2025-02-01',
        status: 'Active',
        creditsRemaining: { jobPosts: 12, unlocks: 45 }
      },
      {
        userId: 'u202',
        userName: 'Rahul Sharma',
        role: 'EMPLOYEE',
        planId: 'p2',
        planName: 'Profile Boost Pro',
        startDate: '2025-02-10',
        expiryDate: '2025-02-25',
        status: 'Active',
        creditsRemaining: { boosts: 5 }
      }
    ]);
    console.log('Seeded 2 subscriptions');
  } else {
    console.log('Subscriptions already exist');
  }

  // Seed Transactions
  const txSchema = new mongoose.Schema({
    userId: String,
    userName: String,
    planName: String,
    amount: Number,
    status: String,
    method: String,
    date: String
  });
  const Transaction = mongoose.model('Transaction', txSchema);
  const existingTx = await Transaction.findOne({});
  if (!existingTx) {
    await Transaction.insertMany([
      {
        userId: 'u101',
        userName: 'TechNova Solutions',
        planName: 'Elite Recruiter',
        amount: 4999,
        status: 'Success',
        method: 'UPI',
        date: '2025-01-01 10:30 AM'
      },
      {
        userId: 'u202',
        userName: 'Rahul Sharma',
        planName: 'Profile Boost Pro',
        amount: 999,
        status: 'Success',
        method: 'Card',
        date: '2025-02-10 02:15 PM'
      },
      {
        userId: 'u303',
        userName: 'Simran Kaur',
        planName: 'Starter Pack',
        amount: 1499,
        status: 'Failed',
        method: 'Wallet',
        date: '2025-02-13 11:00 AM'
      }
    ]);
    console.log('Seeded 3 transactions');
  } else {
    console.log('Transactions already exist');
  }

  // Seed Coupons
  const couponSchema = new mongoose.Schema({
    code: String,
    role: String,
    discountType: String,
    value: Number,
    validUntil: String,
    usageLimit: Number,
    usageCount: Number
  });
  const Coupon = mongoose.model('Coupon', couponSchema);
  const existingCoupons = await Coupon.findOne({});
  if (!existingCoupons) {
    await Coupon.insertMany([
      {
        code: 'TOKEN50',
        role: 'BOTH',
        discountType: 'PERCENT',
        value: 50,
        validUntil: '2025-12-31',
        usageLimit: 100,
        usageCount: 42
      },
      {
        code: 'RECRUITER20',
        role: 'EMPLOYER',
        discountType: 'PERCENT',
        value: 20,
        validUntil: '2025-03-31',
        usageLimit: 50,
        usageCount: 15
      }
    ]);
    console.log('Seeded 2 coupons');
  } else {
    console.log('Coupons already exist');
  }

  // Seed Audit Logs
  const auditSchema = new mongoose.Schema({
    adminName: String,
    action: String,
    target: String,
    timestamp: String,
    details: String
  });
  const AuditLog = mongoose.model('AuditLog', auditSchema);
  const existingLogs = await AuditLog.findOne({});
  if (!existingLogs) {
    await AuditLog.insertMany([
      {
        adminName: 'Admin_Master',
        action: 'PLAN_UPDATE',
        target: 'Elite Recruiter',
        timestamp: '2025-02-20 10:00 AM',
        details: 'Price changed from 4500 to 4999'
      },
      {
        adminName: 'Support_1',
        action: 'SUB_OVERRIDE',
        target: 'TechNova Solutions',
        timestamp: '2025-02-20 11:30 AM',
        details: 'Added 5 Job Post credits via manual request'
      },
      {
        adminName: 'Admin_Master',
        action: 'COUPON_CREATE',
        target: 'RECRUITER20',
        timestamp: '2025-02-18 03:45 PM',
        details: 'New coupon created for employer discount'
      }
    ]);
    console.log('Seeded 3 audit logs');
  } else {
    console.log('Audit logs already exist');
  }
  process.exit(0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
