import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useConference } from '../context/ConferenceContext';
import { Navbar } from '../components/Navbar/Navbar';
import { Cpu, Globe, Zap, Radio, Settings, PenTool, LayoutGrid } from 'lucide-react';

const Dashboard = () => {
  const { user } = useConference();
  const navigate = useNavigate();

  const departments = [
    { id: 'cse', name: 'Computer Science', icon: <Cpu size={40}/>, color: 'from-blue-600 to-cyan-500' },
    { id: 'it', name: 'Information Tech', icon: <Globe size={40}/>, color: 'from-purple-600 to-pink-500' },
    { id: 'aids', name: 'AI & Data Science', icon: <LayoutGrid size={40}/>, color: 'from-green-500 to-emerald-500' },
    { id: 'ece', name: 'Electronics (ECE)', icon: <Radio size={40}/>, color: 'from-orange-500 to-red-500' },
    { id: 'eee', name: 'Electrical (EEE)', icon: <Zap size={40}/>, color: 'from-yellow-500 to-amber-500' },
    { id: 'mech', name: 'Mechanical', icon: <Settings size={40}/>, color: 'from-slate-500 to-gray-400' },
    { id: 'civil', name: 'Civil Engg', icon: <PenTool size={40}/>, color: 'from-amber-700 to-orange-800' },
  ];

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-[#0f0518] p-6 pt-32 text-white">
        <div className="max-w-7xl mx-auto">
          <div className="mb-12 text-center md:text-left">
            <h1 className="text-4xl font-bold font-orbitron mb-2">
              Welcome, <span className="text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-pink-600">{user?.name}</span>
            </h1>
            <p className="text-purple-300">Select a department to view available Conference Tracks & Events.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {departments.map((dept) => (
              <div 
                key={dept.id}
                onClick={() => navigate(`/conference/tracks/${dept.id}`)}
                className="relative group cursor-pointer rounded-2xl overflow-hidden border border-white/10 hover:border-pink-500/50 transition-all duration-300 hover:-translate-y-2"
              >
                <div className={`absolute inset-0 bg-gradient-to-br ${dept.color} opacity-10 group-hover:opacity-20 transition-opacity`}></div>
                <div className="p-8 flex flex-col items-center text-center bg-white/5 backdrop-blur-sm h-full">
                  <div className={`p-4 rounded-full bg-gradient-to-br ${dept.color} mb-4 shadow-lg`}>
                    {dept.icon}
                  </div>
                  <h3 className="text-xl font-bold font-orbitron mb-2">{dept.name}</h3>
                  <span className="text-xs text-gray-400 uppercase tracking-widest">View Tracks</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};

export default Dashboard;