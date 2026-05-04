import React, { useState } from 'react';

export const ApplyForm = ({ job, onClose, onSubmit }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = React.useRef(null);
  const [selectedFile, setSelectedFile] = useState(null);
  const [name, setName] = useState(localStorage.getItem('candidate_name') || '');
  const [email, setEmail] = useState(() => {
    const val = localStorage.getItem('candidate_mobile') || '';
    return val.includes('@') ? val : '';
  });
  const [phone, setPhone] = useState('');
  const [qualification, setQualification] = useState("Bachelor's Degree");
  const [expectedSalary, setExpectedSalary] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    let resumeUrl = '';
    
    try {
      if (selectedFile) {
        const formData = new FormData();
        formData.append('file', selectedFile);
        
        const uploadRes = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });
        
        if (uploadRes.ok) {
          const uploadData = await uploadRes.json();
          resumeUrl = uploadData.url;
        }
      }
      
      // Artificial delay for premium feel
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setIsSubmitting(false);
      onSubmit(resumeUrl, name, email, qualification, expectedSalary, phone);
    } catch (err) {
      console.error('Upload failed', err);
      setIsSubmitting(false);
      onSubmit('', name, email, qualification, expectedSalary, phone); // Fallback to submit without resume if upload fails
    }
  };

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  return (
    <div className="fixed inset-0 mx-auto w-full max-w-md z-[70] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>
      <div className="relative bg-white w-full rounded-t-3xl p-6 shadow-2xl animate-slide-up max-w-lg overflow-y-auto no-scrollbar max-h-[90vh]">
        <div className="w-12 h-1 bg-gray-300 rounded-full mx-auto mb-6"></div>
        <div className="flex justify-between items-start mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">Apply Now</h2>
            <p className="text-sm text-gray-500 mt-1">{job.title} • {job.company}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-100" type="button">
            <span className="material-icons-round text-gray-400">close</span>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Full Name</label>
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">person</span>
              <input
                required
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                placeholder="Enter your full name"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-gray-100 rounded-xl focus:ring-primary focus:border-primary text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Email Address</label>
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">email</span>
              <input
                required
                type="email"
                value={email}
                onChange={e => setEmail(e.target.value)}
                placeholder="email.com"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-gray-100 rounded-xl focus:ring-primary focus:border-primary text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Contact Number</label>
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">phone_iphone</span>
              <input
                required
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value)}
                placeholder="98765 43210"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-gray-100 rounded-xl focus:ring-primary focus:border-primary text-gray-900 font-bold"
              />
            </div>
            <p className="text-[10px] text-gray-400 mt-1.5 ml-1">Notifications will still go to your login account</p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Highest Qualification</label>
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">school</span>
              <select 
                value={qualification}
                onChange={e => setQualification(e.target.value)}
                className="w-full pl-12 pr-10 py-3.5 bg-gray-50 border-gray-100 rounded-xl focus:ring-primary focus:border-primary text-gray-900 cursor-pointer"
              >
                <option value="High School">High School</option>
                <option value="Bachelor's Degree">Bachelor's Degree</option>
                <option value="Master's Degree">Master's Degree</option>
                <option value="PhD">PhD</option>
                <option value="Diploma">Diploma</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Expected Salary (Per Month)</label>
            <div className="relative">
              <span className="material-icons-outlined absolute left-4 top-1/2 -translate-y-1/2 text-gray-400">payments</span>
              <input
                required
                type="text"
                value={expectedSalary}
                onChange={e => setExpectedSalary(e.target.value)}
                placeholder="e.g. 25,000"
                className="w-full pl-12 pr-4 py-3.5 bg-gray-50 border-gray-100 rounded-xl focus:ring-primary focus:border-primary text-gray-900"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Upload CV</label>
            <div 
              onClick={handleUploadClick}
              className="border-2 border-dashed border-gray-200 rounded-2xl p-8 flex flex-col items-center justify-center bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group"
            >
              <div className={`w-14 h-14 rounded-full flex items-center justify-center mb-4 group-hover:scale-110 transition-transform ${selectedFile ? 'bg-emerald-50' : 'bg-red-50'}`}>
                <span className={`material-icons-outlined text-2xl ${selectedFile ? 'text-emerald-500' : 'text-primary'}`}>
                  {selectedFile ? 'check_circle' : 'cloud_upload'}
                </span>
              </div>
              <p className="text-sm font-semibold text-gray-900">
                {selectedFile ? <span className="text-emerald-500">{selectedFile.name}</span> : <><span className="text-primary">Upload a file</span> or drag and drop</>}
              </p>
              <p className="text-xs text-gray-500 mt-2">PDF, DOC, DOCX up to 5MB</p>
              <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
              />
            </div>
          </div>

          <button
            disabled={isSubmitting}
            type="submit"
            className="w-full py-4 bg-primary text-white font-bold rounded-2xl shadow-lg shadow-red-200 active:scale-95 transition-all flex items-center justify-center gap-3 disabled:opacity-70"
          >
            {isSubmitting ? (
              <span className="material-icons-round animate-spin">refresh</span>
            ) : 'Submit Application'}
          </button>
        </form>

        <div className="h-6"></div>
      </div>
    </div>
  );
};
