
import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Logo } from './Logo';
import { Button } from './ui/Button';
import { ThemeToggle } from './ThemeToggle';
import { ENV_URLS, NAVIGATION_ITEMS } from '../constants';

export const Navbar: React.FC = () => {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const location = useLocation();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  return (
    <nav 
      className={`fixed top-0 w-full z-50 transition-all duration-500 ${
        scrolled 
          ? 'bg-white/80 dark:bg-brand-dark/80 backdrop-blur-lg border-b border-slate-200 dark:border-white/5 py-4 shadow-sm dark:shadow-none' 
          : 'bg-transparent py-6'
      }`}
    >
      <div className="max-w-7xl mx-auto px-6 flex justify-between items-center">
        <Logo />

        {/* Desktop Nav */}
        <div className="hidden md:flex items-center gap-8">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => 
                `text-sm font-medium transition-colors hover:text-brand-500 ${
                  isActive ? 'text-brand-500' : 'text-slate-600 dark:text-slate-300'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </div>

        <div className="hidden md:flex items-center gap-4">
          <ThemeToggle />
          <div className="h-6 w-px bg-slate-200 dark:bg-white/10"></div>
          <Button 
            variant="ghost" 
            size="sm" 
            href={ENV_URLS.MANAGER_REGISTER}
            external
          >
            For Venues
          </Button>
          <Button 
            variant="primary" 
            size="sm" 
            href={ENV_URLS.USER_REGISTER}
            external
          >
            Join Now
          </Button>
        </div>

        {/* Mobile Toggle */}
        <div className="flex items-center gap-4 md:hidden">
          <ThemeToggle />
          <button 
            className="text-slate-900 dark:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              {mobileMenuOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-white dark:bg-brand-dark border-b border-slate-200 dark:border-white/10 p-6 flex flex-col gap-4 shadow-2xl">
          {NAVIGATION_ITEMS.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className="text-lg font-medium text-slate-800 dark:text-slate-300 hover:text-brand-500 py-2"
            >
              {item.label}
            </NavLink>
          ))}
          <div className="h-px bg-slate-200 dark:bg-white/10 my-2" />
          <Button href={ENV_URLS.MANAGER_REGISTER} external variant="outline" fullWidth>Partner with Us</Button>
          <Button href={ENV_URLS.USER_REGISTER} external fullWidth>Join Now</Button>
        </div>
      )}
    </nav>
  );
};