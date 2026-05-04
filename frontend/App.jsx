import React, { useState, useEffect } from 'react';
import { SplashScreen } from './components/SplashScreen';
import { BottomNav } from './components/BottomNav';
import { Home } from './screens/Home';
import { Search } from './screens/Search';
import { HireSearch } from './screens/HireSearch';
import { JobDetails } from './screens/JobDetails';
import { TalentDetails } from './screens/TalentDetails';
import { Menu } from './screens/Menu';
import { Favorites } from './screens/Favorites';
import { Chats } from './screens/Chats';
import { AdminDashboard } from './screens/AdminDashboard';
import { AdminLogin } from './screens/AdminLogin';
import { IntentModal } from './components/IntentModal';
import { Login } from './screens/Login';
import { Profile } from './screens/Profile';
import { Tracker } from './screens/Tracker';
import { RecruiterDashboard } from './screens/RecruiterDashboard';
import { PostJob } from './screens/PostJob';
import { PackageSelection } from './screens/PackageSelection';
import { PaymentMethod } from './screens/PaymentMethod';
import { RecruiterAuth } from './screens/RecruiterAuth';
import { AICoach } from './screens/AICoach';
import { CompanyProfile } from './screens/CompanyProfile';
import { PolicyScreen } from './screens/PolicyScreen';
import { AllCategories } from './screens/AllCategories';
import { ServiceDetails } from './screens/ServiceDetails';
import { RoleSelection } from './screens/RoleSelection';
import { AppScreen } from './types';

const App = () => {
  const [currentScreen, setCurrentScreen] = useState(AppScreen.SPLASH);
  const [selectedJob, setSelectedJob] = useState(null);
  const [selectedTalent, setSelectedTalent] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState(undefined);
  const [selectedJobType, setSelectedJobType] = useState(undefined);
  const [selectedQualification, setSelectedQualification] = useState(undefined);
  const [favorites, setFavorites] = useState(() => {
    const saved = localStorage.getItem('token_favorites');
    return saved ? JSON.parse(saved) : [];
  });
  const [currentJobId, setCurrentJobId] = useState(null);
  const [showIntentModal, setShowIntentModal] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isRecruiterLoggedIn, setIsRecruiterLoggedIn] = useState(false);
  const [hasPaidJob, setHasPaidJob] = useState(false);
  const [hasApprovedJob, setHasApprovedJob] = useState(false);
  const [paymentContext, setPaymentContext] = useState({
    planId: null,
    planName: undefined,
    amount: undefined,
    isBoosted: false,
    couponCode: undefined,
    discount: undefined,
    planCredits: 3
  });
  const [postJobCategory, setPostJobCategory] = useState(null);
  const [allJobs, setAllJobs] = useState([]);
  const [activeService, setActiveService] = useState('GOLD');

  // Fetch all jobs globally
  useEffect(() => {
    const fetchJobs = () => {
      fetch(API_URL + '/api/jobs')
        .then(res => res.json())
        .then(data => {
          if (Array.isArray(data)) {
            const formatted = data.map((j) => ({
              id: j._id || j.id,
              title: j.title || 'Untitled Job',
              company: j.company || 'Unknown Company',
              location: j.location || 'Remote',
              salary: j.salary || 'Competitive',
              type: j.type || 'Full Time',
              experience: j.experience || 'Entry Level',
              education: j.education || 'Bachelors Degree',
              postedAt: j.postedAt || 'Recently',
              category: j.category || 'General',
              isFeatured: j.isFeatured || false,
              description: j.description || '',
              companyLogo: j.companyLogo || '',
              imageUrl: j.imageUrl || '',
              responsibilities: Array.isArray(j.requirements) ? j.requirements : (typeof j.requirements === 'string' && j.requirements ? j.requirements.split(',').map((s) => s.trim()) : []),
              requirements: Array.isArray(j.skills) ? j.skills : (typeof j.skills === 'string' && j.skills ? j.skills.split(',').map((s) => s.trim()) : []),
              workMode: j.workMode || 'Onsite'
            }));
            setAllJobs(formatted);
          }
        })
        .catch(err => console.error('Global Fetch Error:', err));
    };

    fetchJobs();
    const interval = setInterval(fetchJobs, 10000); // 10s refresh for live updates
    return () => clearInterval(interval);
  }, []);

  // Periodically check for job approval
  useEffect(() => {
    const recruiterEmail = localStorage.getItem('recruiter_email');
    if (!recruiterEmail) return;

    const checkJobStatus = async () => {
      try {
        // Query jobs for this recruiter
        const res = await fetch(`/api/admin/jobs`);
        if (res.ok) {
          const allJobs = await res.json();
          const formattedEmail = String(recruiterEmail || '').trim().toLowerCase();
          const myJobs = allJobs.filter((j) => String(j.recruiterEmail || '').trim().toLowerCase() === formattedEmail);
          const approved = myJobs.some((j) => j.status === 'active');
          const paid = myJobs.some((j) => j.status === 'paid' || j.status === 'active');
          setHasApprovedJob(approved);
          setHasPaidJob(paid);
        }
      } catch (e) {
        console.warn('Status check failed');
      }
    };

    checkJobStatus();
    const interval = setInterval(checkJobStatus, 10000); // Check every 10s
    return () => clearInterval(interval);
  }, [currentScreen]);

  // Helper: check if user is logged in
  const isUserLoggedIn = () => {
    return !!localStorage.getItem('candidate_mobile');
  };

  useEffect(() => {
    if (currentScreen === AppScreen.SPLASH) {
      const timer = setTimeout(() => {
        setCurrentScreen(AppScreen.LOGIN);
      }, 2500);
      return () => clearTimeout(timer);
    } else {
      localStorage.setItem('token_current_screen', currentScreen);
    }
  }, [currentScreen]);

  const [navigationStack, setNavigationStack] = useState([AppScreen.ROLE_SELECTION]);

  const handleNavigate = (screen) => {
    setCurrentScreen(screen);
    setNavigationStack(prev => {
      // Don't push duplicate consecutive screens
      if (prev[prev.length - 1] === screen) return prev;
      return [...prev, screen];
    });
    window.scrollTo(0, 0);

    // Sync URL based on screen
    const pathMap = {
      [AppScreen.HOME]: '/',
      [AppScreen.ADMIN]: '/admin',
      [AppScreen.ADMIN_LOGIN]: '/admin-login',
      [AppScreen.RECRUITER_DASHBOARD]: '/dashboard',
      [AppScreen.PROFILE]: '/profile',
      [AppScreen.MENU]: '/menu',
      [AppScreen.TRACKER]: '/status'
    };

    if (pathMap[screen]) {
      window.history.pushState({ screen }, '', pathMap[screen]);
    }
  };

  const handleBack = () => {
    setNavigationStack(prev => {
      if (prev.length > 1) {
        const newStack = [...prev];
        newStack.pop(); // remove current
        const lastScreen = newStack[newStack.length - 1];
        setCurrentScreen(lastScreen);
        window.scrollTo(0, 0);

        const pathMap = {
          [AppScreen.HOME]: '/',
          [AppScreen.ADMIN]: '/admin',
          [AppScreen.ADMIN_LOGIN]: '/admin-login',
          [AppScreen.RECRUITER_DASHBOARD]: '/dashboard',
          [AppScreen.PROFILE]: '/profile',
          [AppScreen.MENU]: '/menu',
          [AppScreen.TRACKER]: '/status'
        };

        if (pathMap[lastScreen]) {
          window.history.replaceState({ screen: lastScreen }, '', pathMap[lastScreen]);
        }

        return newStack;
      } else {
        // Fallback
        setCurrentScreen(AppScreen.ROLE_SELECTION);
        return [AppScreen.ROLE_SELECTION];
      }
    });
  };

  useEffect(() => {
    const handleUrlChange = () => {
      const path = window.location.pathname;
      const isAdminAuth = localStorage.getItem('admin_authenticated') === 'true';
      const loggedIn = !!localStorage.getItem('candidate_mobile');

      // If user is not logged in, always redirect to login (except admin routes)
      if (!loggedIn && path !== '/admin' && path !== '/admin-login') {
        setCurrentScreen(AppScreen.LOGIN);
        return;
      }

      if (path === '/admin') {
        if (isAdminAuth) setCurrentScreen(AppScreen.ADMIN);
        else setCurrentScreen(AppScreen.ADMIN_LOGIN);
      } else if (path === '/admin-login') {
        setCurrentScreen(AppScreen.ADMIN_LOGIN);
      } else if (path === '/dashboard') {
        setCurrentScreen(AppScreen.RECRUITER_DASHBOARD);
      } else if (path === '/profile') {
        setCurrentScreen(AppScreen.PROFILE);
      } else if (path === '/menu') {
        setCurrentScreen(AppScreen.MENU);
      } else if (path === '/status') {
        setCurrentScreen(AppScreen.TRACKER);
      } else if (path === '/') {
        setCurrentScreen(AppScreen.ROLE_SELECTION);
      }
    };

    window.addEventListener('popstate', handleUrlChange);
    // Trigger on initial load after a small delay to allow splash logic if needed
    const timeout = setTimeout(handleUrlChange, 2600);
    return () => {
      window.removeEventListener('popstate', handleUrlChange);
      clearTimeout(timeout);
    };
  }, []);

  const toggleFavorite = (jobId) => {
    setFavorites(prev =>
      prev.includes(jobId) ? prev.filter(id => id !== jobId) : [...prev, jobId]
    );
  };

  // Sync favorites to localStorage whenever they change
  useEffect(() => {
    localStorage.setItem('token_favorites', JSON.stringify(favorites));
  }, [favorites]);

  const handleShare = async (job) => {
    const shareData = {
      title: `${job.title} at ${job.company}`,
      text: `Hey, check out this job: ${job.title} at ${job.company} via TokenJobs!`,
      url: window.location.origin
    };

    if (navigator.share) {
      try {
        await navigator.share(shareData);
      } catch (err) {
        console.log('Share failed:', err);
      }
    } else {
      try {
        await navigator.clipboard.writeText(`${shareData.text} \nApply here: ${shareData.url}`);
        alert('Job link copied to clipboard!');
      } catch (err) {
        console.error('Copy failed', err);
      }
    }
  };

  const startDownload = () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    const interval = setInterval(() => {
      setDownloadProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => setIsDownloading(false), 500);
          return 100;
        }
        return prev + 2;
      });
    }, 50);
  };

  const renderScreen = () => {
    switch (currentScreen) {
      case AppScreen.LOGIN:
        return <Login onLogin={() => handleNavigate(AppScreen.ROLE_SELECTION)} />;
      case AppScreen.ROLE_SELECTION:
        return (
          <RoleSelection 
            onBack={() => handleNavigate(AppScreen.LOGIN)}
            onSelect={(role) => {
              if (role === 'job_seeker') {
                handleNavigate(AppScreen.HOME);
              } else {
                // Explicitly check login or go to auth
                const recruiterEmail = localStorage.getItem('recruiter_email');
                if (recruiterEmail) {
                  handleNavigate(AppScreen.RECRUITER_DASHBOARD);
                } else {
                  handleNavigate(AppScreen.RECRUITER_AUTH);
                }
              }
            }}
          />
        );
      case AppScreen.HOME:
        return (
          <Home
            onSelectCategory={(cat) => { setSelectedCategory(cat); setSelectedJobType(undefined); setSelectedQualification(undefined); handleNavigate(AppScreen.SEARCH); }}
            onSelectJob={(job) => { setSelectedJob(job); handleNavigate(AppScreen.DETAILS); }}
            onSearch={(jobType, qual) => {
              setSelectedCategory(undefined);
              setSelectedJobType(jobType);
              setSelectedQualification(qual);
              handleNavigate(AppScreen.SEARCH);
            }}
            onDownload={startDownload}
            onNavigate={handleNavigate}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            hasPaidJob={hasPaidJob}
            hasApprovedJob={hasApprovedJob}
            jobs={allJobs}
          />
        );
      case AppScreen.SEARCH:
        return (
          <Search
            initialCategory={selectedCategory}
            initialJobType={selectedJobType}
            initialExperience={undefined}
            initialQualification={selectedQualification}
            onSelectJob={(job) => { setSelectedJob(job); handleNavigate(AppScreen.DETAILS); }}
            onBack={() => { setSelectedCategory(undefined); setSelectedJobType(undefined); setSelectedQualification(undefined); handleNavigate(AppScreen.HOME); }}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            jobs={allJobs}
          />
        );
      case AppScreen.DETAILS:
        return selectedJob ? (
          <JobDetails
            job={selectedJob}
            onBack={() => handleNavigate(AppScreen.SEARCH)}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            onShare={handleShare}
          />
        ) : (
          <Home
            onSelectCategory={(cat) => { setSelectedCategory(cat); handleNavigate(AppScreen.SEARCH); }}
            onSelectJob={(job) => { setSelectedJob(job); handleNavigate(AppScreen.DETAILS); }}
            onSearch={(jobType, qual) => {
              if (jobType) setSelectedJobType(jobType);
              if (qual) setSelectedQualification(qual);
              handleNavigate(AppScreen.SEARCH);
            }}
            onDownload={startDownload}
            onNavigate={handleNavigate}
            favorites={favorites}
            onToggleFavorite={toggleFavorite}
            hasPaidJob={hasPaidJob}
            hasApprovedJob={hasApprovedJob}
            jobs={allJobs}
          />
        );
      case AppScreen.TRACKER:
        return <Tracker onBack={handleBack} />;
      case AppScreen.PROFILE:
        return <Profile onBack={handleBack} onNavigate={handleNavigate} hasPaidJob={hasPaidJob} />;
      case AppScreen.RECRUITER_DASHBOARD:
        if (!isRecruiterLoggedIn) {
          return <RecruiterAuth onBack={handleBack} pendingJobId={currentJobId} onSuccess={() => { setIsRecruiterLoggedIn(true); handleNavigate(AppScreen.RECRUITER_DASHBOARD); }} />;
        }
        return <RecruiterDashboard onBack={handleBack} onPostJob={() => handleNavigate(AppScreen.HIRE_SEARCH)} onNavigate={handleNavigate} />;
      case AppScreen.RECRUITER_AUTH:
        return <RecruiterAuth onBack={handleBack} pendingJobId={currentJobId} onSuccess={() => { setIsRecruiterLoggedIn(true); handleNavigate(AppScreen.RECRUITER_DASHBOARD); }} />;
      case AppScreen.POST_JOB:
        return <PostJob
          initialCategory={postJobCategory?.category}
          initialSubCategory={postJobCategory?.subCategory}
          onBack={handleBack}
          onPostSuccess={async (jobId, isBoosted) => {
            const email = localStorage.getItem('recruiter_email');
            if (!email) {
              // Not logged in as recruiter → go to packages
              setCurrentJobId(jobId);
              setPaymentContext(p => ({ ...p, isBoosted }));
              handleNavigate(AppScreen.PACKAGE_SELECTION);
              return;
            }

            const formattedEmail = email.trim().toLowerCase();

            // PRIMARY CHECK: Email-keyed localStorage (fast & reliable)
            const localLimit = parseInt(localStorage.getItem(`recruiter_limit_${formattedEmail}`) || '0');
            const localUsed = parseInt(localStorage.getItem(`recruiter_used_${formattedEmail}`) || '0');
            const localRemaining = localLimit - localUsed;

            if (localLimit > 0 && localRemaining > 0) {
              if (isBoosted) {
                setCurrentJobId(jobId);
                setPaymentContext(prev => ({ ...prev, planId: 'boost_only', planName: 'Elite Boost Upgrade', amount: 1499, isBoosted: true }));
                handleNavigate(AppScreen.PAYMENT_METHOD);
                return;
              }

              // Use one credit
              const newUsed = localUsed + 1;
              localStorage.setItem(`recruiter_used_${formattedEmail}`, newUsed.toString());

              // Update job status
              await fetch(`/api/jobs/${jobId}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'paid', isFeatured: false, paymentInfo: { method: 'plan_credit', amount: 0, planName: 'Plan Credit', paidAt: new Date().toISOString() } })
              }).catch(console.warn);

              // Sync to backend
              fetch(API_URL + '/api/subscriptions/use-credit', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ email: formattedEmail })
              }).catch(console.warn);

              const newRemaining = localLimit - newUsed;
              if (newRemaining === 0) {
                alert(`✅ Job posted successfully!\n\n⚠️ Your plan has been fully used.\nYou've used all ${localLimit} job posts included in your plan.\nPlease purchase a new plan to post more jobs.`);
              } else if (newRemaining === 1) {
                alert(`✅ Job posted successfully!\n\n📌 Heads up! Only 1 job post remaining in your current plan.\nAfter your next post, you'll need to buy a new plan.`);
              } else {
                alert(`✅ Job posted successfully!\nYou have ${newRemaining} more free job posts remaining in your plan.`);
              }
              handleNavigate(AppScreen.RECRUITER_DASHBOARD);
              return;
            }

            // If local limit is set but exhausted → show expiry alert
            if (localLimit > 0 && localRemaining <= 0) {
              alert(`⚠️ Your plan has expired!

You've used all ${localLimit} job posts in your plan.
Please purchase a new plan to continue posting jobs.`);
              setCurrentJobId(jobId);
              setPaymentContext(p => ({ ...p, isBoosted }));
              handleNavigate(AppScreen.PACKAGE_SELECTION);
              return;
            }

            // FALLBACK: Check backend subscription (for users who bought plan before this update)
            try {
              const res = await fetch(`/api/subscriptions/active/${formattedEmail}`);
              const sub = await res.json();
              const remaining = sub?.remainingCredits || 0;
              const total = sub?.creditsTotal || 0;

              if (sub && remaining > 0) {
                if (isBoosted) {
                  setCurrentJobId(jobId);
                  setPaymentContext(prev => ({ ...prev, planId: 'boost_only', planName: 'Elite Boost Upgrade', amount: 1499, isBoosted: true }));
                  handleNavigate(AppScreen.PAYMENT_METHOD);
                  return;
                }

                // Use credit from backend sub, also set localStorage for future
                localStorage.setItem(`recruiter_limit_${formattedEmail}`, total.toString());
                localStorage.setItem(`recruiter_used_${formattedEmail}`, (total - remaining + 1).toString());

                await fetch(`/api/jobs/${jobId}`, {
                  method: 'PUT',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ status: 'paid', isFeatured: false, paymentInfo: { method: 'plan_credit', amount: 0, planName: 'Plan Credit', paidAt: new Date().toISOString() } })
                }).catch(console.warn);

                fetch(API_URL + '/api/subscriptions/use-credit', {
                  method: 'POST',
                  headers: { 'Content-Type': 'application/json' },
                  body: JSON.stringify({ email: formattedEmail })
                }).catch(console.warn);

                const newRemaining = remaining - 1;
                if (newRemaining === 0) {
                  alert(`✅ Job posted successfully!

⚠️ Your plan has been fully used.
You've used all ${total} job posts in your plan. Please buy a new plan to post more.`);
                } else {
                  alert(`✅ Job posted successfully!
You have ${newRemaining} more free job posts remaining in your plan.`);
                }
                handleNavigate(AppScreen.RECRUITER_DASHBOARD);
                return;
              }
            } catch (e) {
              console.warn('Backend check failed');
            }

            // No credits anywhere → Buy new plan
            setCurrentJobId(jobId);
            setPaymentContext(p => ({ ...p, isBoosted }));
            handleNavigate(AppScreen.PACKAGE_SELECTION);
          }}
        />;
      case AppScreen.PACKAGE_SELECTION:
        return (
          <PackageSelection
            jobId={currentJobId}
            isBoosted={paymentContext.isBoosted}
            onBack={handleBack}
            onNext={(ctx) => {
              setPaymentContext(prev => ({ ...prev, ...ctx }));
              handleNavigate(AppScreen.PAYMENT_METHOD);
            }}
          />
        );
      case AppScreen.PAYMENT_METHOD:
        return (
          <PaymentMethod
            jobId={currentJobId}
            planId={paymentContext.planId}
            planName={paymentContext.planName}
            amount={paymentContext.amount}
            isBoosted={paymentContext.isBoosted}
            couponCode={paymentContext.couponCode}
            discount={paymentContext.discount}
            planCredits={paymentContext.planCredits}
            onBack={handleBack}
            onComplete={() => {
              setHasPaidJob(true);
              handleNavigate(AppScreen.RECRUITER_DASHBOARD);
            }}
          />
        );
      case AppScreen.HIRE_SEARCH:
        return <HireSearch initialCategory={postJobCategory?.subCategory ? postJobCategory.category : undefined} onPostJob={(c, s) => { setPostJobCategory({ category: c, subCategory: s }); handleNavigate(AppScreen.POST_JOB); }} onBack={handleBack} />;
      case AppScreen.TALENT_DETAILS:
        return selectedTalent ? (
          <TalentDetails talent={selectedTalent} onBack={handleBack} />
        ) : (
          <HireSearch initialCategory={postJobCategory?.subCategory ? postJobCategory.category : undefined} onPostJob={(c, s) => { setPostJobCategory({ category: c, subCategory: s }); handleNavigate(AppScreen.POST_JOB); }} onBack={handleBack} />
        );
      case AppScreen.FAVORITES:
        return <Favorites onSelectJob={(job) => { setSelectedJob(job); handleNavigate(AppScreen.DETAILS); }} onBack={handleBack} favorites={favorites} onToggleFavorite={toggleFavorite} jobs={allJobs} onShare={handleShare} />;
      case AppScreen.CHATS:
        return <Chats />;
      case AppScreen.MENU:
        return <Menu onBack={handleBack} onDownload={startDownload} onNavigate={(screen, type) => {
          if (type) setActiveService(type);
          handleNavigate(screen);
        }} hasApprovedJob={hasApprovedJob} hasPaidJob={hasPaidJob} />;
      case AppScreen.SERVICE_DETAILS:
        return <ServiceDetails type={activeService} onBack={handleBack} onProceed={() => {
          const prices = { 'GOLD': 999, 'BOOST': 1499, 'AD': 2999 };
          const names = { 'GOLD': 'Gold Verification', 'BOOST': 'Profile Visibility Boost', 'AD': 'Top-of-Search Ad' };
          setPaymentContext({
            planId: activeService,
            planName: names[activeService],
            amount: prices[activeService],
            isBoosted: false
          });
          setCurrentJobId('service_purchase'); // Provide a non-null dummy jobId to satisfy PaymentMethod
          handleNavigate(AppScreen.PAYMENT_METHOD);
        }} />;
      case AppScreen.ADMIN_LOGIN:
        return <AdminLogin onLoginSuccess={() => handleNavigate(AppScreen.ADMIN)} onBack={handleBack} />;
      case AppScreen.ADMIN:
        return <AdminDashboard onBack={handleBack} />;
      case AppScreen.AI_COACH:
        return <AICoach onBack={handleBack} />;
      case AppScreen.COMPANY_PROFILE:
        return <CompanyProfile onBack={handleBack} onNavigate={handleNavigate} />;
      case AppScreen.PRIVACY_POLICY:
        return <PolicyScreen type="privacy" onBack={handleBack} />;
      case AppScreen.TERMS_CONDITIONS:
        return <PolicyScreen type="terms" onBack={handleBack} />;
      case AppScreen.RETURN_POLICY:
        return <PolicyScreen type="return" onBack={handleBack} />;
      case AppScreen.REFUND_POLICY:
        return <PolicyScreen type="refund" onBack={handleBack} />;
      case AppScreen.ALL_CATEGORIES:
        return (
          <AllCategories
            onBack={handleBack}
            onSelectCategory={(cat) => {
              setSelectedCategory(cat);
              setSelectedJobType(undefined);
              setSelectedQualification(undefined);
              handleNavigate(AppScreen.SEARCH);
            }}
          />
        );
      default:
        console.warn('Unknown screen encountered:', currentScreen);
        return <Login onLogin={() => handleNavigate(AppScreen.ROLE_SELECTION)} />;
    }
  };

  const hideNav = [
    AppScreen.SPLASH, AppScreen.LOGIN, AppScreen.ROLE_SELECTION, 
    AppScreen.ADMIN, AppScreen.ADMIN_LOGIN, 
    AppScreen.DETAILS, AppScreen.TALENT_DETAILS, 
    AppScreen.POST_JOB, AppScreen.AI_COACH, 
    AppScreen.COMPANY_PROFILE, AppScreen.PACKAGE_SELECTION, AppScreen.PAYMENT_METHOD, 
    AppScreen.PRIVACY_POLICY, AppScreen.TERMS_CONDITIONS, AppScreen.RETURN_POLICY, AppScreen.REFUND_POLICY, 
    AppScreen.ALL_CATEGORIES,
    AppScreen.RECRUITER_DASHBOARD, AppScreen.RECRUITER_AUTH, AppScreen.HIRE_SEARCH
  ].includes(currentScreen);

  if (currentScreen === AppScreen.SPLASH) {
    return (
      <div className="mx-auto max-w-md bg-background h-screen relative flex flex-col overflow-hidden shadow-2xl">
        <SplashScreen />
      </div>
    );
  }

  return (
    <div className={`mx-auto bg-background h-screen relative flex flex-col overflow-hidden shadow-2xl transition-all duration-500 ${currentScreen === AppScreen.ADMIN ? 'w-full max-w-none' : 'max-w-md'}`}>
      <div className="flex-1 overflow-y-auto no-scrollbar">
        {renderScreen()}
      </div>

      {!hideNav && (
        <BottomNav
          currentScreen={currentScreen}
          onNavigate={handleNavigate}
          onPlaceAd={() => setShowIntentModal(true)}
        />
      )}

      {isDownloading && (
        <div className="fixed inset-0 z-[100] bg-accent/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 animate-fade-in text-white text-center">
          <div className="w-20 h-20 bg-primary rounded-3xl flex items-center justify-center mb-6 animate-bounce shadow-premium">
            <span className="material-icons-round text-4xl">downloading</span>
          </div>
          <h2 className="text-2xl font-display font-bold mb-4">Downloading Token...</h2>
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div className="h-full bg-primary" style={{ width: `${downloadProgress}%` }}></div>
          </div>
          <span className="mt-4 font-black text-3xl">{downloadProgress}%</span>
        </div>
      )}

      {showIntentModal && (
        <IntentModal
          onClose={() => setShowIntentModal(false)}
          onSelect={(intent) => {
            setShowIntentModal(false);
            if (intent === 'find') handleNavigate(AppScreen.SEARCH);
            else {
              setPostJobCategory(null);
              handleNavigate(AppScreen.HIRE_SEARCH);
            }
          }}
        />
      )}
    </div>
  );
};

export default App;


