import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { Menu, X, LogOut, Globe } from 'lucide-react';
import { useState } from 'react';

export const Layout = ({ children }) => {
  const { user, logout, isAdmin } = useAuth();
  const isOverview = user?.role === 'overview';
  const showNav = isAdmin || isOverview;
  const { language, toggleLanguage } = useLanguage();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  // Role-based navigation items
  const getNavItems = () => {
    if (isAdmin) {
      // Admin sees all navigation
      return [
        { path: '/dashboard', label: { en: 'Dashboard', ml: 'ഡാഷ്‌ബോർഡ്' } },
        { path: '/data-entry', label: { en: 'Data Entry', ml: 'ഡാറ്റ എൻട്രി' } },
        { path: '/voters', label: { en: 'All Voters', ml: 'എല്ലാ വോട്ടർമാരും' } },
        { path: '/volunteers', label: { en: 'Volunteers', ml: 'സന്നദ്ധപ്രവർത്തകർ' } },
      ];
    } else if (user?.role === 'overview') {
      // Overview users see dashboard, voters, and volunteers (read-only)
      return [
        { path: '/dashboard', label: { en: 'Dashboard', ml: 'ഡാഷ്‌ബോർഡ്' } },
        { path: '/voters', label: { en: 'All Voters', ml: 'എല്ലാ വോട്ടർമാരും' } },
        { path: '/volunteers', label: { en: 'Volunteers', ml: 'സന്നദ്ധപ്രവർത്തകർ' } },
      ];
    } else {
      // Volunteers only see their voters
      return [
        { path: '/voters', label: { en: 'My Voters', ml: 'എന്റെ വോട്ടർമാർ' } },
      ];
    }
  };

  const navItems = getNavItems();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-card border-b border-border sticky top-0 z-50 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link to={(isAdmin || isOverview) ? "/dashboard" : "/voters"} className="text-xl font-bold text-primary">
                {language === 'en' ? 'Ward 14 Voting Tracker' : 'വാർഡ് 14 വോട്ടിംഗ് ട്രാക്കർ'}
              </Link>
            </div>

            {/* Desktop Navigation - Show for admin and overview users */}
            {showNav && (
              <nav className="hidden md:flex items-center space-x-6">
                {navItems.map((item) => (
                  <Link
                    key={item.path}
                    to={item.path}
                    className="text-foreground hover:text-primary transition-colors font-medium"
                  >
                    {item.label[language]}
                  </Link>
                ))}
              </nav>
            )}

            {/* Right side actions */}
            <div className="flex items-center space-x-4">
              {/* Language Toggle */}
              <button
                onClick={toggleLanguage}
                className="flex items-center space-x-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                title={language === 'en' ? 'Switch to Malayalam' : 'Switch to English'}
              >
                <Globe className="w-5 h-5" />
                <span className="text-sm font-medium">{language === 'en' ? 'EN' : 'മലയാളം'}</span>
              </button>

              {/* User info */}
              <div className="hidden md:flex items-center space-x-2 text-sm">
                <span className="text-muted-foreground">
                  {user?.username} {isAdmin && '(Admin)'} {isOverview && '(Overview)'}
                </span>
              </div>

              {/* Logout button */}
              <button
                onClick={handleLogout}
                className="flex items-center space-x-2 px-3 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                <span className="hidden sm:inline">
                  {language === 'en' ? 'Logout' : 'പുറത്തുകടക്കുക'}
                </span>
              </button>

              {/* Mobile menu button - Show for admin and overview users */}
              {showNav && (
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="md:hidden p-2 rounded-md hover:bg-accent"
                >
                  {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-border">
            <nav className="px-4 py-4 space-y-2">
              {navItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className="block px-3 py-2 rounded-md hover:bg-accent transition-colors"
                >
                  {item.label[language]}
                </Link>
              ))}
              <div className="pt-2 border-t border-border">
                <div className="px-3 py-2 text-sm text-muted-foreground">
                  {user?.username} {isAdmin && '(Admin)'} {isOverview && '(Overview)'}
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>

      {/* Footer */}
      <footer className="bg-card border-t border-border mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <p className="text-center text-sm text-muted-foreground">
            {language === 'en' 
              ? '© 2024 Ward 14 Voting Tracker. All rights reserved.' 
              : '© 2024 വാർഡ് 14 വോട്ടിംഗ് ട്രാക്കർ. എല്ലാ അവകാശങ്ങളും സംരക്ഷിതം.'}
          </p>
        </div>
      </footer>
    </div>
  );
};
