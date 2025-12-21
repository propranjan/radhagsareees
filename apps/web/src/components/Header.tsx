'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { ShoppingBag, Heart, Search, Menu, Phone, Mail, MapPin, User, LogOut, Settings } from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

export default function Header() {
  const router = useRouter();
  const [user, setUser] = useState<any>(null);
  const [userName, setUserName] = useState<string>('');
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [cartCount, setCartCount] = useState(0);

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  const supabase = supabaseUrl && supabaseAnonKey 
    ? createClient(supabaseUrl, supabaseAnonKey)
    : null;

  useEffect(() => {
    if (!supabase) return;

    // Get current user
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUser(user);
        // Get user name from metadata or fetch from database
        const name = user.user_metadata?.name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User';
        setUserName(name);
        // Load cart count
        loadCartCount(user.id);
      }
    };

    getUser();

    // Listen for auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (session?.user) {
        setUser(session.user);
        const name = session.user.user_metadata?.name || session.user.user_metadata?.full_name || session.user.email?.split('@')[0] || 'User';
        setUserName(name);
        loadCartCount(session.user.id);
      } else {
        setUser(null);
        setUserName('');
        setCartCount(0);
      }
    });

    // Listen for cart updates
    const handleCartUpdate = () => {
      if (user) {
        loadCartCount(user.id);
      }
    };

    window.addEventListener('cartUpdated', handleCartUpdate);

    return () => {
      authListener.subscription.unsubscribe();
      window.removeEventListener('cartUpdated', handleCartUpdate);
    };
  }, [supabase, user]);

  const loadCartCount = async (userId: string) => {
    try {
      const response = await fetch(`/api/cart/${userId}`);
      if (response.ok) {
        const data = await response.json();
        setCartCount(data.totalItems || 0);
      }
    } catch (error) {
      console.error('Failed to load cart count:', error);
    }
  };

  const handleSignOut = async () => {
    if (!supabase) return;
    
    await supabase.auth.signOut();
    setUser(null);
    setUserName('');
    setCartCount(0);
    setShowUserMenu(false);
    router.push('/');
  };

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="hidden md:flex items-center justify-between py-2 text-sm text-gray-600 border-b">
          <div className="flex items-center space-x-6">
            <div className="flex items-center space-x-2">
              <Phone className="w-4 h-4" />
              <span>+91 9876543210</span>
            </div>
            <div className="flex items-center space-x-2">
              <Mail className="w-4 h-4" />
              <span>info@radhagsarees.com</span>
            </div>
            <div className="flex items-center space-x-2">
              <MapPin className="w-4 h-4" />
              <span>Mumbai, Maharashtra</span>
            </div>
          </div>
          <div className="text-primary-600 font-medium">
            Free Shipping on Orders Above ₹2999
          </div>
        </div>

        {/* Main Header */}
        <div className="flex items-center justify-between py-4">
          {/* Logo */}
          <Link href="/" className="text-2xl font-serif font-bold text-primary-600">
            Radha G Sarees
          </Link>

          {/* Navigation */}
          <nav className="hidden md:flex items-center space-x-8">
            <Link href="/" className="text-gray-700 hover:text-primary-600 transition-colors">
              Home
            </Link>
            <Link href="/catalog" className="text-gray-700 hover:text-primary-600 transition-colors">
              Catalog
            </Link>
            <Link href="/categories" className="text-gray-700 hover:text-primary-600 transition-colors">
              Categories
            </Link>
            <Link href="/about" className="text-gray-700 hover:text-primary-600 transition-colors">
              About
            </Link>
            <Link href="/contact" className="text-gray-700 hover:text-primary-600 transition-colors">
              Contact
            </Link>
          </nav>

          {/* Actions */}
          <div className="flex items-center space-x-4">
            <button className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Search className="w-5 h-5" />
            </button>
            
            {/* User Menu */}
            {user ? (
              <div className="relative">
                <button
                  onClick={() => setShowUserMenu(!showUserMenu)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-primary-600 transition-colors font-medium"
                >
                  <User className="w-5 h-5" />
                  <span className="hidden md:inline">{userName}</span>
                </button>
                
                {showUserMenu && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg border py-2">
                    <Link
                      href="/settings"
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="w-4 h-4" />
                      <span>Settings</span>
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 transition-colors w-full text-left"
                    >
                      <LogOut className="w-4 h-4" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <Link href="/auth/login" className="hidden md:block text-gray-700 hover:text-primary-600 transition-colors font-medium">
                Sign In
              </Link>
            )}
            
            <Link href="/wishlist" className="p-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Heart className="w-5 h-5" />
            </Link>
            <Link href="/cart" className="p-2 text-gray-600 hover:text-primary-600 transition-colors relative">
              <ShoppingBag className="w-5 h-5" />
              {cartCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {cartCount}
                </span>
              )}
            </Link>
            <button className="md:hidden p-2 text-gray-600 hover:text-primary-600 transition-colors">
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
