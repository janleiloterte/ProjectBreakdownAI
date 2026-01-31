
import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { generateBreakdown } from './services/geminiService';
import { ProjectBreakdown, AssignmentInput } from './types';
import MilestoneCard from './components/MilestoneCard';
import CountdownTimer from './components/CountdownTimer';
import confetti from 'canvas-confetti';

const STORAGE_KEY = 'taskmaster_ai_projects';

const App: React.FC = () => {
  const [projects, setProjects] = useState<ProjectBreakdown[]>([]);
  const [activeProjectId, setActiveProjectId] = useState<string | null>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [isCreating, setIsCreating] = useState(false);

  // Form states
  const [assignmentText, setAssignmentText] = useState('');
  const [deadline, setDeadline] = useState('');
  const [file, setFile] = useState<{ data: string; mimeType: string; name: string } | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompletionOverlay, setShowCompletionOverlay] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setProjects(parsed);
        if (parsed.length > 0) setActiveProjectId(parsed[0].id);
      } catch (e) {
        console.error("Failed to load projects", e);
      }
    }
  }, []);

  // Save to LocalStorage
  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(projects));
  }, [projects]);

  // Set default deadline
  useEffect(() => {
    const nextWeek = new Date();
    nextWeek.setDate(nextWeek.getDate() + 7);
    nextWeek.setHours(17, 0, 0, 0);
    const tzOffset = nextWeek.getTimezoneOffset() * 60000;
    const localISOTime = new Date(nextWeek.getTime() - tzOffset).toISOString().slice(0, 16);
    setDeadline(localISOTime);
  }, []);

  const activeProject = useMemo(() => 
    projects.find(p => p.id === activeProjectId) || null
  , [projects, activeProjectId]);

  // Completion Logic
  useEffect(() => {
    if (activeProject && 
        activeProject.completedMilestoneIds.length === activeProject.milestones.length && 
        activeProject.milestones.length > 0) {
      if (!showCompletionOverlay) {
        setShowCompletionOverlay(true);
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
          colors: ['#4f46e5', '#818cf8', '#f43f5e', '#fbbf24']
        });
      }
    } else {
      setShowCompletionOverlay(false);
    }
  }, [activeProject, showCompletionOverlay]);

  const toggleMilestone = useCallback((milestoneId: string) => {
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      const ids = [...p.completedMilestoneIds];
      const index = ids.indexOf(milestoneId);
      if (index > -1) ids.splice(index, 1);
      else ids.push(milestoneId);
      return { ...p, completedMilestoneIds: ids };
    }));
  }, [activeProjectId]);

  const handleContinueWorking = () => {
    if (!activeProject) return;
    const lastId = activeProject.milestones[activeProject.milestones.length - 1].id;
    setProjects(prev => prev.map(p => {
      if (p.id !== activeProjectId) return p;
      return { ...p, completedMilestoneIds: p.completedMilestoneIds.filter(id => id !== lastId) };
    }));
    setShowCompletionOverlay(false);
  };

  const handleFinish = () => {
    const nextProjects = projects.filter(p => p.id !== activeProjectId);
    setProjects(nextProjects);
    setActiveProjectId(nextProjects.length > 0 ? nextProjects[0].id : null);
    setShowCompletionOverlay(false);
    setIsCreating(nextProjects.length === 0);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      const reader = new FileReader();
      reader.onload = (event) => {
        const base64Data = (event.target?.result as string).split(',')[1];
        setFile({ data: base64Data, mimeType: selectedFile.type, name: selectedFile.name });
      };
      reader.readAsDataURL(selectedFile);
    }
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!assignmentText && !file) {
      setError("Please provide assignment details or upload a file.");
      return;
    }
    if (!deadline) {
      setError("Please select a final deadline.");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const input: AssignmentInput = { text: assignmentText, deadline, file: file || undefined };
      const result = await generateBreakdown(input);
      const newProject: ProjectBreakdown = {
        ...result,
        id: crypto.randomUUID(),
        deadline,
        completedMilestoneIds: [],
        createdAt: Date.now()
      };
      setProjects(prev => [newProject, ...prev]);
      setActiveProjectId(newProject.id);
      setIsCreating(false);
      setAssignmentText('');
      setFile(null);
    } catch (err: any) {
      setError("Failed to generate. Check your instructions and try again.");
    } finally {
      setLoading(false);
    }
  };

  const deleteProject = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const next = projects.filter(p => p.id !== id);
    setProjects(next);
    if (activeProjectId === id) {
      setActiveProjectId(next.length > 0 ? next[0].id : null);
    }
  };

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* SIDEBAR */}
      <aside className={`fixed inset-y-0 left-0 z-40 w-72 bg-white border-r border-slate-200 transform transition-transform duration-300 ease-in-out lg:relative lg:translate-x-0 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-slate-100">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 bg-indigo-600 rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h1 className="text-xl font-black text-slate-900 tracking-tight">TaskMaster AI</h1>
            </div>
            
            <button 
              onClick={() => { setIsCreating(true); setActiveProjectId(null); }}
              className="w-full py-3 px-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-xl transition-all flex items-center justify-center gap-2 border border-indigo-100"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
              </svg>
              New Project
            </button>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-2">
            <h2 className="px-4 text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">My Roadmaps</h2>
            {projects.length === 0 ? (
              <div className="px-4 py-8 text-center">
                <p className="text-sm text-slate-400 italic">No projects yet</p>
              </div>
            ) : (
              projects.map(p => (
                <div 
                  key={p.id}
                  onClick={() => { setActiveProjectId(p.id); setIsCreating(false); }}
                  className={`group relative flex items-center justify-between p-3 rounded-xl cursor-pointer transition-all border ${activeProjectId === p.id ? 'bg-indigo-600 border-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-transparent border-transparent hover:bg-slate-50 text-slate-600'}`}
                >
                  <div className="flex flex-col min-w-0 pr-6">
                    <span className="text-sm font-bold truncate">{p.projectName}</span>
                    <span className={`text-[10px] font-medium opacity-60`}>
                      {p.completedMilestoneIds.length}/{p.milestones.length} Tasks
                    </span>
                  </div>
                  <button 
                    onClick={(e) => deleteProject(p.id, e)}
                    className={`absolute right-2 opacity-0 group-hover:opacity-100 p-1 rounded-lg hover:bg-white/20 transition-all ${activeProjectId === p.id ? 'text-white' : 'text-slate-400 hover:text-rose-500'}`}
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className="flex-1 relative overflow-y-auto">
        {/* Mobile Toggle */}
        <button 
          onClick={() => setIsSidebarOpen(!isSidebarOpen)}
          className="lg:hidden fixed bottom-6 left-6 z-50 p-4 bg-indigo-600 text-white rounded-full shadow-xl"
        >
          <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>

        {showCompletionOverlay && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300">
            <div className="bg-white rounded-3xl p-10 max-w-lg w-full text-center shadow-2xl scale-in-center animate-in zoom-in duration-300">
              <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <svg className="w-10 h-10 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h2 className="text-4xl font-black text-slate-900 mb-2">Congratulations!</h2>
              <p className="text-slate-600 mb-8 font-medium italic">"Every great journey is just a series of small steps completed."</p>
              <p className="text-slate-500 mb-8">You've successfully completed every milestone for <b>{activeProject?.projectName}</b>.</p>
              <div className="flex flex-col sm:flex-row gap-4">
                <button onClick={handleContinueWorking} className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl transition-all">Continue Working</button>
                <button onClick={handleFinish} className="flex-1 px-6 py-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl transition-all shadow-lg shadow-indigo-200">Confirm Completion</button>
              </div>
            </div>
          </div>
        )}

        <div className="max-w-4xl mx-auto px-6 py-12">
          {(isCreating || projects.length === 0) ? (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <header className="text-center mb-12">
                <h1 className="text-4xl font-black text-slate-900 mb-4">Create New Project</h1>
                <p className="text-slate-600 font-medium">Feed the AI your assignment details to generate a plan.</p>
              </header>

              <form onSubmit={handleGenerate} className="bg-white rounded-3xl border border-slate-200 p-8 shadow-xl shadow-slate-200/40">
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Assignment Instructions</label>
                    <textarea
                      className="w-full h-44 px-4 py-3 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none resize-none bg-slate-50"
                      placeholder="Describe the task, paste the prompt, or list key requirements..."
                      value={assignmentText}
                      onChange={(e) => setAssignmentText(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Supporting Documents</label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all h-[110px] flex flex-col items-center justify-center ${file ? 'border-indigo-400 bg-indigo-50' : 'border-slate-200 hover:border-indigo-300 bg-slate-50'}`}
                      >
                        <input type="file" ref={fileInputRef} onChange={handleFileChange} className="hidden" accept=".pdf,image/*,.doc,.docx" />
                        <span className="text-sm font-medium text-slate-600 truncate max-w-full">
                          {file ? file.name : 'Click to upload PDF/Img'}
                        </span>
                      </div>
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">Final Deadline</label>
                      <input
                        type="datetime-local"
                        className="w-full h-[110px] px-4 rounded-2xl border border-slate-200 focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none bg-slate-50 font-medium"
                        value={deadline}
                        onChange={(e) => setDeadline(e.target.value)}
                      />
                    </div>
                  </div>

                  {error && <div className="p-4 rounded-2xl bg-red-50 text-red-600 text-sm font-bold">{error}</div>}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-black py-5 px-6 rounded-2xl transition-all shadow-xl shadow-indigo-200 flex items-center justify-center gap-3 disabled:opacity-70"
                  >
                    {loading ? (
                      <svg className="animate-spin h-6 w-6 text-white" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                    ) : 'Generate Roadmap'}
                  </button>
                  {projects.length > 0 && (
                    <button 
                      type="button" 
                      onClick={() => { setIsCreating(false); setActiveProjectId(projects[0].id); }}
                      className="w-full text-slate-400 font-bold py-2 text-sm hover:text-slate-600"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>
          ) : activeProject && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <CountdownTimer targetDate={activeProject.deadline} />

              <div className={`rounded-3xl p-10 text-white shadow-2xl relative overflow-hidden transition-colors duration-500 ${activeProject.isRealistic ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                <div className="absolute top-0 right-0 p-10 opacity-10">
                   <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
                     <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                   </svg>
                </div>
                <div className="relative z-10">
                  <div className="flex items-center gap-2 mb-4">
                    <span className={`px-3 py-1 rounded-lg text-xs font-black uppercase tracking-widest ${activeProject.isRealistic ? 'bg-indigo-400' : 'bg-rose-400'}`}>
                      {activeProject.isRealistic ? 'Optimized Plan' : 'Urgent Timeline'}
                    </span>
                  </div>
                  <h2 className="text-4xl font-black mb-6">{activeProject.projectName}</h2>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-8">
                    <div className="flex flex-col">
                      <span className="opacity-70 text-[10px] font-bold uppercase tracking-widest mb-1">Total Tasks</span>
                      <span className="text-3xl font-black">{activeProject.milestones.length}</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-70 text-[10px] font-bold uppercase tracking-widest mb-1">Completion</span>
                      <span className="text-3xl font-black">{Math.round((activeProject.completedMilestoneIds.length / activeProject.milestones.length) * 100)}%</span>
                    </div>
                    <div className="flex flex-col">
                      <span className="opacity-70 text-[10px] font-bold uppercase tracking-widest mb-1">Total Effort</span>
                      <span className="text-3xl font-black">{activeProject.totalEstimatedHours}h</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className={`p-8 rounded-3xl border flex items-start gap-5 transition-colors ${activeProject.isRealistic ? 'bg-indigo-50/50 border-indigo-100 text-indigo-900' : 'bg-rose-50/50 border-rose-100 text-rose-900'}`}>
                <div className={`p-3 rounded-2xl shrink-0 ${activeProject.isRealistic ? 'bg-indigo-600 shadow-indigo-100 shadow-lg' : 'bg-rose-600 shadow-rose-100 shadow-lg'}`}>
                  <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d={activeProject.isRealistic ? "M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" : "M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"} />
                  </svg>
                </div>
                <div>
                  <h4 className="font-black text-lg mb-1">{activeProject.isRealistic ? 'Workload Analysis' : 'Feasibility Warning'}</h4>
                  <p className="text-sm leading-relaxed font-medium opacity-80">{activeProject.feasibilityNote}</p>
                </div>
              </div>

              <div className="pt-8">
                {activeProject.milestones.map((m, idx) => (
                  <MilestoneCard 
                    key={m.id} 
                    milestone={m} 
                    index={idx} 
                    isCompleted={activeProject.completedMilestoneIds.includes(m.id)}
                    onToggle={toggleMilestone}
                  />
                ))}
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
};

export default App;
