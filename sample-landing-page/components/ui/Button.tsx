import React from 'react';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  fullWidth?: boolean;
  icon?: React.ReactNode;
  href?: string;
  external?: boolean;
}

export const Button: React.FC<ButtonProps> = ({ 
  children, 
  variant = 'primary', 
  size = 'md', 
  fullWidth = false,
  className = '',
  icon,
  href,
  external,
  ...props 
}) => {
  const baseStyles = "inline-flex items-center justify-center rounded-full font-semibold transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand-500 disabled:opacity-50 disabled:cursor-not-allowed";
  
  const variants = {
    primary: "bg-brand-500 text-white hover:bg-brand-600 shadow-lg shadow-brand-500/30 hover:shadow-brand-500/50 border border-transparent",
    secondary: "bg-slate-100 dark:bg-white text-brand-900 hover:bg-slate-200 dark:hover:bg-slate-100 border border-transparent",
    outline: "bg-transparent text-slate-700 dark:text-white border border-slate-300 dark:border-white/20 hover:border-brand-500 dark:hover:border-brand-500 hover:text-brand-500 dark:hover:text-brand-500",
    ghost: "bg-transparent text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-white/5",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  const widthStyle = fullWidth ? "w-full" : "";
  const classes = `${baseStyles} ${variants[variant]} ${sizes[size]} ${widthStyle} ${className}`;

  if (href) {
    return (
      <a 
        href={href} 
        className={classes}
        target={external ? "_blank" : undefined}
        rel={external ? "noopener noreferrer" : undefined}
      >
        {children}
        {icon && <span className="ml-2">{icon}</span>}
      </a>
    );
  }

  return (
    <button className={classes} {...props}>
      {children}
      {icon && <span className="ml-2">{icon}</span>}
    </button>
  );
};