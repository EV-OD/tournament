
import React from 'react';
import { Logo } from './Logo';
import { ENV_URLS } from '../constants';

export const Footer: React.FC = () => {
  return (
    <footer className="bg-white dark:bg-brand-dark border-t border-slate-200 dark:border-white/5 pt-20 pb-10 transition-colors duration-300">
      <div className="max-w-7xl mx-auto px-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-16">
          <div className="space-y-6">
            <Logo />
            <p className="text-slate-500 dark:text-slate-400 leading-relaxed">
              Fursal (now AayoKhel) is modernizing how Nepal plays. We bridge the gap between passionate players and premium venues through our web platform.
            </p>
          </div>
          
          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-6">Platform</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
              <li><a href={ENV_URLS.USER_REGISTER} className="hover:text-brand-500 transition-colors">For Players</a></li>
              <li><a href={ENV_URLS.MANAGER_REGISTER} className="hover:text-brand-500 transition-colors">For Venue Owners</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Pricing</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-6">Company</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
              <li><a href="/about" className="hover:text-brand-500 transition-colors">About Us</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Careers</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Privacy Policy</a></li>
              <li><a href="#" className="hover:text-brand-500 transition-colors">Terms of Service</a></li>
            </ul>
          </div>

          <div>
            <h3 className="text-slate-900 dark:text-white font-bold mb-6">Contact</h3>
            <ul className="space-y-4 text-slate-500 dark:text-slate-400">
              <li>support@aayokhel.com</li>
              <li>+977 9800000000</li>
              <li>Kathmandu, Nepal</li>
            </ul>
          </div>
        </div>

        <div className="pt-8 border-t border-slate-200 dark:border-white/5 flex flex-col md:flex-row justify-between items-center gap-4">
          <p className="text-slate-400 dark:text-slate-500 text-sm">© {new Date().getFullYear()} AayoKhel. All rights reserved.</p>
          <div className="flex gap-6">
             {/* Social Icons placeholders */}
             <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-brand-500 cursor-pointer transition-colors" />
             <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-brand-500 cursor-pointer transition-colors" />
             <div className="w-6 h-6 bg-slate-200 dark:bg-slate-700 rounded-full hover:bg-brand-500 cursor-pointer transition-colors" />
          </div>
        </div>
      </div>
    </footer>
  );
};