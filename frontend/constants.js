
export const API_URL = "https://mern-jobportal-1-ngjd.onrender.com";

export const MOCK_CATEGORIES = [
  {
    id: 'sales',
    name: 'Sales / Marketing',
    icon: 'trending_up',
    jobsCount: '450+',
    imageUrl: 'https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'driver',
    name: 'Driver / Logistics',
    icon: 'local_shipping',
    jobsCount: '320+',
    imageUrl: 'https://images.unsplash.com/photo-1519003722824-192d992a605b?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'accounting',
    name: 'Accounts / Finance',
    icon: 'payments',
    jobsCount: '210+',
    imageUrl: 'https://images.unsplash.com/photo-1554224155-6726b3ff858f?auto=format&fit=crop&q=80&w=400'
  },
  {
    id: 'tech',
    name: 'IT / Software',
    icon: 'terminal',
    jobsCount: '180+',
    imageUrl: 'https://images.unsplash.com/photo-1517694712202-14dd9538aa97?auto=format&fit=crop&q=80&w=400'
  }
];

export const MOCK_JOBS = [];

export const MOCK_TALENTS = [
  {
    id: 'tal-1',
    name: 'Amit Sharma',
    role: 'IT Support Technician',
    experience: '3 Years',
    education: 'Bachelors Degree',
    location: 'Delhi',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?fit=crop&q=80&w=200',
    skills: ['Hardware', 'Networking', 'Troubleshooting'],
    expectedSalary: '₹35,000/mo',
    availability: 'Immediate',
    bio: 'Experienced IT support professional with a focus on hardware and networking.',
    profileCompletion: 100
  },
  {
    id: 'tal-2',
    name: 'Priya Verma',
    role: 'Senior Accountant',
    experience: '5 Years',
    education: 'Masters Degree',
    location: 'Remote',
    imageUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?fit=crop&q=80&w=200',
    skills: ['Tally Prime', 'Audit', 'Taxation'],
    expectedSalary: '₹50,000/mo',
    availability: '15 Days',
    bio: 'Passionate senior accountant with extensive experience in taxation and auditing.',
    profileCompletion: 95
  }
];
