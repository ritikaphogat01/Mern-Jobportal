import React, { useState, useMemo } from 'react';

export const Search = ({ 
  initialCategory, 
  initialJobType,
  initialExperience,
  initialQualification,
  onSelectJob, 
  onBack, 
  favorites, 
  onToggleFavorite,
  jobs = []
}) => {
  const jobsData = jobs;
  const filterScrollRef = React.useRef(null);
  const isAutoScrolling = React.useRef(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedJobType, setSelectedJobType] = useState(initialJobType || 'Job Type');
  const [selectedExperience, setSelectedExperience] = useState(initialExperience || 'Experience');
  const [selectedSalary, setSelectedSalary] = useState('Salary Range');
  const [selectedLocation, setSelectedLocation] = useState('Location');
  const [selectedQualification, setSelectedQualification] = useState(initialQualification || 'Qualification');
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [sortBy, setSortBy] = useState('relevance');
  const [categoriesData, setCategoriesData] = useState([]);
  const [viewAllPopular, setViewAllPopular] = useState(false);

  React.useEffect(() => {
    let interval;
    const scrollContainer = filterScrollRef.current;
    
    if (scrollContainer) {
      interval = setInterval(() => {
        if (!isAutoScrolling.current) return;
        
        const currentScroll = scrollContainer.scrollLeft;
        const maxScroll = scrollContainer.scrollWidth - scrollContainer.clientWidth;
        
        // Scroll by a chunk (e.g., 140px which is roughly one chip width)
        let nextScroll = currentScroll + 140;
        
        // If we reach the end, reset to the beginning smoothly
        if (currentScroll >= maxScroll - 5) {
          nextScroll = 0;
        }

        scrollContainer.scrollTo({
          left: nextScroll,
          behavior: 'smooth'
        });
      }, 4000); // Trigger every 4 seconds
    }
    return () => clearInterval(interval);
  }, []);

  React.useEffect(() => {
    // Fetch categories to understand parent/subcategory hierarchy
    fetch(API_URL + '/api/categories')
      .then(res => res.json())
      .then(data => setCategoriesData(data))
      .catch(console.error);
  }, []);

  // Auto-suggest logic matching categories and roles
  const suggestions = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return [];

    const matches = [];
    
    // Match based on category hierarchy
    categoriesData.forEach(cat => {
      // 1. Parent Category match
      if (cat.name.toLowerCase().includes(q)) {
        const subCatNames = cat.subCategories?.map((s) => s.name.toLowerCase()) || [];
        const hasJob = jobsData.some(j => 
           j.category.toLowerCase() === cat.name.toLowerCase() || 
           subCatNames.includes(j.category.toLowerCase())
        );
        if (hasJob && !matches.find(m => m.label.toLowerCase() === cat.name.toLowerCase())) {
           matches.push({ label: cat.name, subLabel: 'Jobs', type: 'category' });
        }
      }
      // 2. Subcategory match
      cat.subCategories?.forEach((sub) => {
         if (sub.name.toLowerCase().includes(q)) {
            const hasJob = jobsData.some(j => j.category.toLowerCase() === sub.name.toLowerCase());
            if (hasJob && !matches.find(m => m.label.toLowerCase() === sub.name.toLowerCase())) {
               matches.push({ label: sub.name, subLabel: cat.name, type: 'category' });
            }
         }
      });
    });

    jobsData.forEach(job => {
      if (job.category.toLowerCase().includes(q) && !matches.find(m => m.label.toLowerCase() === job.category.toLowerCase())) {
        matches.push({ label: job.category, subLabel: 'Jobs', type: 'category' });
      }
      if (job.title.toLowerCase().includes(q) && !matches.find(m => m.label.toLowerCase() === job.title.toLowerCase())) {
        matches.push({ label: job.title, subLabel: job.category, type: 'role' });
      }
    });

    return matches.slice(0, 6);
  }, [searchQuery, jobsData, categoriesData]);

  const clearAllFilters = () => {
    setSearchQuery('');
    setSelectedJobType('Job Type');
    setSelectedExperience('Experience');
    setSelectedSalary('Salary Range');
    setSelectedLocation('Location');
    setSelectedQualification('Qualification');
    setShowSuggestions(false);
  };

  const filteredJobs = React.useMemo(() => {
    const filtered = jobsData.filter(job => {
      const queryWords = searchQuery.toLowerCase().trim().split(/\s+/).filter(Boolean);
      
      const parentCat = categoriesData.find(c => 
         c.name.toLowerCase() === (job.category || '').toLowerCase() || 
         c.subCategories?.some((s) => s.name.toLowerCase() === (job.category || '').toLowerCase())
      );
      const parentCatName = parentCat ? parentCat.name.toLowerCase() : '';

      const matchesSearch = queryWords.length === 0 || queryWords.every(word => 
        job.title.toLowerCase().includes(word) ||
        job.company.toLowerCase().includes(word) ||
        job.location.toLowerCase().includes(word) ||
        job.description.toLowerCase().includes(word) ||
        (job.category || '').toLowerCase().includes(word) ||
        parentCatName.includes(word)
      );

      // Find the full category object from the fetched categories to get its subcategories
      const fullCategory = initialCategory 
        ? categoriesData.find(c => c.name.toLowerCase() === initialCategory.name.toLowerCase() || c.id === initialCategory.id) || initialCategory
        : null;
      
      const validCategoryNames = initialCategory 
        ? [(initialCategory.name || '').toLowerCase(), (initialCategory.id || '').toLowerCase()] 
        : [];
      
      if (fullCategory && fullCategory.subCategories) {
        fullCategory.subCategories.forEach((sub) => {
          if (sub.name) validCategoryNames.push(sub.name.toLowerCase());
        });
      }

      const matchesCategory = initialCategory 
        ? validCategoryNames.includes((job.category || '').toLowerCase()) 
        : true;

      const normalize = (s) => s.toLowerCase().replace(/[^a-z0-9]/g, '');
      
      const QUAL_KEYWORDS = {
        'High School': ['high school', '10th', '12th'],
        'Bachelors Degree': ['bachelor', 'graduate', 'degree', 'b.tech', 'bca', 'bsc'],
        'Masters Degree': ['master', 'post graduate', 'm.tech', 'mca', 'msc', 'mba'],
        'PhD': ['phd', 'doctorate']
      };

      const isMatch = (val, target) => normalize(val).includes(normalize(target));

      const matchesJobType = selectedJobType === 'Job Type' || 
        (normalize(selectedJobType) === 'remote' 
          ? (isMatch(job.type, 'remote') || isMatch(job.workMode || '', 'remote') || isMatch(job.location, 'remote'))
          : isMatch(job.type, selectedJobType)
        );
      
      // Better Experience Filtering
      let matchesExperience = true;
      if (selectedExperience !== 'Experience') {
        const jobExp = job.experience.toLowerCase();
        if (selectedExperience === 'Freshers') {
          matchesExperience = jobExp.includes('fresher') || jobExp.includes('0') || jobExp.includes('fresh');
        } else {
          const filterMin = parseInt(selectedExperience);
          const jobNums = jobExp.match(/\d+/g)?.map(Number) || [0];
          // If no numbers found (like "Senior"), treat it as high experience or check if filter matches
          const jobMin = jobNums.length > 0 ? Math.min(...jobNums) : 5; 
          matchesExperience = jobMin >= filterMin;
        }
      }
      
      // Improved Salary Filtering
      let matchesSalary = true;
      if (selectedSalary !== 'Salary Range') {
        const salaryStr = (job.salary || '').toLowerCase().replace(/,/g, '');
        // Extract all numbers from salary string and multiply by L/K if needed
        const nums = salaryStr.match(/\d+(\.\d+)?/g)?.map(n => {
          let val = parseFloat(n);
          if (salaryStr.includes('l')) val *= 100000;
          else if (salaryStr.includes('k')) val *= 1000;
          else if (val < 1000) val *= 1000; // Assume k if < 1000
          return val;
        }) || [0];
        
        const jobMaxSalary = Math.max(...nums);
        
        if (selectedSalary === '0-20k') matchesSalary = jobMaxSalary <= 20000;
        else if (selectedSalary === '20k-50k') matchesSalary = jobMaxSalary > 20000 && jobMaxSalary <= 50000;
        else if (selectedSalary === '50k-1L') matchesSalary = jobMaxSalary > 50000 && jobMaxSalary <= 100000;
        else if (selectedSalary === '1L+') matchesSalary = jobMaxSalary > 100000;
      }

      const matchesLocation = selectedLocation === 'Location' || job.location.toLowerCase().includes(selectedLocation.toLowerCase());
      const matchesQual = selectedQualification === 'Qualification' || 
        (job.education && normalize(job.education).includes(normalize(selectedQualification))) ||
        (!job.education && QUAL_KEYWORDS[selectedQualification]?.some(k => 
          normalize(job.title).includes(normalize(k)) || 
          normalize(job.description).includes(normalize(k))
        ));

      return matchesSearch && matchesCategory && matchesJobType && matchesExperience && matchesSalary && matchesLocation && matchesQual;
    });

    let sorted = [...filtered].sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return 0;
    });

    if (sortBy === 'date') return sorted.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      return (b.postedAt || "").localeCompare(a.postedAt || "");
    });
    
    if (sortBy === 'salary') return sorted.sort((a, b) => {
      if (a.isFeatured && !b.isFeatured) return -1;
      if (!a.isFeatured && b.isFeatured) return 1;
      const getVal = (s) => {
        const match = s.match(/(\d+)/);
        return match ? parseInt(match[0]) * (s.toLowerCase().includes('l') ? 100000 : 1000) : 0;
      };
      return getVal(b.salary) - getVal(a.salary);
    });

    return sorted;
  }, [searchQuery, initialCategory, selectedJobType, selectedExperience, selectedSalary, selectedLocation, selectedQualification, sortBy, jobsData, categoriesData]);

  const hasActiveFilters = searchQuery !== '' ||
    selectedJobType !== 'Job Type' ||
    selectedExperience !== 'Experience' ||
    selectedSalary !== 'Salary Range' ||
    selectedLocation !== 'Location';

  return (
    <div className="animate-fade-in pb-32">
      <header className="glass p-4 sticky top-0 z-50 border-b border-gray-100/50 space-y-4">
        <div className="flex items-center gap-3">
          <button onClick={onBack} className="w-10 h-10 rounded-full border border-gray-100 flex items-center justify-center active:scale-90 transition-all bg-white shadow-sm">
            <span className="material-icons-round text-accent">arrow_back</span>
          </button>
          <div className="flex-1 relative">
            <span className="material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-primary text-xl">search</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setShowSuggestions(true);
              }}
              onFocus={() => {
                if (searchQuery) setShowSuggestions(true);
              }}
              placeholder="Search careers, companies..."
              className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-transparent focus:border-primary focus:ring-4 focus:ring-primary/5 rounded-[1.5rem] text-[15px] font-medium transition-all shadow-inner-soft"
            />
          </div>
        </div>

        {/* Expanded Horizontal Filter Modules */}
        {!showSuggestions && (
        <div 
          ref={filterScrollRef}
          onMouseEnter={() => { isAutoScrolling.current = false; }}
          onMouseLeave={() => { isAutoScrolling.current = true; }}
          className="flex gap-3 overflow-x-auto no-scrollbar pb-2 px-1 scroll-smooth"
        >
          {/* Job Type Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedJobType}
              onChange={(e) => setSelectedJobType(e.target.value)}
              className={`appearance-none bg-none pl-11 pr-11 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all ${selectedJobType !== 'Job Type' ? 'bg-primary text-white border-primary' : 'bg-white text-accent border-gray-100'}`}
            >
              <option>Job Type</option>
              <option value="Full-Time">Full Time</option>
              <option value="Part-Time">Part Time</option>
              <option value="Internship">Internship</option>
              <option value="Contract">Contract</option>
              <option value="Freelance">Freelance</option>
              <option value="Remote">Remote</option>
            </select>
            <span className={`material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedJobType !== 'Job Type' ? 'text-white' : 'text-primary'}`}>work_outline</span>
            <span className={`material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedJobType !== 'Job Type' ? 'text-white/90' : 'text-gray-700'}`}>expand_more</span>
          </div>

          {/* Salary Range Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedSalary}
              onChange={(e) => setSelectedSalary(e.target.value)}
              className={`appearance-none bg-none pl-11 pr-11 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all ${selectedSalary !== 'Salary Range' ? 'bg-primary text-white border-primary' : 'bg-white text-accent border-gray-100'}`}
            >
              <option>Salary Range</option>
              <option value="0-20k">₹0 - ₹20k</option>
              <option value="20k-50k">₹20k - ₹50k</option>
              <option value="50k-1L">₹50k - ₹1L</option>
              <option value="1L+">₹1L+</option>
            </select>
            <span className={`material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedSalary !== 'Salary Range' ? 'text-white' : 'text-primary'}`}>payments</span>
            <span className={`material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedSalary !== 'Salary Range' ? 'text-white/90' : 'text-gray-700'}`}>expand_more</span>
          </div>

          {/* Experience Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedExperience}
              onChange={(e) => setSelectedExperience(e.target.value)}
              className={`appearance-none bg-none pl-11 pr-11 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all ${selectedExperience !== 'Experience' ? 'bg-primary text-white border-primary' : 'bg-white text-accent border-gray-100'}`}
            >
              <option>Experience</option>
              <option value="Freshers">Freshers</option>
              <option value="1-3 Years">1-3 Years</option>
              <option value="3-5 Years">3-5 Years</option>
              <option value="5+ Years">5+ Years</option>
            </select>
            <span className={`material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedExperience !== 'Experience' ? 'text-white' : 'text-primary'}`}>history_edu</span>
            <span className={`material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedExperience !== 'Experience' ? 'text-white/90' : 'text-gray-700'}`}>expand_more</span>
          </div>

          {/* Location Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedLocation}
              onChange={(e) => setSelectedLocation(e.target.value)}
              className={`appearance-none bg-none pl-11 pr-11 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all ${selectedLocation !== 'Location' ? 'bg-primary text-white border-primary' : 'bg-white text-accent border-gray-100'}`}
            >
              <option>Location</option>
              <option value="Mumbai">Mumbai</option>
              <option value="Bangalore">Bangalore</option>
              <option value="Delhi NCR">Delhi NCR</option>
              <option value="Remote">Remote</option>
            </select>
            <span className={`material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedLocation !== 'Location' ? 'text-white' : 'text-primary'}`}>location_on</span>
            <span className={`material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedLocation !== 'Location' ? 'text-white/90' : 'text-gray-700'}`}>expand_more</span>
          </div>

          {/* Qualification Filter */}
          <div className="relative shrink-0">
            <select
              value={selectedQualification}
              onChange={(e) => setSelectedQualification(e.target.value)}
              className={`appearance-none bg-none pl-11 pr-11 py-3.5 rounded-2xl border text-[11px] font-black uppercase tracking-wider focus:ring-4 focus:ring-primary/10 cursor-pointer shadow-sm transition-all ${selectedQualification !== 'Qualification' ? 'bg-primary text-white border-primary' : 'bg-white text-accent border-gray-100'}`}
            >
              <option>Qualification</option>
              <option value="High School">High School</option>
              <option value="Bachelors Degree">Bachelors Degree</option>
              <option value="Masters Degree">Masters Degree</option>
              <option value="PhD">PhD</option>
              <option value="Diploma">Diploma</option>
            </select>
            <span className={`material-icons-round absolute left-4 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedQualification !== 'Qualification' ? 'text-white' : 'text-primary'}`}>school</span>
            <span className={`material-icons-round absolute right-3 top-1/2 -translate-y-1/2 text-xl pointer-events-none ${selectedQualification !== 'Qualification' ? 'text-white/90' : 'text-gray-700'}`}>expand_more</span>
          </div>
        </div>
        )}
      </header>

      {/* Auto-suggest overlay */}
      {showSuggestions && searchQuery && (
        <div className="absolute top-[88px] left-0 right-0 bg-white z-40 h-[calc(100vh-88px)] p-5 animate-fade-in shadow-xl">
          <div className="space-y-4">
            {suggestions.map((s, idx) => (
              <button 
                key={idx}
                className="w-full text-left p-4 bg-gray-50 hover:bg-primary/5 active:bg-primary/10 rounded-2xl transition-all border border-gray-100 flex flex-col gap-1"
                onClick={() => {
                   setSearchQuery(s.label);
                   setShowSuggestions(false);
                }}
              >
                <span className="text-sm font-bold text-accent">{s.label}</span>
                <span className="text-[10px] uppercase font-black tracking-widest text-gray-400">{s.subLabel}</span>
              </button>
            ))}
            {suggestions.length === 0 && (
              <p className="text-center text-gray-500 py-10 text-sm font-medium">No categories found matching "{searchQuery}"</p>
            )}
          </div>
        </div>
      )}

      {!showSuggestions && (
      <div className="px-5 py-6 space-y-6">
        {/* Popular Jobs Section */}
        {jobsData.some(j => j.isFeatured) && !searchQuery && selectedJobType === 'Job Type' && selectedExperience === 'Experience' && selectedSalary === 'Salary Range' && selectedLocation === 'Location' && selectedQualification === 'Qualification' && (
          <div className="mb-8">
            <div className="flex justify-between items-end mb-4 pr-1">
              <h2 className="text-lg font-display font-black text-accent tracking-tight">Popular Jobs</h2>
              <button onClick={() => setViewAllPopular(!viewAllPopular)} className="text-[10px] font-black text-primary uppercase tracking-widest active:scale-95 transition-all">
                {viewAllPopular ? 'View Less' : 'View All'}
              </button>
            </div>
            <div className={viewAllPopular ? "flex flex-col gap-4 pb-4" : "flex gap-4 overflow-x-auto no-scrollbar pb-4 -mx-5 px-5"}>
              {jobsData.filter(j => j.isFeatured).map(job => (
                <div key={`featured-${job.id}`} onClick={() => onSelectJob(job)} className={`${viewAllPopular ? 'w-full' : 'min-w-[280px] w-[280px]'} ${job.imageUrl ? 'bg-white' : 'bg-gradient-to-br from-primary to-accent'} rounded-[2rem] shadow-premium shadow-primary/20 shrink-0 relative overflow-hidden active:scale-95 transition-all`}>
                  {/* Image Background */}
                  {job.imageUrl ? (
                    <div className="absolute inset-0 z-0">
                      <img src={job.imageUrl} alt="" className="w-full h-full object-cover blur-[2px] opacity-70" />
                      <div className="absolute inset-0 bg-gradient-to-b from-black/30 via-black/40 to-black/70" />
                    </div>
                  ) : (
                    <div className="absolute top-0 right-0 p-4 opacity-10">
                      <span className="material-icons-round text-6xl">local_fire_department</span>
                    </div>
                  )}
                  <div className="relative z-10 p-5">
                    <div className={`w-12 h-12 ${job.imageUrl ? 'bg-white/20 backdrop-blur-sm border border-white/30' : 'bg-white/20 backdrop-blur-md'} rounded-2xl flex items-center justify-center mb-4 overflow-hidden`}>
                      {job.companyLogo ? (
                        <img src={job.companyLogo} className="w-full h-full object-cover" />
                      ) : (
                        <span className="material-icons-round text-white text-2xl">apartment</span>
                      )}
                    </div>
                    <h3 className="text-white font-bold text-lg leading-tight w-4/5 truncate mb-1">{job.title}</h3>
                    <p className="text-white/80 text-xs font-medium truncate mb-4">{job.company}</p>
                    
                    <div className="flex items-center gap-3">
                      <span className="px-2.5 py-1 bg-white/20 rounded-lg text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm">{job.salary}</span>
                      <span className="px-2.5 py-1 bg-white/20 rounded-lg text-white text-[10px] font-black uppercase tracking-widest backdrop-blur-sm truncate max-w-[100px]">{job.location}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="flex justify-between items-center mb-4 mt-2">
          <div>
            <h2 className="text-xl font-bold text-gray-900 tracking-tight">Career Openings</h2>
          </div>
        </div>
        
        <div className="flex gap-6 border-b border-gray-100 mb-5">
           <button className="pb-3 text-[13px] font-bold text-gray-900 border-b-2 border-gray-900">Search Results ({filteredJobs.length})</button>
        </div>

        <div className="flex flex-col gap-4 pb-4">
          {filteredJobs.length > 0 ? (
            filteredJobs.map(job => (
              <div 
                key={job.id}
                onClick={() => onSelectJob(job)}
                className="w-full bg-white p-4 rounded-2xl border border-gray-200 shadow-sm active:scale-[0.98] transition-all relative flex flex-col gap-3 shrink-0 cursor-pointer hover:shadow-md group"
              >
                <div className="flex justify-between items-start mb-1">
                  <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center border border-gray-100 overflow-hidden shrink-0">
                    {job.companyLogo ? (
                      <img src={job.companyLogo} alt={job.company} className="w-full h-full object-cover" />
                    ) : (
                      <span className="material-icons-round text-primary/40 text-xl">apartment</span>
                    )}
                  </div>
                  <span className="text-[11px] font-medium text-gray-500 bg-gray-50 px-2 py-0.5 rounded-md">
                    {job.postedAt && job.postedAt.includes('hours') ? 'Today' : (job.postedAt || '3d ago').replace('Posted', '').trim()}
                  </span>
                </div>
                
                <div className="flex flex-col gap-0.5">
                  <h3 className="font-bold text-gray-900 text-[15px] leading-tight line-clamp-1">{job.title}</h3>
                  <div className="flex items-center gap-1 text-gray-600 mt-1">
                    <p className="text-[12px] font-medium line-clamp-1">{job.company}</p>
                    <div className="flex items-center gap-0.5 ml-1 bg-yellow-50 px-1 rounded text-yellow-600">
                      <span className="material-icons-round text-[10px]">star</span>
                      <span className="text-[10px] font-bold">{(Math.random() * (4.9 - 3.5) + 3.5).toFixed(1)}</span>
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1.5 text-gray-500 mt-1 pt-3 border-t border-gray-50">
                  <span className="material-icons-round text-[14px]">location_on</span>
                  <span className="text-[12px] font-medium line-clamp-1">{job.location}</span>
                </div>
                
                <button 
                  onClick={(e) => { e.stopPropagation(); onToggleFavorite(job.id); }}
                  className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-gray-50 flex items-center justify-center text-gray-400 hover:text-primary transition-colors border border-gray-100 z-10"
                >
                   <span className={`material-icons-round text-[15px] ${favorites.includes(job.id) ? 'text-primary' : ''}`}>
                     {favorites.includes(job.id) ? 'favorite' : 'favorite_border'}
                   </span>
                </button>
              </div>
            ))
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-20 text-center bg-white rounded-2xl border border-dashed border-gray-200">
              <span className="material-icons-round text-gray-200 text-5xl mb-4">search_off</span>
              <h3 className="text-lg font-bold text-gray-900">No Matching Vacancies</h3>
              <p className="text-[12px] text-gray-500 mt-2">Try adjusting your filters or search terms.</p>
              <button
                onClick={clearAllFilters}
                className="mt-6 px-6 py-2.5 bg-gray-100 text-gray-700 rounded-lg text-[13px] font-bold hover:bg-gray-200 transition-colors"
              >
                Clear all filters
              </button>
            </div>
          )}
        </div>
      </div>
      )}
    </div>
  );
};


