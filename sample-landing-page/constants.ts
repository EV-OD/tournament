export const ENV_URLS = {
  MANAGER_REGISTER: process.env.REACT_APP_MANAGER_REGISTER_URL || 'https://app.aayokhel.com/manager/register',
  USER_REGISTER: process.env.REACT_APP_USER_REGISTER_URL || 'https://app.aayokhel.com/user/register',
};

export const BRAND_NAME = "AayoKhel"; // "Game is On" / "Let's Play" in Nepali context

export const NAVIGATION_ITEMS = [
  { label: 'Home', path: '/' },
  { label: 'About', path: '/about' },
  { label: 'Features', path: '/features' },
  { label: 'Contact', path: '/contact' },
];

export const HERO_CONTENT = {
  title: "The Arena is Calling.",
  subtitle: "Nepal's #1 platform to discover, book, and manage futsal venues. No calls, no hassle—just game.",
};
