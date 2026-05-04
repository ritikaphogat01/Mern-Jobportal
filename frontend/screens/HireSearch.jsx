
import React, { useState } from 'react';

export const HireSearch = ({ initialCategory, onPostJob, onBack }) => {
  const [selectedCategory, setSelectedCategory] = useState(initialCategory || null);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);

  React.useEffect(() => {
    fetch('/api/categories')
      .then(res => res.json())
      .then(data => {
        setCategories(data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Failed to fetch categories', err);
        setLoading(false);
      });
  }, []);

  const activeCat = categories.find(c => c.name === selectedCategory);

  return (
    <div className="animate-fade-in bg-white min-h-screen pb-32">
      <header className="px-6 py-6 border-b border-gray-100 flex items-center gap-4 bg-white sticky top-0 z-10 shadow-sm">
        <button onClick={selectedCategory ? () => setSelectedCategory(null) : onBack} className="w-10 h-10 rounded-full flex items-center justify-center text-accent active:scale-95 transition-all border border-gray-100 bg-gray-50 shadow-sm">
          <span className="material-icons-round">arrow_back</span>
        </button>
        <div>
          <h2 className="text-xl font-display font-black text-accent flex-1 leading-tight">
            {selectedCategory ? `Select Sub-Category` : 'Select Category'}
          </h2>
          <p className="text-[9px] font-black text-primary uppercase tracking-[0.2em]">Step {selectedCategory ? '2' : '1'} of job posting</p>
        </div>
      </header>

      <div className="divide-y divide-gray-50">
        {loading ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
            <span className="material-icons-round animate-spin text-4xl mb-2 text-primary">autorenew</span>
            <p className="font-bold text-sm">Loading categories...</p>
          </div>
        ) : (
          (selectedCategory ? (activeCat?.subCategories || []) : categories).map((item) => (
            <button
              key={item._id || item.id || item.name}
              onClick={() => {
                if (selectedCategory) {
                  onPostJob(selectedCategory, item.name);
                } else {
                  if (!item.subCategories || item.subCategories.length === 0) {
                    onPostJob(item.name, '');
                  } else {
                    setSelectedCategory(item.name);
                  }
                }
              }}
              className="w-full flex items-center justify-between p-6 hover:bg-primary/5 transition-colors text-left group"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-2xl bg-gray-50 flex items-center justify-center border border-gray-100 group-hover:bg-white group-hover:border-primary/20 transition-all shadow-sm overflow-hidden p-0">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
                  ) : (
                    <span className="material-icons-round text-primary text-xl">{item.icon || (selectedCategory ? 'circle' : 'category')}</span>
                  )}
                </div>
                <span className="text-[15px] font-bold text-gray-800 group-hover:text-primary transition-colors">{item.name}</span>
              </div>
              <span className="material-icons-round text-gray-300 text-lg group-hover:text-primary group-hover:translate-x-1 transition-all">chevron_right</span>
            </button>
          ))
        )}
      </div>
    </div>
  );
};
