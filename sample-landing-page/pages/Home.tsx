
import React, { useState } from 'react';
import { Button } from '../components/ui/Button';
import { ENV_URLS, HERO_CONTENT } from '../constants';
import { UserRole } from '../types';

// Icon Components
const MapIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 7m0 13V7" /></svg>;
const CalendarIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>;
const ChartIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 002 2h2a2 2 0 002-2z" /></svg>;
const ShieldIcon = () => <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>;

export const Home: React.FC = () => {
  const [activeTab, setActiveTab] = useState<UserRole>(UserRole.PLAYER);
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    // Construct the search URL for the main web app
    const appDomain = 'https://app.aayokhel.com';
    window.location.href = `${appDomain}/venues?search=${encodeURIComponent(searchQuery)}`;
  };

  const quickSearch = (term: string) => {
    const appDomain = 'https://app.aayokhel.com';
    window.location.href = `${appDomain}/venues?search=${encodeURIComponent(term)}`;
  };

  return (
    <div className="min-h-screen overflow-x-hidden">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 lg:pt-48 lg:pb-32 overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-2/3 h-full bg-gradient-to-l from-brand-100/50 to-transparent dark:from-brand-900/20 dark:to-transparent opacity-60 transition-colors duration-500" />
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-brand-500/10 dark:bg-brand-500/20 rounded-full blur-[128px]" />
          <div className="absolute bottom-1/4 right-1/4 w-64 h-64 bg-orange-300/20 dark:bg-brand-accent/10 rounded-full blur-[100px]" />
          {/* Mesh grid effect */}
          <div className="absolute inset-0 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] opacity-20"></div>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6">
          <div className="flex flex-col lg:flex-row items-center gap-12">
            <div className="lg:w-1/2 space-y-8">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/60 dark:bg-white/5 border border-slate-200 dark:border-white/10 backdrop-blur-sm shadow-sm dark:shadow-none">
                <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                <span className="text-sm font-medium text-brand-900 dark:text-brand-100">Live in Kathmandu & Pokhara</span>
              </div>
              
              <h1 className="text-5xl lg:text-7xl font-extrabold leading-tight tracking-tight text-slate-900 dark:text-white">
                {HERO_CONTENT.title.split(" ").slice(0, -1).join(" ")} 
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-600 to-brand-400 dark:from-brand-500 dark:to-brand-100">
                  {" "}{HERO_CONTENT.title.split(" ").pop()}
                </span>
              </h1>
              
              <p className="text-lg text-slate-600 dark:text-slate-400 leading-relaxed max-w-lg">
                {HERO_CONTENT.subtitle} Discover real-time availability, instant bookings, and secure payments.
              </p>

              {/* Thematic Search Bar */}
              <div className="w-full max-w-md relative z-20 pb-2">
                <form onSubmit={handleSearch} className="relative group">
                  {/* Glow effect */}
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-brand-400 to-brand-500 rounded-full blur opacity-30 group-hover:opacity-60 transition duration-500"></div>
                  
                  <div className="relative flex items-center bg-white/80 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200 dark:border-white/10 rounded-full p-1.5 focus-within:border-brand-500/50 transition-all shadow-xl dark:shadow-2xl">
                    <div className="pl-4 text-slate-400">
                      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                         <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                    </div>
                    <input 
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="flex-1 bg-transparent border-none text-slate-900 dark:text-white placeholder-slate-500 focus:ring-0 px-3 py-3 outline-none w-full font-medium"
                      placeholder="Search venue, location..."
                    />
                    <button 
                      type="submit"
                      className="bg-brand-500 hover:bg-brand-600 text-white rounded-full px-6 py-2.5 font-bold transition-all duration-300 shadow-lg shadow-brand-500/20 flex items-center gap-2 transform active:scale-95"
                    >
                      <span>Find</span>
                    </button>
                  </div>
                </form>
                <div className="mt-3 flex gap-4 text-xs text-slate-500 dark:text-slate-500 px-4 font-medium">
                   <span>Popular:</span>
                   <button type="button" onClick={() => quickSearch('Kathmandu')} className="hover:text-brand-500 transition-colors underline decoration-dotted">Kathmandu</button>
                   <button type="button" onClick={() => quickSearch('Lalitpur')} className="hover:text-brand-500 transition-colors underline decoration-dotted">Lalitpur</button>
                   <button type="button" onClick={() => quickSearch('Indoor')} className="hover:text-brand-500 transition-colors underline decoration-dotted">Indoor</button>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row gap-4 pt-2">
                <Button 
                  href={ENV_URLS.USER_REGISTER} 
                  external
                  variant="secondary"
                  size="md"
                >
                  Join as Player
                </Button>
                <Button 
                  href={ENV_URLS.MANAGER_REGISTER} 
                  external
                  variant="outline" 
                  size="md"
                >
                  List Your Venue
                </Button>
              </div>
            </div>

            {/* Hero Graphic */}
            <div className="lg:w-1/2 relative">
              <div className="relative z-10 rounded-2xl overflow-hidden shadow-2xl border border-slate-200 dark:border-white/10 group transform hover:scale-[1.02] transition-transform duration-500">
                <img 
                  src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?q=80&w=1949&auto=format&fit=crop" 
                  alt="3D Cartoon Style Futsal Player" 
                  className="w-full h-[500px] object-cover object-center"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-slate-900 via-slate-900/20 to-transparent opacity-30 dark:opacity-40" />
                
                {/* Live Activity Floating Widget */}
                <div className="absolute bottom-6 left-6 right-6 bg-white/90 dark:bg-slate-900/95 backdrop-blur-xl p-5 rounded-2xl border border-slate-200 dark:border-white/10 shadow-2xl transition-colors">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-200 dark:border-white/5 pb-3">
                    <div className="flex items-center gap-2">
                       <span className="relative flex h-3 w-3">
                          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-brand-500 opacity-75"></span>
                          <span className="relative inline-flex rounded-full h-3 w-3 bg-brand-500"></span>
                       </span>
                       <span className="text-slate-900 dark:text-white font-bold tracking-wide">Live Activity</span>
                    </div>
                    <div className="flex -space-x-2">
                       <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-600 overflow-hidden">
                         <img src="https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=100&q=80" alt="User" className="w-full h-full object-cover" />
                       </div>
                       <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-slate-500 overflow-hidden">
                         <img src="https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=100&q=80" alt="User" className="w-full h-full object-cover" />
                       </div>
                       <div className="w-7 h-7 rounded-full border-2 border-white dark:border-slate-900 bg-brand-500 flex items-center justify-center text-[10px] font-bold text-white dark:text-brand-900">
                         8+
                       </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4 items-end">
                     <div>
                        <div className="text-3xl font-bold text-slate-900 dark:text-white">12</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">Courts Open</div>
                     </div>
                     <div>
                        <div className="text-3xl font-bold text-brand-500">45</div>
                        <div className="text-[10px] uppercase tracking-wider text-slate-500 dark:text-slate-400 font-semibold mt-1">Booking Now</div>
                     </div>
                     <div className="flex flex-col justify-center">
                        <button className="w-full bg-brand-500 hover:bg-brand-600 text-white dark:text-brand-900 text-xs font-bold py-3 px-3 rounded-xl transition-all duration-300 transform hover:translate-y-[-2px] shadow-lg shadow-brand-500/20">
                           Book Fast
                        </button>
                     </div>
                  </div>
                </div>
              </div>
              
              {/* Decorative elements behind */}
              <div className="absolute -top-6 -right-6 w-full h-full border-2 border-brand-500/20 rounded-2xl -z-10"></div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="border-y border-slate-200 dark:border-white/5 bg-white dark:bg-brand-dark/50 transition-colors">
        <div className="max-w-7xl mx-auto px-6 py-12">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { val: '50+', label: 'Venues' },
              { val: '10k+', label: 'Active Players' },
              { val: '25k+', label: 'Bookings Made' },
              { val: '4.8', label: 'User Rating' },
            ].map((stat, idx) => (
              <div key={idx}>
                <div className="text-3xl md:text-4xl font-bold text-slate-900 dark:text-white mb-1 transition-colors">{stat.val}</div>
                <div className="text-sm text-slate-500 font-medium uppercase tracking-wider">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Interactive Role Switcher Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-bold text-slate-900 dark:text-white mb-6 transition-colors">How AayoKhel Works</h2>
            
            <div className="inline-flex bg-slate-200 dark:bg-white/5 p-1 rounded-full border border-slate-300 dark:border-white/10 backdrop-blur-sm transition-colors">
              <button 
                onClick={() => setActiveTab(UserRole.PLAYER)}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === UserRole.PLAYER ? 'bg-white dark:bg-brand-500 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                For Players
              </button>
              <button 
                onClick={() => setActiveTab(UserRole.OWNER)}
                className={`px-8 py-3 rounded-full text-sm font-bold transition-all duration-300 ${activeTab === UserRole.OWNER ? 'bg-white dark:bg-brand-500 text-slate-900 dark:text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'}`}
              >
                For Venue Owners
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="space-y-12">
              {activeTab === UserRole.PLAYER ? (
                <>
                   <FeatureRow 
                    icon={<MapIcon />} 
                    title="Discover Nearby Venues" 
                    desc="Open the interactive map to see all available grounds. Filter by price, rating, and facilities." 
                  />
                  <FeatureRow 
                    icon={<CalendarIcon />} 
                    title="Instant Booking" 
                    desc="Real-time slots means no more double booking. Pick your time, pay via eSewa, and you're set." 
                  />
                  <FeatureRow 
                    icon={<ShieldIcon />} 
                    title="Earn Reputation" 
                    desc="Show up, play fair, and build your player profile. Rate venues to help the community." 
                  />
                </>
              ) : (
                <>
                   <FeatureRow 
                    icon={<ChartIcon />} 
                    title="Dashboard Analytics" 
                    desc="Track peak hours, revenue, and customer retention with professional grade tools." 
                  />
                  <FeatureRow 
                    icon={<CalendarIcon />} 
                    title="Schedule Management" 
                    desc="Block maintenance hours, set holiday pricing, and manage multiple courts from one screen." 
                  />
                  <FeatureRow 
                    icon={<ShieldIcon />} 
                    title="Verified Payments" 
                    desc="No more 'I'll pay later'. Receive secure payments instantly upon booking confirmation." 
                  />
                </>
              )}
            </div>

            <div className="relative h-[500px] bg-gradient-to-b from-slate-100 to-slate-200 dark:from-slate-800 dark:to-slate-900 rounded-3xl border border-slate-200 dark:border-white/10 overflow-hidden group transition-colors">
              <div className="absolute inset-0 opacity-50 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] dark:invert-0 invert"></div>
              
              {/* Dynamic Image based on Tab */}
              <img 
                key={activeTab}
                src={activeTab === UserRole.PLAYER 
                  ? "https://images.unsplash.com/photo-1517466787929-bc90951d0974?q=80&w=1926&auto=format&fit=crop" 
                  : "https://images.unsplash.com/photo-1551288049-bebda4e38f71?q=80&w=2070&auto=format&fit=crop"}
                alt="Feature Preview"
                className="absolute inset-0 w-full h-full object-cover opacity-60 transition-opacity duration-500 mix-blend-overlay dark:mix-blend-normal"
              />
              
              <div className="absolute bottom-0 left-0 w-full p-8 bg-gradient-to-t from-slate-900 via-slate-900/60 to-transparent">
                <h4 className="text-2xl font-bold text-white mb-2">
                  {activeTab === UserRole.PLAYER ? "Game On." : "Business Growth."}
                </h4>
                <p className="text-slate-300">
                  {activeTab === UserRole.PLAYER 
                    ? "Join thousands of players booking daily." 
                    : "Maximize your venue utilization today."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Bento Grid Features */}
      <section className="py-24 bg-slate-100/50 dark:bg-white/5 transition-colors">
        <div className="max-w-7xl mx-auto px-6">
          <div className="mb-12">
            <h2 className="text-4xl font-bold text-slate-900 dark:text-white transition-colors">Engineered for Football</h2>
            <p className="text-slate-600 dark:text-slate-400 mt-4">Not just a booking form. A complete ecosystem.</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 grid-rows-2 gap-6 h-auto md:h-[600px]">
            
            {/* Large item - Real Interactive Map Tech Visual */}
            <div className="md:col-span-2 md:row-span-2 bg-white dark:bg-brand-dark border border-slate-200 dark:border-white/10 rounded-3xl relative overflow-hidden group hover:border-brand-500/50 transition-colors shadow-lg dark:shadow-none">
              
              {/* Simulated Map Interface Background */}
              <div className="absolute inset-0 bg-slate-200 dark:bg-slate-900 transition-colors">
                 {/* Map Image Base */}
                 <img 
                   src="https://images.unsplash.com/photo-1524661135-423995f22d0b?q=80&w=1748&auto=format&fit=crop" 
                   alt="Map Interface" 
                   className="w-full h-full object-cover opacity-60 dark:opacity-40 grayscale group-hover:grayscale-0 transition-all duration-700"
                 />
                 
                 {/* UI Overlay - Pins */}
                 <div className="absolute top-1/3 left-1/4 transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer">
                    <div className="relative">
                       <div className="w-8 h-8 bg-brand-500 rounded-full border-2 border-white flex items-center justify-center shadow-lg shadow-brand-500/50">
                          <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                       </div>
                       <div className="absolute -bottom-12 left-1/2 transform -translate-x-1/2 w-32 bg-white rounded shadow-xl p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-20">
                          <div className="text-xs font-bold text-slate-900">City Futsal</div>
                          <div className="text-[10px] text-slate-500">1.2km away • Rs 1200</div>
                       </div>
                    </div>
                 </div>

                 <div className="absolute bottom-1/3 right-1/3 transform hover:-translate-y-2 transition-transform duration-300 cursor-pointer">
                    <div className="w-8 h-8 bg-slate-800 dark:bg-brand-900 rounded-full border-2 border-brand-500 flex items-center justify-center shadow-lg">
                       <svg className="w-4 h-4 text-brand-500" fill="currentColor" viewBox="0 0 24 24"><path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"/></svg>
                    </div>
                 </div>
              </div>

              {/* Content Overlay */}
              <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-white via-white/90 dark:from-brand-dark dark:via-brand-dark/90 to-transparent">
                <h3 className="text-2xl font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
                   <span className="w-2 h-2 rounded-full bg-brand-500 animate-pulse"></span>
                   Interactive Map Tech
                </h3>
                <p className="text-slate-600 dark:text-slate-300 max-w-md">
                   Powered by OpenStreetMap & Leaflet. Visualize venues in your area with precise geolocation, get turn-by-turn directions, and check distance in real-time.
                </p>
              </div>
            </div>

            {/* Small Item 1 */}
            <div className="bg-white dark:bg-brand-dark border border-slate-200 dark:border-white/10 rounded-3xl p-8 group hover:border-brand-500/50 transition-colors shadow-lg dark:shadow-none">
              <div className="w-12 h-12 bg-brand-500/10 dark:bg-brand-500/20 rounded-lg flex items-center justify-center mb-4 text-brand-600 dark:text-brand-500">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Secure Auth</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Google & Firebase integration keeps your account safe.</p>
            </div>

            {/* Small Item 2 */}
            <div className="bg-white dark:bg-brand-dark border border-slate-200 dark:border-white/10 rounded-3xl p-8 group hover:border-brand-500/50 transition-colors shadow-lg dark:shadow-none">
               <div className="w-12 h-12 bg-orange-100 dark:bg-brand-accent/20 rounded-lg flex items-center justify-center mb-4 text-brand-accent">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2">Next.js Speed</h3>
              <p className="text-sm text-slate-600 dark:text-slate-400">Lightning fast web app performance.</p>
            </div>

          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative">
        <div className="absolute inset-0 bg-brand-500/5 dark:bg-brand-500/5"></div>
        <div className="max-w-4xl mx-auto px-6 text-center relative z-10">
          <h2 className="text-5xl font-black text-slate-900 dark:text-white mb-6 transition-colors">Ready to kick off?</h2>
          <p className="text-xl text-slate-600 dark:text-slate-300 mb-10 transition-colors">Join the fastest growing futsal community in Nepal today.</p>
          
          <div className="flex flex-col sm:flex-row justify-center gap-4">
            <Button href={ENV_URLS.USER_REGISTER} external size="lg" className="w-full sm:w-auto">
              Create Player Account
            </Button>
            <Button href={ENV_URLS.MANAGER_REGISTER} external variant="secondary" size="lg" className="w-full sm:w-auto">
              Register Venue
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
};

// Helper Component for Feature Rows
const FeatureRow: React.FC<{ icon: React.ReactNode, title: string, desc: string }> = ({ icon, title, desc }) => (
  <div className="flex gap-6 group">
    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-slate-100 dark:bg-white/5 flex items-center justify-center text-brand-600 dark:text-brand-500 border border-slate-200 dark:border-white/10 group-hover:bg-brand-500 group-hover:text-white transition-all duration-300 shadow-sm dark:shadow-none">
      {icon}
    </div>
    <div>
      <h3 className="text-xl font-bold text-slate-900 dark:text-white mb-2 group-hover:text-brand-600 dark:group-hover:text-brand-500 transition-colors">{title}</h3>
      <p className="text-slate-600 dark:text-slate-400 leading-relaxed">{desc}</p>
    </div>
  </div>
);