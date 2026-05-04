import React, { useState, useEffect, useRef } from 'react';

// default navigation structure (used as fallback)
const defaultSitemap = [
  { group: 'Overview', items: [{ label: 'Dashboard', icon: 'grid_view' }] },
  {
    group: 'Monetization', items: [
      { label: 'Plans Master', icon: 'inventory_2' },
      { label: 'Subscriptions', icon: 'card_membership' },
      { label: 'Billing', icon: 'receipt_long' },
      { label: 'Coupons', icon: 'confirmation_number' }
    ]
  },
  {
    group: 'Users & Content', items: [
      { label: 'Companies', icon: 'business_center' },
      { label: 'Candidates', icon: 'person_search' },
      { label: 'Categories', icon: 'category' },
      { label: 'Jobs', icon: 'work' },
      { label: 'Employer', icon: 'payments' }
    ]
  },
  {
    group: 'System', items: [
      { label: 'Audit Logs', icon: 'history_edu' },
      { label: 'Settings', icon: 'settings_suggest' }
    ]
  }
];

export const AdminDashboard = ({ onBack }) => {
  const [activeMenu, setActiveMenu] = useState('Dashboard');
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [menuSections, setMenuSections] = useState(defaultSitemap);
  const contentRef = useRef(null);

  // scroll to top when activeMenu changes
  useEffect(() => {
    if (contentRef.current) {
      contentRef.current.scrollTop = 0;
    }
  }, [activeMenu]);

  // --- BUSINESS DATA ---
  const [plans, setPlans] = useState([]);
  const [subscriptions, setSubscriptions] = useState([]);
  const [transactions, setTransactions] = useState([]);
  const [coupons, setCoupons] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [companies, setCompanies] = useState([]);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [candidates, setCandidates] = useState([]);
  const [categories, setCategories] = useState([]);
  const [adminJobs, setAdminJobs] = useState([]);
  const [jobUpdating, setJobUpdating] = useState(null);
  const [flaggedItems, setFlaggedItems] = useState([]);
  const [applications, setApplications] = useState([]);
  const [selectedJobDetails, setSelectedJobDetails] = useState(null);
  const [showJobModal, setShowJobModal] = useState(false);
  const [editingJob, setEditingJob] = useState(null);
  const [jobSaving, setJobSaving] = useState(false);
  const [jobForm, setJobForm] = useState({
    title: '',
    company: '',
    location: '',
    salary: '',
    type: 'Full Time',
    experience: 'Freshers',
    category: '',
    description: '',
    requirements: '',
    status: 'active'
  });

  // --- PLAN MODAL STATE ---
  const [showPlanModal, setShowPlanModal] = useState(false);
  const [editingPlan, setEditingPlan] = useState(null);
  const [planSaving, setPlanSaving] = useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = useState(null);
  const [planDeleting, setPlanDeleting] = useState(false);

  const blankPlanForm = {
    role: 'EMPLOYER',
    name: '',
    durationDays: 30,
    price: 0,
    features: '',
    status: 'Active',
    isRecommended: false,
    jobPosts: 0,
    featuredJobs: 0,
    resumeUnlocks: 0,
    profileBoostDays: 0,
    premiumAlerts: 0,
  };
  const [planForm, setPlanForm] = useState(blankPlanForm);

  // --- SUB-CATEGORY STATE ---
  const [activeCategoryId, setActiveCategoryId] = useState(null);
  const [showSubCategoryModal, setShowSubCategoryModal] = useState(false);
  const [editingSubCategory, setEditingSubCategory] = useState(null);
  const [subCategoryForm, setSubCategoryForm] = useState({ name: '', icon: 'circle' });
  const [subCategorySaving, setSubCategorySaving] = useState(false);

  const openCreateModal = () => {
    setEditingPlan(null);
    setPlanForm(blankPlanForm);
    setShowPlanModal(true);
  };

  const openEditModal = (plan) => {
    setEditingPlan(plan);
    setPlanForm({
      role: plan.role,
      name: plan.name,
      durationDays: plan.durationDays,
      price: plan.price,
      features: plan.features.join(', '),
      status: plan.status,
      isRecommended: plan.isRecommended,
      jobPosts: plan.credits?.jobPosts ?? 0,
      featuredJobs: plan.credits?.featuredJobs ?? 0,
      resumeUnlocks: plan.credits?.resumeUnlocks ?? 0,
      profileBoostDays: plan.credits?.profileBoostDays ?? 0,
      premiumAlerts: plan.credits?.premiumAlerts ?? 0,
    });
    setShowPlanModal(true);
  };

  const handlePlanSave = async () => {
    if (!planForm.name.trim() || planForm.price < 0) return;
    setPlanSaving(true);
    const payload = {
      role: planForm.role,
      name: planForm.name.trim(),
      durationDays: Number(planForm.durationDays),
      price: Number(planForm.price),
      features: planForm.features.split(',').map(f => f.trim()).filter(Boolean),
      status: planForm.status,
      isRecommended: planForm.isRecommended,
      credits: {
        jobPosts: Number(planForm.jobPosts),
        featuredJobs: Number(planForm.featuredJobs),
        resumeUnlocks: Number(planForm.resumeUnlocks),
        profileBoostDays: Number(planForm.profileBoostDays),
        premiumAlerts: Number(planForm.premiumAlerts),
      },
    };
    try {
      if (editingPlan) {
        const res = await fetch(`/api/plans/${(editingPlan)._id || editingPlan.id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const updated = await res.json();
          setPlans(prev => prev.map(p => ((p)._id || p.id) === ((editingPlan)._id || editingPlan.id) ? updated : p));
        }
      } else {
        const res = await fetch('/api/plans', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        if (res.ok) {
          const created = await res.json();
          setPlans(prev => [...prev, created]);
        }
      }
      setShowPlanModal(false);
    } catch (err) {
      console.error('Failed to save plan', err);
    } finally {
      setPlanSaving(false);
    }
  };

  const handlePlanDelete = async (id) => {
    setPlanDeleting(true);
    try {
      const res = await fetch(`/api/plans/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setPlans(prev => prev.filter(p => ((p)._id || p.id) !== id));
        setDeleteConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete plan', err);
    } finally {
      setPlanDeleting(false);
    }
  };

  // --- CATEGORY MODAL STATE ---
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [categorySaving, setCategorySaving] = useState(false);
  const [categoryForm, setCategoryForm] = useState({ name: '', icon: 'category', imageUrl: '' });
  const [deleteCategoryConfirmId, setDeleteCategoryConfirmId] = useState(null);

  const openCreateCategoryModal = () => { setEditingCategory(null); setCategoryForm({ name: '', icon: 'category', imageUrl: '' }); setShowCategoryModal(true); };
  const openEditCategoryModal = (cat) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, icon: cat.icon || 'category', imageUrl: cat.imageUrl || '' }); setShowCategoryModal(true); };

  const handleCategorySave = async () => {
    if (!categoryForm.name.trim()) return;
    setCategorySaving(true);
    const catId = editingCategory ? (editingCategory._id || editingCategory.id) : null;
    try {
      const res = await fetch(catId ? `/api/categories/${catId}` : '/api/categories', {
        method: catId ? 'PUT' : 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(categoryForm)
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories(prev => catId ? prev.map(c => ((c._id || c.id) === catId ? saved : c)) : [...prev, saved]);
        setShowCategoryModal(false);
      }
    } catch (e) { console.error(e); }
    finally { setCategorySaving(false); }
  };

  const handleCategoryDelete = async (id) => {
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) { setCategories(prev => prev.filter(c => (c._id || c.id) !== id)); setDeleteCategoryConfirmId(null); }
    } catch (e) { console.error(e); }
  };

  const handleSubCategorySave = async () => {
    if (!subCategoryForm.name.trim() || !activeCategoryId) return;
    setSubCategorySaving(true);
    try {
      const cat = categories.find(c => (c._id || c.id) === activeCategoryId);
      if (!cat) return;
      
      let updatedSubCats = [...(cat.subCategories || [])];
      if (editingSubCategory) {
        updatedSubCats = updatedSubCats.map(s => s.name === editingSubCategory.name ? subCategoryForm : s);
      } else {
        updatedSubCats.push(subCategoryForm);
      }

      const res = await fetch(`/api/categories/${activeCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCategories: updatedSubCats })
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories(prev => prev.map(c => ((c._id || c.id) === activeCategoryId ? saved : c)));
        setShowSubCategoryModal(false);
      }
    } catch (e) { console.error(e); }
    finally { setSubCategorySaving(false); }
  };

  const handleSubCategoryDelete = async (subName) => {
    if (!activeCategoryId) return;
    try {
      const cat = categories.find(c => (c._id || c.id) === activeCategoryId);
      if (!cat) return;
      
      const updatedSubCats = (cat.subCategories || []).filter((s) => s.name !== subName);
      const res = await fetch(`/api/categories/${activeCategoryId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subCategories: updatedSubCats })
      });
      if (res.ok) {
        const saved = await res.json();
        setCategories(prev => prev.map(c => ((c._id || c.id) === activeCategoryId ? saved : c)));
      }
    } catch (e) { console.error(e); }
  };

  // --- SUBSCRIPTION MODAL STATE ---
  const [showSubModal, setShowSubModal] = useState(false);
  const [editingSub, setEditingSub] = useState(null);
  const [subSaving, setSubSaving] = useState(false);
  const [deleteSubConfirmId, setDeleteSubConfirmId] = useState(null);
  const [subDeleting, setSubDeleting] = useState(false);

  const blankSubForm = {
    userId: '',
    userName: '',
    role: 'EMPLOYEE',
    planId: '',
    planName: '',
    startDate: new Date().toISOString().slice(0, 10),
    expiryDate: '',
    status: 'Active',
  };
  const [subForm, setSubForm] = useState(blankSubForm);

  const openCreateSubModal = () => {
    setEditingSub(null);
    setSubForm(blankSubForm);
    setShowSubModal(true);
  };

  const openEditSubModal = (sub) => {
    setEditingSub(sub);
    setSubForm({
      userId: sub.userId,
      userName: sub.userName,
      role: sub.role,
      planId: sub.planId,
      planName: sub.planName,
      startDate: sub.startDate,
      expiryDate: sub.expiryDate,
      status: sub.status,
    });
    setShowSubModal(true);
  };

  const handleSubSave = async () => {
    if (!subForm.userName.trim() || !subForm.planName.trim()) return;
    setSubSaving(true);
    try {
      if (editingSub) {
        const id = (editingSub)._id || editingSub.id;
        const res = await fetch(`/api/subscriptions/${id}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subForm),
        });
        if (res.ok) {
          const updated = await res.json();
          setSubscriptions(prev => prev.map(s => ((s)._id || s.id) === id ? updated : s));
        }
      } else {
        const res = await fetch('/api/subscriptions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(subForm),
        });
        if (res.ok) {
          const created = await res.json();
          setSubscriptions(prev => [...prev, created]);
        }
      }
      setShowSubModal(false);
    } catch (err) {
      console.error('Failed to save subscription', err);
    } finally {
      setSubSaving(false);
    }
  };

  const handleSubDelete = async (id) => {
    setSubDeleting(true);
    try {
      const res = await fetch(`/api/subscriptions/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setSubscriptions(prev => prev.filter(s => ((s)._id || s.id) !== id));
        setDeleteSubConfirmId(null);
      }
    } catch (err) {
      console.error('Failed to delete subscription', err);
    } finally {
      setSubDeleting(false);
    }
  };

  // --- TRANSACTION (BILLING) MODAL STATE ---
  const [showTxModal, setShowTxModal] = useState(false);
  const [editingTx, setEditingTx] = useState(null);
  const [txSaving, setTxSaving] = useState(false);
  const [deleteTxConfirmId, setDeleteTxConfirmId] = useState(null);
  const [txDeleting, setTxDeleting] = useState(false);

  const blankTxForm = {
    userId: '',
    userName: '',
    planName: '',
    amount: 0,
    status: 'Success',
    method: 'UPI',
    date: new Date().toISOString().slice(0, 10),
  };
  const [txForm, setTxForm] = useState(blankTxForm);

  const openCreateTxModal = () => { setEditingTx(null); setTxForm(blankTxForm); setShowTxModal(true); };
  const openEditTxModal = (tx) => {
    setEditingTx(tx);
    setTxForm({ userId: tx.userId, userName: tx.userName, planName: tx.planName, amount: tx.amount, status: tx.status, method: tx.method, date: tx.date });
    setShowTxModal(true);
  };

  const handleTxSave = async () => {
    if (!txForm.userName.trim()) return;
    setTxSaving(true);
    try {
      if (editingTx) {
        const id = (editingTx)._id || editingTx.id;
        const res = await fetch(`/api/transactions/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...txForm, amount: Number(txForm.amount) }) });
        if (res.ok) { const updated = await res.json(); setTransactions(prev => prev.map(t => ((t)._id || t.id) === id ? updated : t)); }
      } else {
        const res = await fetch('/api/transactions', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...txForm, amount: Number(txForm.amount) }) });
        if (res.ok) { const created = await res.json(); setTransactions(prev => [...prev, created]); }
      }
      setShowTxModal(false);
    } catch (err) { console.error('Failed to save transaction', err); }
    finally { setTxSaving(false); }
  };

  const handleTxDelete = async (id) => {
    setTxDeleting(true);
    try {
      const res = await fetch(`/api/transactions/${id}`, { method: 'DELETE' });
      if (res.ok) { setTransactions(prev => prev.filter(t => ((t)._id || t.id) !== id)); setDeleteTxConfirmId(null); }
    } catch (err) { console.error('Failed to delete transaction', err); }
    finally { setTxDeleting(false); }
  };

  // --- COUPON MODAL STATE ---
  const [showCouponModal, setShowCouponModal] = useState(false);
  const [editingCoupon, setEditingCoupon] = useState(null);
  const [couponSaving, setCouponSaving] = useState(false);
  const [deleteCouponConfirmId, setDeleteCouponConfirmId] = useState(null);
  const [couponDeleting, setCouponDeleting] = useState(false);

  const blankCouponForm = {
    code: '',
    role: 'BOTH',
    discountType: 'PERCENT',
    value: 10,
    validUntil: '',
    usageLimit: 100,
    usageCount: 0,
  };
  const [couponForm, setCouponForm] = useState(blankCouponForm);

  const openCreateCouponModal = () => { setEditingCoupon(null); setCouponForm(blankCouponForm); setShowCouponModal(true); };
  const openEditCouponModal = (c) => {
    setEditingCoupon(c);
    setCouponForm({ code: c.code, role: c.role, discountType: c.discountType, value: c.value, validUntil: c.validUntil, usageLimit: c.usageLimit, usageCount: c.usageCount });
    setShowCouponModal(true);
  };

  const handleCouponSave = async () => {
    if (!couponForm.code.trim()) return;
    setCouponSaving(true);
    const payload = { ...couponForm, value: Number(couponForm.value), usageLimit: Number(couponForm.usageLimit), usageCount: Number(couponForm.usageCount) };
    try {
      if (editingCoupon) {
        const id = (editingCoupon)._id || editingCoupon.id;
        const res = await fetch(`/api/coupons/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { const updated = await res.json(); setCoupons(prev => prev.map(c => ((c)._id || c.id) === id ? updated : c)); }
      } else {
        const res = await fetch('/api/coupons', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { const created = await res.json(); setCoupons(prev => [...prev, created]); }
      }
      setShowCouponModal(false);
    } catch (err) { console.error('Failed to save coupon', err); }
    finally { setCouponSaving(false); }
  };

  const handleCouponDelete = async (id) => {
    setCouponDeleting(true);
    try {
      const res = await fetch(`/api/coupons/${id}`, { method: 'DELETE' });
      if (res.ok) { setCoupons(prev => prev.filter(c => ((c)._id || c.id) !== id)); setDeleteCouponConfirmId(null); }
    } catch (err) { console.error('Failed to delete coupon', err); }
    finally { setCouponDeleting(false); }
  };

  // --- COMPANY MODAL STATE ---
  const [showCompanyModal, setShowCompanyModal] = useState(false);
  const [editingCompany, setEditingCompany] = useState(null);
  const [companySaving, setCompanySaving] = useState(false);
  const [deleteCompanyConfirmId, setDeleteCompanyConfirmId] = useState(null);
  const [companyDeleting, setCompanyDeleting] = useState(false);
  const [companyLogoFile, setCompanyLogoFile] = useState(null);
  const [companyLogoPreview, setCompanyLogoPreview] = useState('');
  const blankCompanyForm = { name: '', industry: '', location: '', status: 'Pending', activeJobs: 0, email: '', website: '', logoUrl: '' };
  const [companyForm, setCompanyForm] = useState(blankCompanyForm);

  const openCreateCompanyModal = () => { setEditingCompany(null); setCompanyForm(blankCompanyForm); setCompanyLogoFile(null); setCompanyLogoPreview(''); setShowCompanyModal(true); };
  const openEditCompanyModal = (c) => {
    setEditingCompany(c);
    setCompanyForm({ name: c.name || '', industry: c.industry || '', location: c.location || '', status: c.status || 'Pending', activeJobs: c.activeJobs || 0, email: c.email || '', website: c.website || '', logoUrl: c.logoUrl || '' });
    setCompanyLogoFile(null);
    setCompanyLogoPreview(c.logoUrl || '');
    setShowCompanyModal(true);
  };
  const handleCompanySave = async () => {
    if (!companyForm.name.trim()) return;
    setCompanySaving(true);
    try {
      let finalLogoUrl = companyForm.logoUrl;
      if (companyLogoFile) {
        const fd = new FormData(); fd.append('file', companyLogoFile);
        const uploadRes = await fetch('/api/upload', { method: 'POST', body: fd });
        const uploadData = await uploadRes.json();
        if (uploadData.success) finalLogoUrl = uploadData.url;
      }
      
      const payload = { ...companyForm, activeJobs: Number(companyForm.activeJobs), logoUrl: finalLogoUrl };

      if (editingCompany) {
        const id = (editingCompany)._id || editingCompany.id;
        const res = await fetch(`/api/companies/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { const updated = await res.json(); setCompanies(prev => prev.map(c => ((c)._id || c.id) === id ? updated : c)); }
      } else {
        const res = await fetch('/api/companies', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
        if (res.ok) { const created = await res.json(); setCompanies(prev => [...prev, created]); }
      }
      setShowCompanyModal(false);
    } catch (err) { console.error('Failed to save company', err); }
    finally { setCompanySaving(false); }
  };
  const handleCompanyDelete = async (id) => {
    setCompanyDeleting(true);
    try {
      const res = await fetch(`/api/companies/${id}`, { method: 'DELETE' });
      if (res.ok) { setCompanies(prev => prev.filter(c => ((c)._id || c.id) !== id)); setDeleteCompanyConfirmId(null); }
    } catch (err) { console.error('Failed to delete company', err); }
    finally { setCompanyDeleting(false); }
  };

  // --- CANDIDATE MODAL STATE ---
  const [showCandidateModal, setShowCandidateModal] = useState(false);
  const [editingCandidate, setEditingCandidate] = useState(null);
  const [candidateSaving, setCandidateSaving] = useState(false);
  const [deleteCandidateConfirmId, setDeleteCandidateConfirmId] = useState(null);
  const [candidateDeleting, setCandidateDeleting] = useState(false);
  const blankCandidateForm = { name: '', role: '', location: '', experience: '', status: 'Pending', skills: '', email: '' };
  const [candidateForm, setCandidateForm] = useState(blankCandidateForm);

  const openCreateCandidateModal = () => { setEditingCandidate(null); setCandidateForm(blankCandidateForm); setShowCandidateModal(true); };
  const openEditCandidateModal = (c) => {
    setEditingCandidate(c);
    setCandidateForm({ name: c.name || '', role: c.role || '', location: c.location || '', experience: c.experience || '', status: c.status || 'Pending', skills: c.skills || '', email: c.email || '' });
    setShowCandidateModal(true);
  };
  const handleCandidateSave = async () => {
    if (!candidateForm.name.trim()) return;

    // Custom Validation
    const nameRegex = /^[a-zA-Z\s]+$/;
    if (!nameRegex.test(candidateForm.name.trim())) {
      alert("Invalid Name! Name must not contain numbers or special characters.");
      return;
    }

    const emailPattern = /^[a-z0-9._%+-]+@gmail\.com$/i;
    if (!emailPattern.test(candidateForm.email.trim())) {
      alert("Invalid Email! Please use a proper email format ending with @gmail.com.");
      return;
    }

    const expValue = Number(candidateForm.experience);
    if (isNaN(expValue) || expValue < 0 || candidateForm.experience.trim() === '') {
      alert("Invalid Experience! Please enter only a number from 0 upwards.");
      return;
    }

    setCandidateSaving(true);
    try {
      if (editingCandidate) {
        const id = (editingCandidate)._id || editingCandidate.id;
        const res = await fetch(`/api/candidates/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(candidateForm) });
        if (res.ok) { const updated = await res.json(); setCandidates(prev => prev.map(c => ((c)._id || c.id) === id ? updated : c)); }
      } else {
        const res = await fetch('/api/candidates', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(candidateForm) });
        if (res.ok) { const created = await res.json(); setCandidates(prev => [...prev, created]); }
      }
      setShowCandidateModal(false);
    } catch (err) { console.error('Failed to save candidate', err); }
    finally { setCandidateSaving(false); }
  };
  const handleCandidateDelete = async (id) => {
    setCandidateDeleting(true);
    try {
      const res = await fetch(`/api/candidates/${id}`, { method: 'DELETE' });
      if (res.ok) { setCandidates(prev => prev.filter(c => ((c)._id || c.id) !== id)); setDeleteCandidateConfirmId(null); }
    } catch (err) { console.error('Failed to delete candidate', err); }
    finally { setCandidateDeleting(false); }
  };

  // --- FLAGGED ITEM MODAL STATE ---
  const [showFlagModal, setShowFlagModal] = useState(false);
  const [editingFlag, setEditingFlag] = useState(null);
  const [flagSaving, setFlagSaving] = useState(false);
  const [deleteFlagConfirmId, setDeleteFlagConfirmId] = useState(null);
  const [flagDeleting, setFlagDeleting] = useState(false);
  const blankFlagForm = { type: 'Job Post', content: '', reason: '', priority: 'Medium', status: 'Pending', date: new Date().toISOString().split('T')[0] };
  const [flagForm, setFlagForm] = useState(blankFlagForm);

  const openCreateFlagModal = () => { setEditingFlag(null); setFlagForm({ ...blankFlagForm, date: new Date().toISOString().split('T')[0] }); setShowFlagModal(true); };
  const openEditFlagModal = (f) => {
    setEditingFlag(f);
    setFlagForm({ type: f.type || 'Job Post', content: f.content || '', reason: f.reason || '', priority: f.priority || 'Medium', status: f.status || 'Pending', date: f.date || '' });
    setShowFlagModal(true);
  };
  const handleFlagSave = async () => {
    if (!flagForm.content.trim()) return;
    setFlagSaving(true);
    try {
      if (editingFlag) {
        const id = (editingFlag)._id || editingFlag.id;
        const res = await fetch(`/api/flaggeditems/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flagForm) });
        if (res.ok) { const updated = await res.json(); setFlaggedItems(prev => prev.map(f => ((f)._id || f.id) === id ? updated : f)); }
      } else {
        const res = await fetch('/api/flaggeditems', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(flagForm) });
        if (res.ok) { const created = await res.json(); setFlaggedItems(prev => [created, ...prev]); }
      }
      setShowFlagModal(false);
    } catch (err) { console.error('Failed to save flagged item', err); }
    finally { setFlagSaving(false); }
  };
  const handleFlagAction = async (id, status) => {
    try {
      const res = await fetch(`/api/flaggeditems/${id}`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      if (res.ok) { const updated = await res.json(); setFlaggedItems(prev => prev.map(f => ((f)._id || f.id) === id ? updated : f)); }
    } catch (err) { console.error('Failed to update flagged item', err); }
  };
  const handleFlagDelete = async (id) => {
    setFlagDeleting(true);
    try {
      const res = await fetch(`/api/flaggeditems/${id}`, { method: 'DELETE' });
      if (res.ok) { setFlaggedItems(prev => prev.filter(f => ((f)._id || f.id) !== id)); setDeleteFlagConfirmId(null); }
    } catch (err) { console.error('Failed to delete flagged item', err); }
    finally { setFlagDeleting(false); }
  };

  // --- AUDIT LOG STATE ---
  const [showAuditModal, setShowAuditModal] = useState(false);
  const [auditSaving, setAuditSaving] = useState(false);
  const [deleteAuditConfirmId, setDeleteAuditConfirmId] = useState(null);
  const [auditDeleting, setAuditDeleting] = useState(false);
  const blankAuditForm = { adminName: '', action: '', target: '', details: '', timestamp: new Date().toISOString().slice(0, 16) };
  const [auditForm, setAuditForm] = useState(blankAuditForm);

  // --- SETTINGS STATE ---
  const [settingsForm, setSettingsForm] = useState({
    maintenanceMode: false,
    commission: '15',
    jobPostFee: '0',
    minPayout: '1000',
    twoFactorAuth: true,
    ipWhitelist: false,
    dailyReport: true,
    fraudAlerts: true
  });

  const handleAuditSave = async () => {
    if (!auditForm.action.trim()) return;
    setAuditSaving(true);
    try {
      const res = await fetch('/api/auditlogs', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(auditForm) });
      if (res.ok) { const created = await res.json(); setAuditLogs(prev => [created, ...prev]); }
      setShowAuditModal(false);
    } catch (err) { console.error('Failed to save audit log', err); }
    finally { setAuditSaving(false); }
  };
  const handleAuditDelete = async (id) => {
    setAuditDeleting(true);
    try {
      const res = await fetch(`/api/auditlogs/${id}`, { method: 'DELETE' });
      if (res.ok) { setAuditLogs(prev => prev.filter(l => ((l)._id || l.id) !== id)); setDeleteAuditConfirmId(null); }
    } catch (err) { console.error('Failed to delete audit log', err); }
    finally { setAuditDeleting(false); }
  };

  const handleDeleteApplication = async (id) => {
    if (!window.confirm('Are you sure you want to delete this application?')) return;
    try {
      const res = await fetch(`/api/applications/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setApplications(apps => apps.filter(a => (a._id !== id && a.id !== id)));
      }
    } catch (e) {}
  };

  const loadAdminData = async () => {
    try {
      const [plansRes, subsRes, txRes, cpRes, logsRes, menuRes, companiesRes, candidatesRes, catRes, flaggedRes, jobsRes, appsRes] = await Promise.all([
        fetch('/api/plans'),
        fetch('/api/subscriptions'),
        fetch('/api/transactions'),
        fetch('/api/coupons'),
        fetch('/api/auditlogs'),
        fetch('/api/admin/menu'),
        fetch('/api/companies'),
        fetch('/api/candidates'),
        fetch('/api/categories'),
        fetch('/api/flaggeditems'),
        fetch('/api/admin/jobs'),
        fetch('/api/applications')
      ]);
      if (plansRes.ok) setPlans(await plansRes.json());
      if (subsRes.ok) setSubscriptions(await subsRes.json());
      if (txRes.ok) setTransactions(await txRes.json());
      if (cpRes.ok) setCoupons(await cpRes.json());
      if (logsRes.ok) setAuditLogs(await logsRes.json());
      if (companiesRes.ok) setCompanies(await companiesRes.json());
      if (candidatesRes.ok) setCandidates(await candidatesRes.json());
      if (catRes.ok) setCategories(await catRes.json());
      if (flaggedRes.ok) setFlaggedItems(await flaggedRes.json());
      if (jobsRes.ok) setAdminJobs(await jobsRes.json());
      if (appsRes.ok) setApplications(await appsRes.json());
      if (menuRes.ok) {
        const menuData = await menuRes.json();
        if (Array.isArray(menuData) && menuData.length > 0) {
          setMenuSections(menuData);
        }
      }
    } catch (err) {
      console.error('Failed to load admin data', err);
    }
  };

  const handleManualRefresh = async () => {
    setIsRefreshing(true);
    await loadAdminData();
    setTimeout(() => setIsRefreshing(false), 600);
  };

  // fetch data when component mounts
  useEffect(() => {
    loadAdminData();
  }, [activeMenu]);

  // --- RENDERS ---

  const renderPlansMaster = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-black text-gray-900">Plans Master</h2>
          <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mt-1">Manage Pricing & Packages</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex flex-col items-center">
             <p className="text-[9px] font-black text-gray-400 uppercase">Total Plans</p>
             <p className="text-xl font-display font-black text-primary">{plans.length}</p>
          </div>
          <button
            onClick={openCreateModal}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all"
          >
            <span className="material-icons-round">add</span> Create New Plan
          </button>
        </div>
      </div>

      {plans.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
          <span className="material-icons-round text-gray-200 text-6xl mb-4">inventory_2</span>
          <p className="text-gray-400 font-bold text-sm">No plans yet. Click "Create New Plan" to add your first plan.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {plans.map(plan => {
          const planId = (plan)._id || plan.id;
          return (
            <div key={planId} className="bg-white rounded-[3rem] p-8 border border-gray-100 shadow-card relative group">
              {plan.isRecommended && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-accent text-white px-4 py-1.5 rounded-full text-[9px] font-black uppercase tracking-widest shadow-lg">Recommended</div>
              )}
              <div className="flex justify-between items-start mb-6">
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${plan.role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' : 'bg-primary-soft text-primary border-primary/10'}`}>
                  {plan.role}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => openEditModal(plan)}
                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-primary-soft hover:text-primary transition-colors"
                    title="Edit plan"
                  >
                    <span className="material-icons-round text-sm">edit</span>
                  </button>
                  <button
                    onClick={() => setDeleteConfirmId(planId)}
                    className="w-8 h-8 rounded-lg bg-gray-50 text-gray-700 flex items-center justify-center hover:bg-red-50 hover:text-primary transition-colors"
                    title="Delete plan"
                  >
                    <span className="material-icons-round text-sm">delete</span>
                  </button>
                </div>
              </div>
              <h3 className="text-xl font-display font-black text-gray-900 mb-1">{plan.name}</h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-6">{plan.durationDays} Days Duration</p>
              <div className="text-3xl font-display font-black text-primary mb-8">₹{plan.price}</div>
              <div className="space-y-3 mb-8">
                {(plan.features || []).map((f, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <span className="material-icons-round text-emerald-500 text-sm">check_circle</span>
                    <span className="text-xs font-bold text-gray-600">{f}</span>
                  </div>
                ))}
              </div>
              <div className="pt-6 border-t border-gray-50 flex items-center justify-between">
                <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Status: {plan.status}</span>
                <div className={`w-10 h-5 rounded-full relative ${plan.status === 'Active' ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${plan.status === 'Active' ? 'right-1' : 'left-1'}`}></div>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderSubscriptions = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-black text-gray-900">Subscriptions</h2>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage & Override Active Plans</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex flex-col items-center">
             <p className="text-[9px] font-black text-gray-400 uppercase">Total Subs</p>
             <p className="text-xl font-display font-black text-primary">{subscriptions.length}</p>
          </div>
          <button
            onClick={openCreateSubModal}
            className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all"
          >
            <span className="material-icons-round">add</span> Add Subscription
          </button>
        </div>
      </div>

      {subscriptions.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
          <span className="material-icons-round text-gray-200 text-6xl mb-4">card_membership</span>
          <p className="text-gray-400 font-bold text-sm">No subscriptions yet. Click "Add Subscription" to create one.</p>
        </div>
      )}

      {subscriptions.length > 0 && (
        <div className="bg-white rounded-[3rem] border border-gray-100 shadow-card overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-gray-50/50 border-b border-gray-100">
              <tr>
                {['User/Entity', 'Plan', 'Start Date', 'Expiry Date', 'Status', 'Actions'].map(h => (
                  <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {subscriptions.map(s => {
                const subId = (s)._id || s.id;
                return (
                  <tr key={subId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-900">{s.userName}</p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">{s.role}</p>
                    </td>
                    <td className="px-8 py-6">
                      <span className="px-3 py-1 bg-accent text-white rounded-lg text-[9px] font-black uppercase">{s.planName}</span>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{s.startDate}</td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{s.expiryDate}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${s.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                          s.status === 'Expired' ? 'bg-red-50 text-primary border-red-100' :
                            'bg-yellow-50 text-yellow-600 border-yellow-100'
                        }`}>
                        {s.status}
                      </span>
                    </td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => openEditSubModal(s)}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-primary-soft hover:text-primary transition-colors"
                          title="Edit"
                        >
                          <span className="material-icons-round text-sm">edit</span>
                        </button>
                        <button
                          onClick={() => setDeleteSubConfirmId(subId)}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-primary transition-colors"
                          title="Delete"
                        >
                          <span className="material-icons-round text-sm">delete</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );

  const renderBilling = () => {
    const totalRevenue = transactions.filter(t => t.status === 'Success').reduce((sum, t) => sum + (t.amount || 0), 0);
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <h2 className="text-2xl font-display font-black text-gray-900">Billing Ledger</h2>
          <div className="flex gap-4 items-center">
            <div className="bg-emerald-50 px-6 py-3 rounded-2xl border border-emerald-100 text-center min-w-[120px]">
              <p className="text-[9px] font-black text-emerald-600 uppercase">Total Payments</p>
              <p className="text-xl font-display font-black text-emerald-900">
                {transactions.length.toString().padStart(2, '0')}
              </p>
            </div>
            <div className="bg-blue-50 px-6 py-3 rounded-2xl border border-blue-100 text-center min-w-[140px]">
              <p className="text-[9px] font-black text-blue-600 uppercase">Total Revenue</p>
              <p className="text-xl font-display font-black text-blue-900">₹{totalRevenue.toLocaleString('en-IN')}</p>
            </div>
            <button
              onClick={openCreateTxModal}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all"
            >
              <span className="material-icons-round">add</span> Add Transaction
            </button>
          </div>
        </div>

        {transactions.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
            <span className="material-icons-round text-gray-200 text-6xl mb-4">receipt_long</span>
            <p className="text-gray-400 font-bold text-sm">No transactions yet. Click "Add Transaction" to log the first one.</p>
          </div>
        )}

        {transactions.length > 0 && (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  {['User', 'Email', 'Plan', 'Amount', 'Method', 'Date', 'Status', 'Actions'].map(h => (
                    <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {transactions.map(t => {
                  const txId = (t)._id || t.id;
                  return (
                    <tr key={txId} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-8 py-6 text-sm font-bold text-gray-900">{t.userName}</td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-400">{t.userEmail}</td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-500">{t.planName}</td>
                      <td className="px-8 py-6 text-sm font-black text-gray-900">₹{t.amount?.toLocaleString('en-IN')}</td>
                      <td className="px-8 py-6 text-xs font-bold text-gray-500">{t.method}</td>
                      <td className="px-8 py-6 text-[10px] font-bold text-gray-400 uppercase">{t.date}</td>
                      <td className="px-8 py-6">
                        <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${t.status === 'Success' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                            t.status === 'Pending' ? 'bg-yellow-50 text-yellow-600 border-yellow-100' :
                              t.status === 'Refunded' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                                'bg-red-50 text-primary border-red-100'
                          }`}>
                          {t.status}
                        </span>
                      </td>
                      <td className="px-8 py-6">
                        <div className="flex items-center gap-2">
                          <button onClick={() => openEditTxModal(t)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-primary-soft hover:text-primary transition-colors" title="Edit">
                            <span className="material-icons-round text-sm">edit</span>
                          </button>
                          <button onClick={() => setDeleteTxConfirmId(txId)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-600 flex items-center justify-center hover:bg-red-50 hover:text-primary transition-colors" title="Delete">
                            <span className="material-icons-round text-sm">delete</span>
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    );
  };

  const renderAuditLogs = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-black text-gray-900">Audit Logs</h2>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">{auditLogs.length} Security Event{auditLogs.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => { setAuditForm({ ...blankAuditForm, timestamp: new Date().toISOString().slice(0, 16) }); setShowAuditModal(true); }} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all">
          <span className="material-icons-round">add</span> Add Log
        </button>
      </div>

      {auditLogs.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
          <span className="material-icons-round text-gray-200 text-6xl mb-4">history_edu</span>
          <p className="text-gray-400 font-bold text-sm">No audit logs yet.</p>
        </div>
      )}

      <div className="space-y-4">
        {auditLogs.map(log => {
          const logId = (log)._id || log.id;
          return (
            <div key={logId} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm flex items-start gap-6 group hover:shadow-lg transition-all">
              <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center text-primary group-hover:bg-primary-soft transition-colors flex-shrink-0">
                <span className="material-icons-round">history_edu</span>
              </div>
              <div className="flex-1">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-accent">{log.action}: <span className="text-primary">{log.target}</span></h4>
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-black text-gray-300 uppercase">{log.timestamp}</span>
                    <button onClick={() => setDeleteAuditConfirmId(logId)} className="w-8 h-8 flex items-center justify-center rounded-xl bg-red-50 text-primary hover:bg-red-100 transition-colors opacity-0 group-hover:opacity-100">
                      <span className="material-icons-round text-sm">delete</span>
                    </button>
                  </div>
                </div>
                <p className="text-xs text-gray-500 font-medium mt-1">{log.details}</p>
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-2">Admin: {log.adminName}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCoupons = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-black text-gray-900">Discount Coupons</h2>
          <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Manage Promotional Codes</p>
        </div>
        <div className="flex gap-4 items-center">
          <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex flex-col items-center">
             <p className="text-[9px] font-black text-gray-400 uppercase">Total Coupons</p>
             <p className="text-xl font-display font-black text-primary">{coupons.length}</p>
          </div>
          <button onClick={openCreateCouponModal} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all">
            <span className="material-icons-round">add</span> New Coupon
          </button>
        </div>
      </div>

      {coupons.length === 0 && (
        <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
          <span className="material-icons-round text-gray-200 text-6xl mb-4">confirmation_number</span>
          <p className="text-gray-400 font-bold text-sm">No coupons yet. Click "New Coupon" to create one.</p>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {coupons.map(coupon => {
          const couponId = (coupon)._id || coupon.id;
          const usagePct = coupon.usageLimit > 0 ? Math.min((coupon.usageCount / coupon.usageLimit) * 100, 100) : 0;
          return (
            <div key={couponId} className="bg-white rounded-[2rem] p-6 border border-gray-100 shadow-sm hover:shadow-lg transition-all">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="text-lg font-display font-black text-gray-900">{coupon.code}</h3>
                  <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mt-1">{coupon.discountType === 'PERCENT' ? 'Percentage' : 'Flat Rate'}</p>
                </div>
                <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${coupon.role === 'BOTH' ? 'bg-blue-50 text-blue-600 border-blue-100' :
                    coupon.role === 'EMPLOYER' ? 'bg-indigo-50 text-indigo-600 border-indigo-100' :
                      'bg-primary-soft text-primary border-primary/10'
                  }`}>{coupon.role}</span>
              </div>
              <div className="text-3xl font-display font-black text-primary mb-4">{coupon.value}{coupon.discountType === 'PERCENT' ? '%' : '₹'}</div>
              {coupon.validUntil && (
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-4">Valid until: {coupon.validUntil}</p>
              )}
              <div className="space-y-2 mb-6">
                <div className="flex justify-between text-xs font-bold text-gray-500"><span>Usage</span><span>{coupon.usageCount}/{coupon.usageLimit}</span></div>
                <div className="h-2 bg-gray-100 rounded-full overflow-hidden"><div className="h-full bg-accent transition-all" style={{ width: `${usagePct}%` }}></div></div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => openEditCouponModal(coupon)} className="flex-1 py-2 bg-gray-50 text-gray-700 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-primary-soft hover:text-primary transition-colors flex items-center justify-center gap-1">
                  <span className="material-icons-round text-sm">edit</span> Edit
                </button>
                <button onClick={() => setDeleteCouponConfirmId(couponId)} className="flex-1 py-2 bg-red-50 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors flex items-center justify-center gap-1">
                  <span className="material-icons-round text-sm">delete</span> Delete
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );

  const renderCompanies = () => {
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-display font-black text-gray-900">Registered Companies</h2>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">{companies.length} Organization{companies.length !== 1 ? 's' : ''} in System</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-primary/5 px-6 py-3 rounded-2xl border border-primary/10 flex flex-col items-center">
               <p className="text-[9px] font-black text-primary uppercase">Total Base</p>
               <p className="text-xl font-display font-black text-primary">{companies.length}</p>
            </div>
            <button onClick={openCreateCompanyModal} className="px-8 py-4 bg-accent text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium active:scale-95 transition-all">
              <span className="material-icons-round text-sm align-middle mr-2">add</span> Add Company
            </button>
          </div>
        </div>

        {companies.length === 0 ? (
          <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
            <span className="material-icons-round text-gray-200 text-6xl mb-4">business</span>
            <p className="text-gray-400 font-bold text-sm">No companies registered yet. Posting a job or adding one manually will show it here.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {companies.map(c => {
              const cId = (c)._id || c.id;
              const regDate = c.createdAt ? new Date(c.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Recently';
              
              return (
                <div key={cId} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-card hover:shadow-xl transition-all group relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-primary/5 rounded-bl-full -mr-8 -mt-8 group-hover:bg-primary/10 transition-colors"></div>
                  
                  <div className="flex justify-between items-start mb-6 relative">
                    <div className="w-14 h-14 bg-gray-50 rounded-2xl flex items-center justify-center text-primary group-hover:scale-110 transition-transform overflow-hidden">
                      {c.logoUrl ? <img src={c.logoUrl} alt="Logo" className="w-full h-full object-cover" /> : <span className="material-icons-round text-2xl">business</span>}
                    </div>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase border ${c.status === 'Active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-primary border-primary/10'}`}>
                      {c.status || 'Active'}
                    </span>
                  </div>

                  <h3 className="text-xl font-display font-black text-gray-900 group-hover:text-primary transition-colors">{c.name}</h3>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1 mb-6 flex items-center gap-1">
                    <span className="material-icons-round text-[12px]">category</span> {c.industry || 'General Industry'}
                  </p>

                  <div className="grid grid-cols-2 gap-4 pt-6 border-t border-gray-50">
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Active Jobs</p>
                      <p className="text-lg font-display font-black text-accent">{c.activeJobs ?? 0}</p>
                    </div>
                    <div>
                      <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest">Registered</p>
                      <p className="text-sm font-bold text-gray-700">{regDate}</p>
                    </div>
                  </div>

                  <div className="mt-8 flex gap-3 relative z-10">
                    <button onClick={() => openEditCompanyModal(c)} className="flex-1 py-3 bg-gray-50 text-gray-600 rounded-xl text-[9px] font-black uppercase hover:bg-primary-soft hover:text-primary transition-all">Edit</button>
                    <button onClick={() => setDeleteCompanyConfirmId(cId)} className="w-12 h-11 bg-red-50 text-primary rounded-xl flex items-center justify-center hover:bg-red-100 transition-all">
                       <span className="material-icons-round text-lg">delete</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    );
  };

  const renderCandidates = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <div>
          <h2 className="text-2xl font-display font-black text-gray-900">Job Applicants</h2>
          <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mt-1">Direct Applications & Resume Tracking</p>
        </div>
        <div className="bg-accent/5 px-6 py-3 rounded-2xl border border-accent/10">
           <p className="text-[9px] font-black text-accent uppercase">Total Applications</p>
           <p className="text-xl font-display font-black text-accent">{applications.length}</p>
        </div>
      </div>
      
      {applications.length === 0 ? (
        <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
            <span className="material-icons-round text-gray-200 text-6xl mb-4">person_search</span>
            <p className="text-gray-400 font-bold text-sm">No applications received yet.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {applications.map((app) => {
            const appId = app._id || app.id;
            const appliedAt = app.appliedAt ? new Date(app.appliedAt).toLocaleDateString() : 'N/A';
            const job = app.jobDetails || {};
            
            return (
              <div key={appId} className="bg-white rounded-[2.5rem] p-8 border border-gray-100 shadow-card hover:shadow-lg transition-all flex flex-col md:flex-row md:items-center justify-between gap-6 group">
                <div className="flex items-center gap-6">
                  <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center text-accent group-hover:bg-accent group-hover:text-white transition-all">
                     <span className="material-icons-round text-3xl">account_circle</span>
                  </div>
                  <div>
                    <h3 className="text-lg font-display font-black text-gray-900">{app.applicantName}</h3>
                    <p className="text-xs font-bold text-gray-400 mt-1">{app.applicantEmail}</p>
                    <div className="flex items-center gap-2 mt-3">
                       <span className="px-2 py-0.5 bg-gray-100 text-gray-500 rounded text-[9px] font-black uppercase tracking-widest">{app.qualification || 'Unspecified'}</span>
                       <span className="text-[10px] font-black text-gray-300 uppercase">{appliedAt}</span>
                    </div>
                  </div>
                </div>

                <div className="flex-1 md:max-w-xs bg-gray-50 p-6 rounded-3xl border border-gray-100 group-hover:bg-white group-hover:border-accent/20 transition-all">
                   <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1">Applied For</p>
                   <h4 className="font-display font-black text-accent text-sm truncate">{job.title || 'Unknown Job'}</h4>
                   <p className="text-[10px] font-bold text-gray-500 mt-1 flex items-center gap-1">
                     <span className="material-icons-round text-[12px]">business</span> {job.company || 'Unknown Company'}
                   </p>
                </div>

                <div className="flex items-center gap-4">
                   {app.resumeUrl ? (
                     <a href={app.resumeUrl} target="_blank" rel="noreferrer" className="px-6 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-emerald-500/20 active:scale-95 transition-all flex items-center gap-2">
                        <span className="material-icons-round text-sm">description</span> View CV
                     </a>
                   ) : (
                     <span className="text-[10px] font-black text-gray-400 uppercase px-6">No Resume</span>
                   )}
                   <button 
                     onClick={() => handleDeleteApplication(appId)}
                     className="w-14 h-14 bg-red-50 text-primary rounded-2xl flex items-center justify-center hover:bg-red-100 transition-all"
                     title="Delete Application"
                   >
                      <span className="material-icons-round">delete_outline</span>
                   </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );

  const renderModeration = () => {
    const pendingCount = flaggedItems.filter(f => f.status === 'Pending').length;
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-display font-black text-gray-900">Content Moderation</h2>
              <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Flagged Content & Review Queue</p>
            </div>
            <div className="flex items-center gap-4">
              {pendingCount > 0 && <div className="px-4 py-2 bg-red-50 text-primary rounded-full font-black text-sm">{pendingCount} Pending</div>}
              <button onClick={openCreateFlagModal} className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all">
                <span className="material-icons-round">flag</span> Flag Item
              </button>
            </div>
          </div>
        </div>

        {flaggedItems.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
            <span className="material-icons-round text-gray-200 text-6xl mb-4">verified_user</span>
            <p className="text-gray-400 font-bold text-sm">No flagged items. The platform is clean!</p>
          </div>
        )}

        <div className="space-y-4">
          {flaggedItems.map(flag => {
            const fId = (flag)._id || flag.id;
            return (
              <div key={fId} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-white text-sm font-black ${flag.priority === 'High' ? 'bg-red-500' : flag.priority === 'Medium' ? 'bg-yellow-500' : 'bg-blue-500'
                      }`}>{(flag.priority || 'M').charAt(0)}</div>
                    <div>
                      <h4 className="font-bold text-gray-900">{flag.type}: {flag.content}</h4>
                      <p className="text-[10px] text-gray-400 uppercase font-bold mt-1">Reason: {flag.reason}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${flag.status === 'Approved' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        flag.status === 'Rejected' ? 'bg-red-50 text-primary border-primary/10' :
                          'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>{flag.status || 'Pending'}</span>
                    <span className="text-[10px] font-black text-gray-300 uppercase">{flag.date}</span>
                  </div>
                </div>
                <div className="flex gap-3">
                  <button onClick={() => handleFlagAction(fId, 'Approved')} disabled={flag.status === 'Approved'} className="flex-1 py-2 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 transition-colors disabled:opacity-40">Approve</button>
                  <button onClick={() => handleFlagAction(fId, 'Rejected')} disabled={flag.status === 'Rejected'} className="flex-1 py-2 bg-red-50 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors disabled:opacity-40">Reject</button>
                  <button onClick={() => openEditFlagModal(flag)} className="flex-1 py-2 bg-gray-50 text-gray-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-colors flex items-center justify-center gap-1"><span className="material-icons-round text-sm">edit</span> Edit</button>
                  <button onClick={() => setDeleteFlagConfirmId(fId)} className="px-4 py-2 bg-red-50 text-primary rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 transition-colors">
                    <span className="material-icons-round text-sm">delete</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderSettings = () => (
    <div className="space-y-8 animate-fade-in">
      <div className="bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
        <h2 className="text-2xl font-display font-black text-gray-900">System Settings</h2>
        <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest mt-1">Configure Platform Behavior & Policies</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Platform Settings */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-display font-black text-gray-900 mb-6">Platform Configuration</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-600 mb-2 block">Platform Name</label>
              <input type="text" defaultValue="TokenJobs" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 mb-2 block">Support Email</label>
              <input type="email" defaultValue="support@tokenjobs.com" className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 mb-2 block">Maintenance Mode</label>
              <div className="flex items-center gap-3">
                <button onClick={() => setSettingsForm(prev => ({ ...prev, maintenanceMode: !prev.maintenanceMode }))} className={`w-14 h-8 rounded-full relative flex items-center transition-colors ${settingsForm.maintenanceMode ? 'bg-primary justify-end pr-1' : 'bg-gray-300 justify-start pl-1'}`}>
                  <div className="w-6 h-6 bg-white rounded-full shadow-md"></div>
                </button>
                <span className={`text-sm ${settingsForm.maintenanceMode ? 'text-primary font-bold' : 'text-gray-500'}`}>{settingsForm.maintenanceMode ? 'Enabled' : 'Disabled'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Commission Settings */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-display font-black text-gray-900 mb-6">Commission Rules</h3>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-bold text-gray-600 mb-2 block">Employer Commission (%)</label>
              <input type="number" value={settingsForm.commission} onChange={(e) => setSettingsForm(prev => ({ ...prev, commission: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 mb-2 block">Job Post Fee (₹)</label>
              <input type="number" value={settingsForm.jobPostFee} onChange={(e) => setSettingsForm(prev => ({ ...prev, jobPostFee: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
            <div>
              <label className="text-sm font-bold text-gray-600 mb-2 block">Min Payout Amount ({'\u20B9'})</label>
              <input type="number" value={settingsForm.minPayout} onChange={(e) => setSettingsForm(prev => ({ ...prev, minPayout: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-primary/20 focus:border-primary outline-none transition-all" />
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Security */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-display font-black text-gray-900 mb-6">Security & Compliance</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Two-Factor Auth Required</p>
                <p className="text-[10px] text-gray-500 uppercase">For all admins</p>
              </div>
              <button
                onClick={() => setSettingsForm(prev => ({ ...prev, twoFactorAuth: !prev.twoFactorAuth }))}
                className={`w-12 h-7 rounded-full relative flex items-center transition-colors ${settingsForm.twoFactorAuth ? 'bg-primary justify-end pr-1' : 'bg-gray-300 justify-start pl-1'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">IP Whitelist</p>
                <p className="text-[10px] text-gray-500 uppercase">Restrict admin access</p>
              </div>
              <button
                onClick={() => setSettingsForm(prev => ({ ...prev, ipWhitelist: !prev.ipWhitelist }))}
                className={`w-12 h-7 rounded-full relative flex items-center transition-colors ${settingsForm.ipWhitelist ? 'bg-primary justify-end pr-1' : 'bg-gray-300 justify-start pl-1'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-white p-8 rounded-[2rem] border border-gray-100 shadow-sm">
          <h3 className="text-lg font-display font-black text-gray-900 mb-6">Notification Preferences</h3>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Daily Report Email</p>
                <p className="text-[10px] text-gray-500 uppercase">Platform statistics</p>
              </div>
              <button
                onClick={() => setSettingsForm(prev => ({ ...prev, dailyReport: !prev.dailyReport }))}
                className={`w-12 h-7 rounded-full relative flex items-center transition-colors ${settingsForm.dailyReport ? 'bg-primary justify-end pr-1' : 'bg-gray-300 justify-start pl-1'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
            <div className="flex items-center justify-between p-4 bg-gray-50 rounded-xl">
              <div>
                <p className="font-bold text-gray-900">Fraud Alerts</p>
                <p className="text-[10px] text-gray-500 uppercase">Real-time notifications</p>
              </div>
              <button
                onClick={() => setSettingsForm(prev => ({ ...prev, fraudAlerts: !prev.fraudAlerts }))}
                className={`w-12 h-7 rounded-full relative flex items-center transition-colors ${settingsForm.fraudAlerts ? 'bg-primary justify-end pr-1' : 'bg-gray-300 justify-start pl-1'}`}
              >
                <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4">
        <button onClick={() => alert("Settings configuration saved successfully!")} className="flex-1 py-4 bg-primary text-white rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg active:scale-95 transition-all">Save Changes</button>
        <button onClick={() => setSettingsForm({ maintenanceMode: false, commission: '15', jobPostFee: '0', minPayout: '1000', twoFactorAuth: true, ipWhitelist: false, dailyReport: true, fraudAlerts: true })} className="flex-1 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-sm uppercase tracking-widest active:scale-95 transition-all">Reset to Default</button>
      </div>
    </div>
  );

  const handleJobVerification = async (id, newStatus) => {
    setJobUpdating(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      if (res.ok) {
        const updated = await res.json();
        setAdminJobs(prev => prev.map(j => ((j)._id || j.id) === id ? updated : j));
      }
    } catch (err) {
      console.error('Failed to verify job', err);
    } finally {
      setJobUpdating(null);
    }
  };

  const handleJobDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this job permanently?')) return;
    setJobUpdating(id);
    try {
      const res = await fetch(`/api/jobs/${id}`, { method: 'DELETE' });
      if (res.ok) {
        setAdminJobs(prev => prev.filter(j => ((j)._id || j.id) !== id));
      }
    } catch (err) {
      console.error('Failed to delete job', err);
    } finally {
      setJobUpdating(null);
    }
  };

  const renderCategories = () => {
    const activeCat = categories.find(c => (c._id || c.id) === activeCategoryId);

    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-display font-black text-gray-900">{activeCat ? `Sub-Categories: ${activeCat.name}` : 'Categories'}</h2>
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mt-1">
              {activeCat ? 'Manage specialized roles' : 'Manage Job Categories & Industries'}
            </p>
          </div>
          <div className="flex gap-4 items-center">
            {!activeCat && (
               <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                 <p className="text-[9px] font-black text-gray-400 uppercase">Total Categories</p>
                 <p className="text-xl font-display font-black text-primary">{categories.length}</p>
               </div>
            )}
            {activeCat && (
               <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex flex-col items-center">
                 <p className="text-[9px] font-black text-gray-400 uppercase">Sub-Cats</p>
                 <p className="text-xl font-display font-black text-primary">{((activeCat).subCategories || []).length}</p>
               </div>
            )}
            {activeCat && (
              <button onClick={() => setActiveCategoryId(null)} className="px-6 py-4 bg-gray-100 text-gray-600 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center gap-3">
                <span className="material-icons-round text-sm">arrow_back</span> Back
              </button>
            )}
            <button 
              onClick={activeCat ? () => { setEditingSubCategory(null); setSubCategoryForm({ name: '', icon: 'circle' }); setShowSubCategoryModal(true); } : openCreateCategoryModal} 
              className="px-6 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/30 active:scale-95 transition-all flex items-center gap-3"
            >
              <span className="material-icons-round text-sm">add_circle</span> {activeCat ? 'Add Sub-Category' : 'Add Category'}
            </button>
          </div>
        </div>

        {activeCat ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {(activeCat.subCategories || []).map((s) => (
              <div key={s.name} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-card hover:shadow-xl transition-all flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-50 rounded-xl flex items-center justify-center text-primary border border-gray-100">
                    <span className="material-icons-round text-lg">{s.icon || 'circle'}</span>
                  </div>
                  <span className="font-bold text-accent text-sm">{s.name}</span>
                </div>
                <div className="flex gap-2">
                   <button onClick={() => { setEditingSubCategory(s); setSubCategoryForm(s); setShowSubCategoryModal(true); }} className="w-8 h-8 rounded-lg text-gray-400 hover:text-accent flex items-center justify-center transition-all">
                     <span className="material-icons-round text-sm">edit</span>
                   </button>
                   <button onClick={() => handleSubCategoryDelete(s.name)} className="w-8 h-8 rounded-lg text-red-300 hover:text-red-500 flex items-center justify-center transition-all">
                     <span className="material-icons-round text-sm">delete</span>
                   </button>
                </div>
              </div>
            ))}
            {(activeCat.subCategories || []).length === 0 && (
              <div className="col-span-full py-12 text-center text-gray-400 border border-dashed border-gray-200 rounded-[2rem]">
                <p className="text-[11px] font-bold uppercase tracking-widest">No sub-categories added to {activeCat.name}.</p>
              </div>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {categories.map((c) => (
              <div key={c._id || c.id} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-card hover:shadow-xl transition-all">
                <div className="flex justify-between items-start mb-6">
                  <div className="w-16 h-16 bg-primary-soft text-primary rounded-[1.5rem] flex items-center justify-center overflow-hidden">
                    {c.imageUrl ? (
                      <img src={c.imageUrl} alt={c.name} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-icons-round text-3xl">{c.icon || 'category'}</span>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => openEditCategoryModal(c)} className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-accent flex items-center justify-center transition-all bg-white shadow-sm border border-gray-100">
                      <span className="material-icons-round text-sm">edit</span>
                    </button>
                    <button onClick={() => setDeleteCategoryConfirmId(c._id || c.id)} className="w-8 h-8 rounded-lg bg-red-50 text-red-400 hover:text-red-500 hover:bg-red-100 flex items-center justify-center transition-all bg-white shadow-sm border border-red-100">
                      <span className="material-icons-round text-sm">delete</span>
                    </button>
                  </div>
                </div>
                
                <h3 className="text-xl font-display font-black text-accent">{c.name}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1 mb-6">{(c.subCategories || []).length} Sub-Categories</p>
                
                <button 
                  onClick={() => setActiveCategoryId(c._id || c.id)}
                  className="w-full py-3 bg-gray-50 hover:bg-primary-soft hover:text-primary rounded-xl text-[9px] font-black uppercase tracking-widest transition-all flex items-center justify-center gap-2"
                >
                  Manage Sub-Categories
                </button>
              </div>
            ))}
          </div>
        )}

        {showCategoryModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-accent/90 backdrop-blur-md" onClick={() => setShowCategoryModal(false)}></div>
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-premium relative z-10 animate-slide-up overflow-hidden">
              <div className="p-8 border-b border-gray-50 flex justify-between items-center sticky top-0 bg-white">
                <h3 className="text-xl font-display font-black text-accent">{editingCategory ? 'Edit Category' : 'New Category'}</h3>
                <button onClick={() => setShowCategoryModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-accent shadow-inner">
                  <span className="material-icons-round">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Category Name</label>
                  <input type="text" value={categoryForm.name} onChange={e => setCategoryForm({ ...categoryForm, name: e.target.value })} placeholder="e.g. Graphic Designer" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Icon Name</label>
                  <input type="text" value={categoryForm.icon} onChange={e => setCategoryForm({ ...categoryForm, icon: e.target.value })} placeholder="e.g. draw, business, local_shipping" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Category Image (Optional)</label>
                  <div className="flex items-center gap-4">
                    {categoryForm.imageUrl && (
                      <img src={categoryForm.imageUrl} alt="Category" className="w-16 h-16 rounded-xl object-cover" />
                    )}
                    <label className="px-5 py-3 bg-gray-50 text-gray-700 rounded-xl border border-gray-200 cursor-pointer text-[10px] uppercase font-black tracking-widest hover:bg-gray-100 transition-colors">
                      {categoryForm.imageUrl ? 'Change Image' : 'Upload Image'}
                      <input type="file" accept="image/*" className="hidden" onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const formData = new FormData();
                          formData.append('file', file);
                          try {
                            const res = await fetch('/api/upload', { method: 'POST', body: formData });
                            const data = await res.json();
                            if (data.url) setCategoryForm({ ...categoryForm, imageUrl: data.url });
                          } catch (err) {
                            console.error('Upload failed', err);
                          }
                        }
                      }} />
                    </label>
                    {categoryForm.imageUrl && (
                      <button onClick={() => setCategoryForm({ ...categoryForm, imageUrl: '' })} className="px-5 py-3 bg-red-50 text-red-500 rounded-xl text-[10px] uppercase font-black tracking-widest hover:bg-red-100 transition-colors">
                        Delete
                      </button>
                    )}
                  </div>
                </div>
                <button onClick={handleCategorySave} disabled={categorySaving} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-premium active:scale-95 transition-all">
                  {categorySaving ? 'Saving...' : 'Save Category'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showSubCategoryModal && (
          <div className="fixed inset-0 z-[150] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-accent/90 backdrop-blur-md" onClick={() => setShowSubCategoryModal(false)}></div>
            <div className="bg-white w-full max-w-md rounded-[3rem] shadow-premium relative z-10 animate-slide-up overflow-hidden">
              <div className="p-8 border-b border-gray-100 flex justify-between items-center bg-white">
                <h3 className="text-xl font-display font-black text-accent">{editingSubCategory ? 'Edit Sub-Category' : 'New Sub-Category'}</h3>
                <button onClick={() => setShowSubCategoryModal(false)} className="w-10 h-10 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-accent shadow-inner">
                  <span className="material-icons-round">close</span>
                </button>
              </div>
              <div className="p-8 space-y-6">
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Sub-Category Name</label>
                  <input type="text" value={subCategoryForm.name} onChange={e => setSubCategoryForm({ ...subCategoryForm, name: e.target.value })} placeholder="e.g. React Developer" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all" />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-900 mb-3">Icon Name</label>
                  <input type="text" value={subCategoryForm.icon} onChange={e => setSubCategoryForm({ ...subCategoryForm, icon: e.target.value })} placeholder="e.g. code, language, brush" className="w-full px-5 py-4 bg-gray-50/50 border border-gray-100 rounded-2xl focus:ring-4 focus:ring-primary/10 text-sm font-medium transition-all" />
                </div>
                <button onClick={handleSubCategorySave} disabled={subCategorySaving} className="w-full py-4 bg-primary text-white rounded-2xl font-black text-xs uppercase tracking-widest shadow-premium active:scale-95 transition-all">
                  {subCategorySaving ? 'Saving...' : 'Save Sub-Category'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    );
  };


  const renderEmployer = () => {
    // Show jobs that are 'paid' (awaiting verification) or 'pending' (just posted)
    const paidJobs = adminJobs.filter(j => j.status === 'paid' || j.status === 'pending');
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-display font-black text-gray-900">Employer Payments</h2>
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mt-1">Review & Verify Incoming Vacancy Payments ({paidJobs.length} Pending Approval)</p>
          </div>
          <div className="flex gap-4">
             <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100">
               <p className="text-[9px] font-black text-gray-400 uppercase">Total System Jobs</p>
               <p className="text-xl font-display font-black text-accent">{adminJobs.length}</p>
             </div>
          </div>
        </div>

        {paidJobs.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
            <span className="material-icons-round text-gray-200 text-6xl mb-4">payments</span>
            <p className="text-gray-400 font-bold text-sm">No pending employer payments to review.</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {paidJobs.map(job => {
            const jobId = (job)._id || job.id;
            const pay = (job).paymentInfo || {};
            return (
              <div key={jobId} className="bg-white p-8 rounded-[3rem] border border-gray-100 shadow-sm hover:shadow-xl transition-all relative overflow-hidden group">
                <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform">
                  <span className="material-icons-round text-[120px]">verified</span>
                </div>
                <div className="flex items-center gap-6 mb-8">
                  <div className="w-16 h-16 rounded-[1.5rem] bg-emerald-50 text-emerald-500 flex items-center justify-center shadow-inner">
                    <span className="material-icons-round text-3xl">account_balance_wallet</span>
                  </div>
                  <div>
                    <h4 className="text-xl font-display font-black text-accent tracking-tight">{job.title}</h4>
                    <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-0.5">{job.company}</p>
                  </div>
                </div>
                <div className="bg-gray-50/50 rounded-2xl p-6 border border-gray-100 mb-8 space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Verification Status</span>
                    <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                      job.status === 'paid' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-orange-50 text-orange-600 border-orange-100'
                    }`}>
                      {job.status === 'paid' ? 'PAYMENT RECEIVED' : 'OFFLINE/PENDING'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Selected Plan</span>
                    <span className="px-3 py-1 bg-accent text-white rounded-lg text-[9px] font-black uppercase tracking-widest">{pay.planName || 'Not Selected'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Amount</span>
                    <span className="text-xl font-display font-black text-emerald-600">{'\u20B9'}{pay.amount?.toLocaleString('en-IN') || '0'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Method</span>
                    <span className={`px-2 py-0.5 rounded-md text-[8px] font-black uppercase tracking-widest ${pay.method === 'manual' ? 'bg-orange-50 text-orange-500' : 'bg-blue-50 text-blue-500'}`}>{pay.method || 'N/A'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Submission Date</span>
                    <span className="text-xs font-bold text-gray-700">{job.postedAt || new Date(job.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>
                <div className="flex flex-col gap-4">
                  <button 
                    onClick={() => setSelectedJobDetails(job)}
                    className="w-full py-3 bg-gray-50 text-accent rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-gray-100 transition-all mb-2 flex items-center justify-center gap-2"
                  >
                    <span className="material-icons-round text-sm">visibility</span> View Listing
                  </button>
                  <div className="flex gap-4">
                    <button
                      onClick={() => handleJobVerification(jobId, 'active')}
                      className="flex-1 py-4 bg-emerald-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-emerald-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-icons-round text-sm">check_circle</span> Approve
                    </button>
                    <button
                      onClick={() => handleJobVerification(jobId, 'rejected')}
                      className="flex-1 py-4 bg-white text-primary border border-red-100 rounded-2xl font-black text-[10px] uppercase tracking-widest active:scale-95 transition-all flex items-center justify-center gap-2"
                    >
                      <span className="material-icons-round text-sm">cancel</span> Reject
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  };

  const renderJobModal = () => (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-6 bg-gray-900/60 backdrop-blur-sm animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up relative my-auto">
        <div className="p-8 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10 rounded-t-[3rem]">
          <div>
            <h3 className="text-xl font-display font-black text-gray-900">{editingJob ? 'Edit Vacancy' : 'Post New Blue-Collar Job'}</h3>
            <p className="text-[10px] font-black text-primary uppercase tracking-widest mt-1">Admin Control Panel</p>
          </div>
          <button onClick={() => setShowJobModal(false)} className="w-10 h-10 rounded-2xl bg-gray-50 text-gray-500 flex items-center justify-center hover:bg-gray-100 transition-colors">
            <span className="material-icons-round">close</span>
          </button>
        </div>
        
        <div className="p-8 space-y-6 max-h-[70vh] overflow-y-auto no-scrollbar">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Job Title</label>
              <input 
                type="text" 
                value={jobForm.title} 
                onChange={e => setJobForm({...jobForm, title: e.target.value})}
                placeholder="e.g. Delivery Partner" 
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Company / Brand</label>
              <input 
                type="text" 
                value={jobForm.company} 
                onChange={e => setJobForm({...jobForm, company: e.target.value})}
                placeholder="e.g. Zomato / Swiggy" 
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Location</label>
              <input 
                type="text" 
                value={jobForm.location} 
                onChange={e => setJobForm({...jobForm, location: e.target.value})}
                placeholder="e.g. Mumbai, India" 
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Salary / Payout</label>
              <input 
                type="text" 
                value={jobForm.salary} 
                onChange={e => setJobForm({...jobForm, salary: e.target.value})}
                placeholder="e.g. ₹25,000 - ₹30,000" 
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Job Type</label>
              <select
                value={jobForm.type}
                onChange={e => setJobForm({...jobForm, type: e.target.value})}
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              >
                <option value="Full-Time">Full-Time</option>
                <option value="Part-Time">Part-Time</option>
                <option value="Internship">Internship</option>
                <option value="Contract">Contract</option>
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Work Mode</label>
              <select
                value={jobForm.workMode}
                onChange={e => setJobForm({...jobForm, workMode: e.target.value})}
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              >
                <option value="Onsite">Onsite</option>
                <option value="Remote">Remote</option>
                <option value="Hybrid">Hybrid</option>
              </select>
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Description</label>
            <textarea 
              rows={3}
              value={jobForm.description} 
              onChange={e => setJobForm({...jobForm, description: e.target.value})}
              placeholder="Briefly describe the role..." 
              className="w-full p-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Requirements (Comma separated)</label>
              <input 
                type="text" 
                value={jobForm.requirements} 
                onChange={e => setJobForm({...jobForm, requirements: e.target.value})}
                placeholder="Bike, Valid License, Android Phone" 
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Job Category</label>
              <select
                value={jobForm.category}
                onChange={e => setJobForm({...jobForm, category: e.target.value})}
                className="w-full h-14 pl-4 pr-4 bg-gray-50 rounded-2xl font-bold text-sm text-gray-900 border-transparent focus:border-primary transition-all"
              >
                <option value="">Select Category</option>
                {categories.map((c) => (
                   <option key={c._id || c.id} value={c.name}>{c.name}</option>
                ))}
                {!categories.some((c) => c.name === 'Blue-Collar') && <option value="Blue-Collar">Blue-Collar</option>}
              </select>
            </div>
          </div>
        </div>

        <div className="p-8 pt-4">
          <button 
            onClick={handleJobSave}
            disabled={jobSaving}
            className="w-full py-5 bg-primary text-white rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-premium shadow-primary/30 active:scale-[0.98] transition-all flex items-center justify-center gap-3"
          >
            {jobSaving ? <><span className="material-icons-round animate-spin">autorenew</span> Processing...</> : <><span className="material-icons-round">publish</span> Post Vacancy Now</>}
          </button>
        </div>
      </div>
    </div>
  );

  const handleJobSave = async () => {
    if (!jobForm.title.trim() || !jobForm.company.trim()) return;
    setJobSaving(true);
    try {
      const payload = {
        ...jobForm,
        requirements: jobForm.requirements.split(',').map(r => r.trim()).filter(Boolean),
        recruiterEmail: 'admin@token.com', // Admin posted this
        contactEmail: 'admin@token.com'
      };
      
      if (editingJob) {
        const id = editingJob._id || editingJob.id;
        const res = await fetch(`/api/admin/jobs/${id}/status`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ status: jobForm.status })
        });
        if (res.ok) {
           // We'd ideally want to update the full job, but the API might only support status update.
           // For now, let's just refresh adminJobs
           const newJobsRes = await fetch('/api/admin/jobs');
           if (newJobsRes.ok) setAdminJobs(await newJobsRes.json());
        }
      } else {
        const res = await fetch('/api/jobs', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        if (res.ok) {
          const created = await res.json();
          setAdminJobs(prev => [...prev, created]);
        }
      }
      setShowJobModal(false);
    } catch (err) {
      console.error('Failed to save job', err);
    } finally {
      setJobSaving(false);
    }
  };

  const renderJobs = () => {
    // Show only jobs that have been processed (active or rejected)
    const verifiedJobs = adminJobs.filter(j => j.status === 'active' || j.status === 'rejected');
    return (
      <div className="space-y-8 animate-fade-in">
        <div className="flex justify-between items-center bg-white p-8 rounded-[2.5rem] border border-gray-100 shadow-sm">
          <div>
            <h2 className="text-2xl font-display font-black text-gray-900">Jobs & Vacancies</h2>
            <p className="text-[11px] font-black text-gray-700 uppercase tracking-widest mt-1">Approve & Manage Listings</p>
          </div>
          <div className="flex gap-4 items-center">
            <div className="bg-gray-50 px-6 py-3 rounded-2xl border border-gray-100 flex flex-col items-center">
               <p className="text-[9px] font-black text-gray-400 uppercase">Total Jobs</p>
               <p className="text-xl font-display font-black text-primary">{verifiedJobs.length}</p>
            </div>
            <button 
              onClick={() => {
                 setEditingJob(null);
                 setJobForm({
                    title: '',
                    company: '',
                    location: '',
                    salary: '',
                    type: 'Blue-Collar',
                    experience: 'Freshers',
                    category: 'Blue-Collar',
                    description: '',
                    requirements: '',
                    status: 'active'
                 });
                 setShowJobModal(true);
              }}
              className="px-8 py-4 bg-primary text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-premium shadow-primary/20 flex items-center gap-3 active:scale-95 transition-all"
            >
              <span className="material-icons-round">add_business</span> Post Blue-Collar Job
            </button>
          </div>
        </div>

        {verifiedJobs.length === 0 && (
          <div className="bg-white rounded-[2.5rem] p-16 flex flex-col items-center justify-center border border-dashed border-gray-200 text-center">
            <span className="material-icons-round text-gray-200 text-6xl mb-4">work</span>
            <p className="text-gray-400 font-bold text-sm">No jobs posted yet.</p>
          </div>
        )}

        {verifiedJobs.length > 0 && (
          <div className="bg-white rounded-[3rem] border border-gray-100 shadow-card overflow-hidden">
            <table className="w-full text-left">
              <thead className="bg-gray-50/50 border-b border-gray-100">
                <tr>
                  {['Title / Company', 'Category', 'Location', 'Status', 'Date', 'Actions'].map(h => (
                    <th key={h} className="px-8 py-6 text-[10px] font-black text-gray-400 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {verifiedJobs.map(job => {
                const jobId = (job)._id || job.id;
                const isPending = job.status === 'pending';
                const isUpdating = jobUpdating === jobId;
                return (
                  <tr key={jobId} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-8 py-6">
                      <p className="text-sm font-bold text-gray-900">{job.title}</p>
                      <p className="text-[9px] font-black text-primary uppercase tracking-widest">{job.company}</p>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{job.category || 'N/A'}</td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{job.location}</td>
                    <td className="px-8 py-6">
                      <span className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${
                        job.status === 'active' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                        job.status === 'rejected' ? 'bg-red-50 text-red-600 border-red-100' :
                        'bg-yellow-50 text-yellow-600 border-yellow-100'
                      }`}>
                        {job.status || 'active'}
                      </span>
                    </td>
                    <td className="px-8 py-6 text-xs font-bold text-gray-500">{job.postedAt || new Date(job.createdAt).toLocaleDateString()}</td>
                    <td className="px-8 py-6">
                      <div className="flex items-center gap-2">
                        <button 
                          onClick={() => setSelectedJobDetails(job)}
                          className="w-8 h-8 rounded-lg bg-accent/5 text-accent hover:bg-accent hover:text-white flex items-center justify-center transition-all"
                          title="View Details"
                        >
                          <span className="material-icons-round text-sm">visibility</span>
                        </button>
                        {isPending ? (
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleJobVerification(jobId, 'active')}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-emerald-100 disabled:opacity-50 transition-colors"
                            >
                              Approve
                            </button>
                            <button
                              onClick={() => handleJobVerification(jobId, 'rejected')}
                              disabled={isUpdating}
                              className="px-3 py-1.5 bg-red-50 text-red-600 rounded-lg text-[9px] font-black uppercase tracking-widest hover:bg-red-100 disabled:opacity-50 transition-colors"
                            >
                              Reject
                            </button>
                          </div>
                        ) : (
                          <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Done</span>
                        )}
                        <button
                          onClick={() => handleJobDelete(jobId)}
                          disabled={isUpdating}
                          className="w-8 h-8 rounded-lg bg-gray-50 text-gray-400 hover:text-red-500 hover:bg-red-50 flex items-center justify-center transition-all active:scale-90"
                          title="Delete Permanently"
                        >
                          <span className="material-icons-round text-sm">delete_outline</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
    );
  };

  const renderActiveView = () => {
    switch (activeMenu) {
      case 'Dashboard': return renderDashboardOverview();
      case 'Plans Master': return renderPlansMaster();
      case 'Subscriptions': return renderSubscriptions();
      case 'Billing': return renderBilling();
      case 'Coupons': return renderCoupons();
      case 'Companies': return renderCompanies();
      case 'Candidates': return renderCandidates();
      case 'Categories': return renderCategories();
      case 'Jobs': return renderJobs();

      case 'Employer': return renderEmployer();
      case 'Audit Logs': return renderAuditLogs();
      case 'Settings': return renderSettings();
      default: return <div className="p-20 text-center"><h2 className="text-xl font-display font-black text-gray-300">Module Under Construction</h2></div>;
    }
  };

  const renderDashboardOverview = () => (
    <div className="space-y-10 animate-fade-in">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[
          { label: 'Total Revenue', val: `₹${(transactions.reduce((acc, t) => acc + (t.amount || 0), 0)).toLocaleString()}`, trend: 'REALTIME', icon: 'payments', color: 'text-emerald-600', bg: 'bg-emerald-50' },
          { label: 'Active Jobs', val: adminJobs.filter(j => j.status === 'active').length.toString(), trend: '+5%', icon: 'work_outline', color: 'text-blue-600', bg: 'bg-blue-50' },
          { label: 'Pending Verifications', val: adminJobs.filter(j => j.status === 'pending').length.toString(), trend: 'High', icon: 'verified', color: 'text-orange-600', bg: 'bg-orange-50' },
          { label: 'Total Candidates', val: candidates.length.toString(), trend: 'STABLE', icon: 'people_outline', color: 'text-primary', bg: 'bg-primary-soft' },
        ].map((kpi, idx) => (
          <div key={idx} className="bg-white p-6 rounded-[2rem] border border-gray-100 shadow-sm hover:shadow-lg transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`w-12 h-12 rounded-2xl ${kpi.bg} ${kpi.color} flex items-center justify-center`}>
                <span className="material-icons-round">{kpi.icon}</span>
              </div>
              <span className={`text-[10px] font-black px-2 py-1 rounded-lg ${kpi.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-primary'}`}>
                {kpi.trend}
              </span>
            </div>
            <p className="text-[11px] font-black text-gray-400 uppercase tracking-widest">{kpi.label}</p>
            <h4 className="text-3xl font-display font-black text-gray-900 mt-1">{kpi.val}</h4>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-white p-10 rounded-[3rem] border border-gray-100 shadow-card">
          <h3 className="text-xl font-display font-black text-gray-900 mb-8">Recent Revenue Stream</h3>
          <div className="space-y-6">
            {transactions.slice(0, 4).map(txn => (
              <div key={txn.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-2xl">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-500 border border-gray-100">
                    <span className="material-icons-round text-lg">arrow_upward</span>
                  </div>
                  <div>
                    <p className="text-sm font-bold text-gray-900">{txn.userName}</p>
                    <p className="text-[10px] text-gray-400 font-bold uppercase">{txn.planName}</p>
                  </div>
                </div>
                <p className="text-sm font-black text-emerald-600">+₹{txn.amount}</p>
              </div>
            ))}
          </div>
        </div>
        <div className="bg-accent rounded-[3rem] p-10 text-white shadow-premium relative overflow-hidden">
          <h3 className="text-xl font-display font-black mb-6">Subscription Distribution</h3>
          <div className="space-y-6">
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase text-white/40 mb-2"><span>Paid Boostings</span><span>{transactions.length > 0 ? (transactions.filter(t => t.planName.toLowerCase().includes('boost')).length / transactions.length * 100).toFixed(0) : 0}%</span></div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-primary" style={{ width: `${transactions.length > 0 ? (transactions.filter(t => t.planName.toLowerCase().includes('boost')).length / transactions.length * 100) : 0}%` }}></div></div>
            </div>
            <div>
              <div className="flex justify-between text-[10px] font-black uppercase text-white/40 mb-2"><span>Standard Postings</span><span>{adminJobs.length > 0 ? (adminJobs.filter(j => !j.isFeatured).length / adminJobs.length * 100).toFixed(0) : 0}%</span></div>
              <div className="h-2 bg-white/10 rounded-full overflow-hidden"><div className="h-full bg-emerald-400" style={{ width: `${adminJobs.length > 0 ? (adminJobs.filter(j => !j.isFeatured).length / adminJobs.length * 100) : 0}%` }}></div></div>
            </div>
          </div>
          <span className="material-icons-round absolute -right-6 -bottom-6 text-white/5 text-[150px]">analytics</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] flex overflow-x-auto no-scrollbar">
      <div className="flex min-w-[1440px] w-full animate-fade-in">
        <aside className="w-72 bg-[#0F172A] flex flex-col shrink-0 h-screen sticky top-0 z-50 shadow-2xl overflow-y-auto no-scrollbar">
          <div className="p-8 flex items-center gap-4 mb-4">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center shadow-lg">
              <span className="material-icons-round text-white text-2xl">local_fire_department</span>
            </div>
            <div>
              <span className="text-white font-display font-black text-xl tracking-tight block">Token.admin</span>
              <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.2em]">Management Console</span>
            </div>
          </div>
          <nav className="flex-1 px-4 space-y-8 pb-12">
            {menuSections.map((section) => (
              <div key={section.group}>
                <p className="text-[10px] font-black text-white/20 uppercase tracking-[0.25em] px-5 mb-4">{section.group}</p>
                <div className="space-y-1.5">
                  {section.items.map((item) => (
                    <button
                      key={item.label}
                      onClick={() => setActiveMenu(item.label)}
                      className={`w-full flex items-center gap-4 px-5 py-4 rounded-2xl text-[12px] font-bold transition-all relative group ${activeMenu === item.label ? 'bg-primary text-white shadow-2xl shadow-primary/30' : 'text-gray-400 hover:text-white hover:bg-white/5'
                        }`}
                    >
                      <span className="material-icons-round text-xl">{item.icon}</span>
                      <span className="flex-1 text-left">{item.label}</span>
                      {item.alert && (
                        <span className="px-2 py-0.5 rounded-md text-[9px] font-black bg-red-500 text-white">
                          {item.alert}
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </nav>
          <div className="p-6 border-t border-white/5 mt-auto">
            <button onClick={() => setShowLogoutModal(true)} className="w-full flex items-center justify-center gap-3 py-4 text-red-400 hover:bg-red-400/5 rounded-2xl transition-all text-[11px] font-black uppercase border border-red-500/10">
              Terminiate Session
            </button>
          </div>
        </aside>

        <main className="flex-1 flex flex-col h-screen overflow-hidden">
          <header className="bg-white border-b border-gray-100 h-24 flex items-center justify-between px-12 shrink-0 z-40 shadow-sm">
            <div>
              <h1 className="text-3xl font-display font-black text-gray-900 tracking-tight">{activeMenu}</h1>
            </div>
            <div className="flex items-center gap-6">
              <button 
                onClick={handleManualRefresh}
                disabled={isRefreshing}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all ${isRefreshing ? 'bg-primary text-white' : 'bg-gray-50 text-gray-500 hover:bg-gray-100 hover:text-primary'}`}
                title="Refresh All Data"
              >
                <span className={`material-icons-round text-2xl ${isRefreshing ? 'animate-spin' : ''}`}>refresh</span>
              </button>
              <div className="flex items-center gap-4 border-l border-gray-100 pl-6 text-right">
                <div className="space-y-0.5">
                  <p className="text-sm font-black text-gray-900 leading-none">Platform Admin</p>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1">Auth Level: SUPER</p>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-accent flex items-center justify-center text-white font-black text-sm shadow-premium">SA</div>
              </div>
            </div>
          </header>
          <div ref={contentRef} className="flex-1 overflow-y-auto p-12 space-y-12 no-scrollbar bg-[#F8FAFC]">
            {renderActiveView()}
          </div>
        </main>
      </div>

      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-accent/80 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-md rounded-[3.5rem] p-12 shadow-2xl animate-slide-up text-center">
            <h3 className="text-2xl font-display font-black text-gray-900 mb-4">Logout?</h3>
            <p className="text-gray-500 font-medium mb-10 text-sm">Terminate administrative access now?</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setShowLogoutModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest hover:bg-gray-200 transition-colors">Cancel</button>
              <button 
                onClick={() => {
                  localStorage.removeItem('admin_authenticated');
                  onBack();
                }} 
                className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl shadow-red-500/20 active:scale-95 transition-all"
              >
                Sign Out Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── PLAN CREATE / EDIT MODAL ── */}
      {showPlanModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">{editingPlan ? 'Edit Plan' : 'Create New Plan'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Plans Master</p>
              </div>
              <button onClick={() => setShowPlanModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="p-10 space-y-6">
              {/* Row 1: Role + Status */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Role</label>
                  <select
                    value={planForm.role}
                    onChange={e => setPlanForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  >
                    <option value="EMPLOYER">EMPLOYER</option>
                    <option value="EMPLOYEE">EMPLOYEE</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status</label>
                  <select
                    value={planForm.status}
                    onChange={e => setPlanForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </div>
              </div>

              {/* Plan Name */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Plan Name *</label>
                <input
                  type="text"
                  value={planForm.name}
                  onChange={e => setPlanForm(f => ({ ...f, name: e.target.value }))}
                  placeholder="e.g. Recruiter Elite"
                  className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                />
              </div>

              {/* Row 2: Price + Duration */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Price (₹) *</label>
                  <input
                    type="number"
                    min={0}
                    value={planForm.price}
                    onChange={e => setPlanForm(f => ({ ...f, price: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Duration (Days)</label>
                  <input
                    type="number"
                    min={1}
                    value={planForm.durationDays}
                    onChange={e => setPlanForm(f => ({ ...f, durationDays: Number(e.target.value) }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  />
                </div>
              </div>

              {/* Features */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Features <span className="normal-case font-medium">(comma-separated)</span></label>
                <textarea
                  rows={3}
                  value={planForm.features}
                  onChange={e => setPlanForm(f => ({ ...f, features: e.target.value }))}
                  placeholder="5 Job Posts, 2 Featured Listings, Priority Support"
                  className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50 resize-none"
                />
              </div>

              {/* Credits */}
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3">Credits</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'jobPosts', label: 'Job Posts' },
                    { key: 'featuredJobs', label: 'Featured Jobs' },
                    { key: 'resumeUnlocks', label: 'Resume Unlocks' },
                    { key: 'profileBoostDays', label: 'Profile Boost Days' },
                    { key: 'premiumAlerts', label: 'Premium Alerts' },
                  ].map(({ key, label }) => (
                    <div key={key}>
                      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-1">{label}</label>
                      <input
                        type="number"
                        min={0}
                        value={(planForm)[key]}
                        onChange={e => setPlanForm(f => ({ ...f, [key]: Number(e.target.value) }))}
                        className="w-full border border-gray-200 rounded-xl px-4 py-3 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                      />
                    </div>
                  ))}
                </div>
              </div>

              {/* Recommended Toggle */}
              <div className="flex items-center justify-between p-5 bg-gray-50 rounded-2xl">
                <div>
                  <p className="font-black text-gray-800 text-sm">Mark as Recommended</p>
                  <p className="text-[10px] text-gray-400 uppercase font-bold mt-0.5">Shows a "Recommended" badge on the plan card</p>
                </div>
                <button
                  onClick={() => setPlanForm(f => ({ ...f, isRecommended: !f.isRecommended }))}
                  className={`w-12 h-7 rounded-full relative flex items-center transition-colors ${planForm.isRecommended ? 'bg-primary justify-end pr-1' : 'bg-gray-300 justify-start pl-1'}`}
                >
                  <div className="w-5 h-5 bg-white rounded-full shadow-md"></div>
                </button>
              </div>
            </div>

            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowPlanModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                Cancel
              </button>
              <button
                onClick={handlePlanSave}
                disabled={planSaving || !planForm.name.trim()}
                className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {planSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : editingPlan ? 'Save Changes' : 'Create Plan'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE PLAN CONFIRM MODAL ── */}
      {deleteConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
              <span className="material-icons-round text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Plan?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This action cannot be undone. The plan will be permanently removed.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">
                Cancel
              </button>
              <button
                onClick={() => handlePlanDelete(deleteConfirmId)}
                disabled={planDeleting}
                className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60"
              >
                {planDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── SUBSCRIPTION CREATE / EDIT MODAL ── */}
      {showSubModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">{editingSub ? 'Edit Subscription' : 'Add Subscription'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Subscriptions</p>
              </div>
              <button onClick={() => setShowSubModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>

            <div className="p-10 space-y-6">
              {/* Row 1: User Name + Role */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">User Name *</label>
                  <input
                    type="text"
                    value={subForm.userName}
                    onChange={e => setSubForm(f => ({ ...f, userName: e.target.value }))}
                    placeholder="e.g. Rahul Sharma"
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Role</label>
                  <select
                    value={subForm.role}
                    onChange={e => setSubForm(f => ({ ...f, role: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  >
                    <option value="EMPLOYEE">EMPLOYEE</option>
                    <option value="EMPLOYER">EMPLOYER</option>
                  </select>
                </div>
              </div>

              {/* Row 2: User ID (optional) */}
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">User ID <span className="normal-case font-medium">(optional)</span></label>
                <input
                  type="text"
                  value={subForm.userId}
                  onChange={e => setSubForm(f => ({ ...f, userId: e.target.value }))}
                  placeholder="e.g. user_001"
                  className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                />
              </div>

              {/* Row 3: Plan Name + Plan ID */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Plan Name *</label>
                  <input
                    type="text"
                    value={subForm.planName}
                    onChange={e => setSubForm(f => ({ ...f, planName: e.target.value }))}
                    placeholder="e.g. Recruiter Elite"
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                    list="plan-names-list"
                  />
                  <datalist id="plan-names-list">
                    {plans.map(p => <option key={(p)._id || p.id} value={p.name} />)}
                  </datalist>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status</label>
                  <select
                    value={subForm.status}
                    onChange={e => setSubForm(f => ({ ...f, status: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  >
                    <option value="Active">Active</option>
                    <option value="Expired">Expired</option>
                    <option value="Paused">Paused</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>

              {/* Row 4: Start Date + Expiry Date */}
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Start Date</label>
                  <input
                    type="date"
                    value={subForm.startDate}
                    onChange={e => setSubForm(f => ({ ...f, startDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Expiry Date</label>
                  <input
                    type="date"
                    value={subForm.expiryDate}
                    onChange={e => setSubForm(f => ({ ...f, expiryDate: e.target.value }))}
                    className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50"
                  />
                </div>
              </div>
            </div>

            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowSubModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">
                Cancel
              </button>
              <button
                onClick={handleSubSave}
                disabled={subSaving || !subForm.userName.trim() || !subForm.planName.trim()}
                className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2"
              >
                {subSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : editingSub ? 'Save Changes' : 'Add Subscription'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE SUBSCRIPTION CONFIRM MODAL ── */}
      {deleteSubConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
              <span className="material-icons-round text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Subscription?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This action cannot be undone. The subscription record will be permanently removed.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteSubConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleSubDelete(deleteSubConfirmId)} disabled={subDeleting} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                {subDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── TRANSACTION CREATE / EDIT MODAL ── */}
      {showTxModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">{editingTx ? 'Edit Transaction' : 'Add Transaction'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Billing Ledger</p>
              </div>
              <button onClick={() => setShowTxModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">User Name *</label>
                  <input type="text" value={txForm.userName} onChange={e => setTxForm(f => ({ ...f, userName: e.target.value }))} placeholder="e.g. Rahul Sharma" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Plan Name</label>
                  <input type="text" value={txForm.planName} onChange={e => setTxForm(f => ({ ...f, planName: e.target.value }))} placeholder="e.g. Recruiter Elite" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" list="tx-plan-names" />
                  <datalist id="tx-plan-names">{plans.map(p => <option key={(p)._id || p.id} value={p.name} />)}</datalist>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Amount (₹)</label>
                  <input type="number" min={0} value={txForm.amount} onChange={e => setTxForm(f => ({ ...f, amount: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status</label>
                  <select value={txForm.status} onChange={e => setTxForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="Success">Success</option>
                    <option value="Pending">Pending</option>
                    <option value="Failed">Failed</option>
                    <option value="Refunded">Refunded</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Payment Method</label>
                  <select value={txForm.method} onChange={e => setTxForm(f => ({ ...f, method: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="UPI">UPI</option>
                    <option value="Net Banking">Net Banking</option>
                    <option value="Credit Card">Credit Card</option>
                    <option value="Debit Card">Debit Card</option>
                    <option value="Wallet">Wallet</option>
                    <option value="Cash">Cash</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Date</label>
                  <input type="date" value={txForm.date} onChange={e => setTxForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
            </div>
            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowTxModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              <button onClick={handleTxSave} disabled={txSaving || !txForm.userName.trim()} className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {txSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : editingTx ? 'Save Changes' : 'Add Transaction'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE TRANSACTION CONFIRM MODAL ── */}
      {deleteTxConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6">
              <span className="material-icons-round text-3xl">delete_forever</span>
            </div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Transaction?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This transaction record will be permanently removed.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteTxConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleTxDelete(deleteTxConfirmId)} disabled={txDeleting} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                {txDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COUPON CREATE / EDIT MODAL ── */}
      {showCouponModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">{editingCoupon ? 'Edit Coupon' : 'New Coupon'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Discount Coupons</p>
              </div>
              <button onClick={() => setShowCouponModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Coupon Code *</label>
                <input type="text" value={couponForm.code} onChange={e => setCouponForm(f => ({ ...f, code: e.target.value.toUpperCase() }))} placeholder="e.g. SAVE20" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50 uppercase tracking-widest" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Applicable To</label>
                  <select value={couponForm.role} onChange={e => setCouponForm(f => ({ ...f, role: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="BOTH">Both (Employer & Employee)</option>
                    <option value="EMPLOYER">Employer Only</option>
                    <option value="EMPLOYEE">Employee Only</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Discount Type</label>
                  <select value={couponForm.discountType} onChange={e => setCouponForm(f => ({ ...f, discountType: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="PERCENT">Percentage (%)</option>
                    <option value="FLAT">Flat Amount (₹)</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Value {couponForm.discountType === 'PERCENT' ? '(%)' : '(₹)'}</label>
                  <input type="number" min={0} max={couponForm.discountType === 'PERCENT' ? 100 : undefined} value={couponForm.value} onChange={e => setCouponForm(f => ({ ...f, value: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Valid Until</label>
                  <input type="date" value={couponForm.validUntil} onChange={e => setCouponForm(f => ({ ...f, validUntil: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Usage Limit</label>
                  <input type="number" min={0} value={couponForm.usageLimit} onChange={e => setCouponForm(f => ({ ...f, usageLimit: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Current Usage Count</label>
                  <input type="number" min={0} value={couponForm.usageCount} onChange={e => setCouponForm(f => ({ ...f, usageCount: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
            </div>
            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowCouponModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              <button onClick={handleCouponSave} disabled={couponSaving || !couponForm.code.trim()} className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {couponSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : editingCoupon ? 'Save Changes' : 'Create Coupon'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE COUPON CONFIRM MODAL ── */}
      {deleteCouponConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6"><span className="material-icons-round text-3xl">delete_forever</span></div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Coupon?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This coupon code will be permanently removed and can no longer be redeemed.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteCouponConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleCouponDelete(deleteCouponConfirmId)} disabled={couponDeleting} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                {couponDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── COMPANY CREATE / EDIT MODAL ── */}
      {showCompanyModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">{editingCompany ? 'Edit Company' : 'Add Company'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Employer Organization</p>
              </div>
              <button onClick={() => setShowCompanyModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="flex flex-col items-center gap-4 mb-2">
                <button
                  onClick={() => document.getElementById('companyLogoInput')?.click()}
                  className="relative w-24 h-24 rounded-[1.5rem] bg-gray-50 border-2 border-dashed border-gray-200 flex items-center justify-center overflow-hidden hover:border-primary/40 transition-colors shadow-sm"
                >
                  {companyLogoPreview ? <img src={companyLogoPreview} alt="Logo" className="w-full h-full object-cover" /> : <span className="material-icons-round text-gray-300 text-3xl">add_photo_alternate</span>}
                </button>
                <input id="companyLogoInput" type="file" accept="image/*" className="hidden" onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    setCompanyLogoFile(file);
                    const reader = new FileReader();
                    reader.onload = () => setCompanyLogoPreview(reader.result);
                    reader.readAsDataURL(file);
                  }
                }} />
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest text-center px-1 truncate w-full">
                  {companyLogoFile ? companyLogoFile.name : 'Company Logo'}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Company Name *</label>
                  <input type="text" value={companyForm.name} onChange={e => setCompanyForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. TechNova Solutions" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Industry</label>
                  <input type="text" value={companyForm.industry} onChange={e => setCompanyForm(f => ({ ...f, industry: e.target.value }))} placeholder="e.g. Software, IT Services" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Location</label>
                  <input type="text" value={companyForm.location} onChange={e => setCompanyForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Bangalore" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status</label>
                  <select value={companyForm.status} onChange={e => setCompanyForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="Active">Active</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email</label>
                  <input type="email" value={companyForm.email} onChange={e => setCompanyForm(f => ({ ...f, email: e.target.value }))} placeholder="contact@company.com" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Website</label>
                  <input type="text" value={companyForm.website} onChange={e => setCompanyForm(f => ({ ...f, website: e.target.value }))} placeholder="https://company.com" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Active Job Postings</label>
                <input type="number" min={0} value={companyForm.activeJobs} onChange={e => setCompanyForm(f => ({ ...f, activeJobs: Number(e.target.value) }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
              </div>
            </div>
            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowCompanyModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              <button onClick={handleCompanySave} disabled={companySaving || !companyForm.name.trim()} className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {companySaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : editingCompany ? 'Save Changes' : 'Add Company'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE COMPANY CONFIRM ── */}
      {deleteCompanyConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6"><span className="material-icons-round text-3xl">delete_forever</span></div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Company?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This company profile will be permanently removed.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteCompanyConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleCompanyDelete(deleteCompanyConfirmId)} disabled={companyDeleting} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                {companyDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── CANDIDATE CREATE / EDIT MODAL ── */}
      {showCandidateModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">{editingCandidate ? 'Edit Candidate' : 'Add Candidate'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Talent Pool Profile</p>
              </div>
              <button onClick={() => setShowCandidateModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Full Name *</label>
                  <input type="text" value={candidateForm.name} onChange={e => setCandidateForm(f => ({ ...f, name: e.target.value }))} placeholder="e.g. Rahul Sharma" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Email</label>
                  <input type="email" value={candidateForm.email} onChange={e => setCandidateForm(f => ({ ...f, email: e.target.value }))} placeholder="candidate@email.com" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Role / Designation</label>
                  <input type="text" value={candidateForm.role} onChange={e => setCandidateForm(f => ({ ...f, role: e.target.value }))} placeholder="e.g. Full Stack Developer" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Location</label>
                  <input type="text" value={candidateForm.location} onChange={e => setCandidateForm(f => ({ ...f, location: e.target.value }))} placeholder="e.g. Pune" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Experience</label>
                  <input type="number" min="0" value={candidateForm.experience} onChange={e => setCandidateForm(f => ({ ...f, experience: e.target.value }))} placeholder="e.g. 3" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status</label>
                  <select value={candidateForm.status} onChange={e => setCandidateForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="Verified">Verified</option>
                    <option value="Pending">Pending</option>
                    <option value="Suspended">Suspended</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Skills (comma separated)</label>
                <input type="text" value={candidateForm.skills} onChange={e => setCandidateForm(f => ({ ...f, skills: e.target.value }))} placeholder="e.g. React, Node.js, MongoDB" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
              </div>
            </div>
            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowCandidateModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              <button onClick={handleCandidateSave} disabled={candidateSaving || !candidateForm.name.trim()} className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {candidateSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : editingCandidate ? 'Save Changes' : 'Add Candidate'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE CANDIDATE CONFIRM ── */}
      {deleteCandidateConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6"><span className="material-icons-round text-3xl">delete_forever</span></div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Candidate?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This candidate profile will be permanently removed from the talent pool.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteCandidateConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleCandidateDelete(deleteCandidateConfirmId)} disabled={candidateDeleting} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                {candidateDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── FLAGGED ITEM CREATE / EDIT MODAL ── */}
      {showFlagModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">{editingFlag ? 'Edit Flagged Item' : 'Flag New Item'}</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Content Moderation</p>
              </div>
              <button onClick={() => setShowFlagModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Content Type</label>
                  <select value={flagForm.type} onChange={e => setFlagForm(f => ({ ...f, type: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="Job Post">Job Post</option>
                    <option value="Profile">Profile</option>
                    <option value="Comment">Comment</option>
                    <option value="Review">Review</option>
                    <option value="Message">Message</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Priority</label>
                  <select value={flagForm.priority} onChange={e => setFlagForm(f => ({ ...f, priority: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="High">High</option>
                    <option value="Medium">Medium</option>
                    <option value="Low">Low</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Content Description *</label>
                <input type="text" value={flagForm.content} onChange={e => setFlagForm(f => ({ ...f, content: e.target.value }))} placeholder="e.g. Senior Developer Role posting by Company X" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Reason for Flagging</label>
                <input type="text" value={flagForm.reason} onChange={e => setFlagForm(f => ({ ...f, reason: e.target.value }))} placeholder="e.g. Inappropriate Language, Spam, Policy Violation" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Status</label>
                  <select value={flagForm.status} onChange={e => setFlagForm(f => ({ ...f, status: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50">
                    <option value="Pending">Pending</option>
                    <option value="Approved">Approved</option>
                    <option value="Rejected">Rejected</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Date</label>
                  <input type="date" value={flagForm.date} onChange={e => setFlagForm(f => ({ ...f, date: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
            </div>
            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowFlagModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              <button onClick={handleFlagSave} disabled={flagSaving || !flagForm.content.trim()} className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {flagSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : editingFlag ? 'Save Changes' : 'Flag Item'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE FLAGGED ITEM CONFIRM ── */}
      {/* ── DELETE CATEGORY CONFIRM ── */}
      {deleteCategoryConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6"><span className="material-icons-round text-3xl">delete_forever</span></div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Category?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This category and all its sub-categories will be permanently removed.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteCategoryConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleCategoryDelete(deleteCategoryConfirmId)} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 active:scale-95 transition-all">Delete</button>
            </div>
          </div>
        </div>
      )}

      {deleteFlagConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6"><span className="material-icons-round text-3xl">delete_forever</span></div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Remove Flag?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This flagged item record will be permanently deleted.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteFlagConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleFlagDelete(deleteFlagConfirmId)} disabled={flagDeleting} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                {flagDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── AUDIT LOG CREATE MODAL ── */}
      {showAuditModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">Add Audit Log</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Security Event Record</p>
              </div>
              <button onClick={() => setShowAuditModal(false)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="p-10 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Admin Name</label>
                  <input type="text" value={auditForm.adminName} onChange={e => setAuditForm(f => ({ ...f, adminName: e.target.value }))} placeholder="e.g. SuperAdmin" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
                <div>
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Timestamp</label>
                  <input type="datetime-local" value={auditForm.timestamp} onChange={e => setAuditForm(f => ({ ...f, timestamp: e.target.value }))} className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
                </div>
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Action *</label>
                <input type="text" value={auditForm.action} onChange={e => setAuditForm(f => ({ ...f, action: e.target.value }))} placeholder="e.g. PLAN_UPDATED, USER_BANNED" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50 uppercase" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Target</label>
                <input type="text" value={auditForm.target} onChange={e => setAuditForm(f => ({ ...f, target: e.target.value }))} placeholder="e.g. Recruiter Elite Plan" className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
              </div>
              <div>
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest block mb-2">Details</label>
                <input type="text" value={auditForm.details} onChange={e => setAuditForm(f => ({ ...f, details: e.target.value }))} placeholder="Additional context..." className="w-full border border-gray-200 rounded-2xl px-5 py-4 text-sm font-bold text-gray-800 focus:outline-none focus:ring-2 focus:ring-primary/30 bg-gray-50" />
              </div>
            </div>
            <div className="p-10 pt-0 grid grid-cols-2 gap-4">
              <button onClick={() => setShowAuditModal(false)} className="py-5 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest active:scale-95 transition-all">Cancel</button>
              <button onClick={handleAuditSave} disabled={auditSaving || !auditForm.action.trim()} className="py-5 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-primary/20 active:scale-95 transition-all disabled:opacity-60 flex items-center justify-center gap-2">
                {auditSaving ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Saving...</> : 'Add Log'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── DELETE AUDIT LOG CONFIRM ── */}
      {deleteAuditConfirmId && (
        <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-sm rounded-[3rem] p-10 shadow-2xl animate-slide-up text-center">
            <div className="w-16 h-16 bg-red-50 rounded-3xl flex items-center justify-center text-primary mx-auto mb-6"><span className="material-icons-round text-3xl">delete_forever</span></div>
            <h3 className="text-xl font-display font-black text-gray-900 mb-2">Delete Audit Log?</h3>
            <p className="text-sm font-medium text-gray-500 mb-8">This log entry will be permanently removed from the security timeline.</p>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => setDeleteAuditConfirmId(null)} className="py-4 bg-gray-100 text-gray-700 rounded-[2rem] text-xs font-black uppercase tracking-widest">Cancel</button>
              <button onClick={() => handleAuditDelete(deleteAuditConfirmId)} disabled={auditDeleting} className="py-4 bg-primary text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-lg shadow-red-500/20 flex items-center justify-center gap-2 disabled:opacity-60">
                {auditDeleting ? <><span className="material-icons-round animate-spin text-sm">autorenew</span> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── JOB DETAILS VIEW MODAL ── */}
      {selectedJobDetails && (
        <div className="fixed inset-0 z-[150] flex items-center justify-center p-6 bg-accent/70 backdrop-blur-md animate-fade-in">
          <div className="bg-white w-full max-w-2xl rounded-[3rem] shadow-2xl animate-slide-up overflow-y-auto max-h-[90vh]">
            <div className="p-10 border-b border-gray-100 flex items-center justify-between sticky top-0 bg-white z-10">
              <div>
                <h3 className="text-2xl font-display font-black text-gray-900">Job Details</h3>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mt-1">Reviewing Post Content</p>
              </div>
              <button onClick={() => setSelectedJobDetails(null)} className="w-10 h-10 rounded-2xl bg-gray-100 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors">
                <span className="material-icons-round">close</span>
              </button>
            </div>
            <div className="p-10 space-y-8">
              <div className="flex items-center gap-6 pb-8 border-b border-gray-50">
                <div className="w-20 h-20 rounded-[2rem] bg-primary/5 flex items-center justify-center border border-primary/10">
                  {selectedJobDetails.companyLogo ? (
                    <img src={selectedJobDetails.companyLogo} className="w-full h-full object-cover rounded-[2rem]" alt="Logo" />
                  ) : (
                    <span className="material-icons-round text-primary text-4xl">business</span>
                  )}
                </div>
                <div>
                  <h4 className="text-3xl font-display font-black text-accent">{selectedJobDetails.title}</h4>
                  <p className="text-sm font-black text-primary uppercase tracking-widest mt-1">{selectedJobDetails.company}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-6">
                <div className="p-5 bg-gray-50 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Salary Package</p>
                  <p className="text-sm font-bold text-accent">{selectedJobDetails.salary}</p>
                </div>
                <div className="p-5 bg-gray-50 rounded-2xl">
                  <p className="text-[9px] font-black text-gray-400 uppercase mb-1">Location / Mode</p>
                  <p className="text-sm font-bold text-accent">{selectedJobDetails.location} ({selectedJobDetails.workMode})</p>
                </div>
              </div>
              <div>
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Job Description</p>
                <p className="text-sm text-gray-600 leading-relaxed font-medium bg-gray-50/50 p-6 rounded-3xl border border-gray-50 whitespace-pre-wrap">{selectedJobDetails.description}</p>
              </div>
              <div className="grid grid-cols-2 gap-8">
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Requirements</p>
                  <ul className="space-y-2">
                    {selectedJobDetails.requirements?.map((req, i) => (
                      <li key={i} className="flex items-start gap-2 text-xs font-bold text-gray-700">
                        <span className="material-icons-round text-primary text-xs mt-0.5">check_circle</span> {req}
                      </li>
                    ))}
                  </ul>
                </div>
                <div>
                  <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-4">Core Skills</p>
                  <div className='flex flex-wrap gap-2'>
                    {selectedJobDetails.skills?.map((s, i) => (
                      <span key={i} className='px-3 py-1.5 bg-accent/5 text-accent rounded-lg text-[10px] font-black uppercase tracking-tight'>{s}</span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
            <div className='p-10 pt-0'>
              <button onClick={() => setSelectedJobDetails(null)} className='w-full py-5 bg-accent text-white rounded-[2rem] text-xs font-black uppercase tracking-widest shadow-xl active:scale-95 transition-all'>
                Close Review
              </button>
            </div>
          </div>
        </div>
      )}
      {showJobModal && renderJobModal()}
    </div>
  );
};
