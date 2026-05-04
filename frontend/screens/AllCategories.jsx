
import React, { useState, useEffect } from 'react';

export const AllCategories = ({ onBack, onSelectCategory }) => {
  const [categories, setCategories] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearch, setShowSearch] = useState(false);

  useEffect(() => {
    fetch(API_URL + '/api/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          const mapped = data.map((c) => ({
            id: c._id || c.id,
            name: c.name || 'Category',
            icon: c.icon || 'work',
            jobsCount: c.jobsCount ? String(c.jobsCount) : '0+',
            imageUrl: c.imageUrl || ''
          }));
          // Filter out empty names and sort alphabetically
          const sorted = mapped.filter(c => c.name).sort((a,b) => a.name.localeCompare(b.name));
          setCategories(sorted);
        }
      })
      .catch(console.error);
  }, []);

  const filteredCategories = categories.filter(c => c.name.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="bg-white min-h-screen flex flex-col pb-10">
      {/* Header */}
      <header className="flex items-center justify-between p-4 sticky top-0 bg-white z-10 border-b border-gray-100">
        <div className="flex items-center gap-4">
          <button onClick={onBack} className="p-1 active:scale-90 transition-all">
            <span className="material-icons-round text-gray-800">arrow_back</span>
          </button>
          {!showSearch ? (
            <h1 className="text-[17px] font-bold text-gray-900">Jobs</h1>
          ) : (
            <input 
              autoFocus
              type="text" 
              placeholder="Search categories..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="outline-none text-[15px] bg-transparent w-full font-medium"
            />
          )}
        </div>
        <button onClick={() => setShowSearch(!showSearch)} className="p-1 active:scale-90 transition-all">
          <span className="material-icons-round text-gray-600">{showSearch ? 'close' : 'search'}</span>
        </button>
      </header>

      {/* List */}
      <div className="flex flex-col">
        {!searchQuery && (
          <button 
            onClick={() => onSelectCategory(undefined)}
            className="flex items-center justify-between p-5 border-b border-gray-100/70 active:bg-gray-50 transition-colors"
          >
            <span className="text-[15px] font-bold text-gray-900">All in Jobs</span>
            <span className="material-icons-round text-red-600 text-xl font-bold">check</span>
          </button>
        )}
        
        {filteredCategories.map(cat => (
          <button 
            key={cat.id}
            onClick={() => onSelectCategory(cat)}
            className="flex items-center justify-between p-5 border-b border-gray-100/70 active:bg-gray-50 transition-colors text-left"
          >
            <span className="text-[15px] font-medium text-gray-700">{cat.name}</span>
          </button>
        ))}
      </div>
    </div>
  );
};


