"use client";
import { useState } from 'react';
import LogoIcon from "@/assets/logo.png";
import Image from 'next/image';
import Link from 'next/link';
import { MenuIcon, XIcon } from 'lucide-react';
import { Button } from "@/components/Button";
import { useAuth } from '@/context/AuthContext';
import { useRouter } from 'next/navigation';

export default function Header() {
  const router = useRouter();
  const [menuOpen, setMenuOpen] = useState(false);
  const { user, signOut } = useAuth();

  const handleSignOut = async () => {
    try {
      await signOut();
      router.push('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  return (
    <header className="py-4 border-b border-white/15 md:border-none sticky top-0 z-10">
      <div className={`absolute inset-0 backdrop-blur transition-opacity duration-300 ${menuOpen ? 'bg-gray-950 bg-opacity-50' : 'bg-transparent'}`}></div>
      <div className="container">
        <div className="flex justify-between items-center md:border border-white/15 md:p-2.5 max-w-2xl mx-auto rounded-xl relative">
          <div className="flex items-center gap-2">
            <div className="border w-10 h-10 rounded-lg inline-flex justify-center items-center border-white/15">
              <div className="absolute inset-0 backdrop-blur -z-10 hidden md:block"></div>
              <Image src={LogoIcon.src} alt="Logo" width={32} height={32} className="w-8 h-8" />
            </div>
            <span className="hidden md:block text-white font-medium">Jadoo.ai</span>
          </div>

          <div className="hidden md:block absolute left-1/2 transform -translate-x-1/2">
            <nav className="flex gap-8 text-sm">
              <a href="/" className="text-white/70 hover:text-white transition">Home</a>
              <a href="search" className="text-white/70 hover:text-white transition">Search</a>
              <a href="upload" className="text-white/70 hover:text-white transition">Upload</a>
            </nav>
          </div>

          <div className="flex gap-4 items-center">
            {!user ? (
              <>
                <Link href="/signup">
                  <Button>Sign up</Button>
                </Link>
                <Link href="/login">
                  <Button>Login</Button>
                </Link>
              </>
            ) : (
              <>
                <Button onClick={handleSignOut}>Sign out</Button>
              </>
            )}
            <MenuIcon
              className="w-8 h-8 md:hidden cursor-pointer"
              onClick={() => setMenuOpen(true)}
            />
          </div>
        </div>
      </div>

      {/* Mobile menu */}
      <div className={`fixed border border-l border-white/15 inset-y-0 right-0 w-80 bg-gray-950 transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-30 md:hidden`}>
        <div className="flex items-center justify-end p-4">
          <XIcon
            className="w-6 h-6 text-white cursor-pointer"
            onClick={() => setMenuOpen(false)}
          />
        </div>
        <nav className="flex flex-col items-center mt-10 gap-6 px-4">
          <a href="/" className="text-white text-md" onClick={() => setMenuOpen(false)}>Home</a>
          <a href="search" className="text-white text-md" onClick={() => setMenuOpen(false)}>Search</a>
          <a href="upload" className="text-white text-md" onClick={() => setMenuOpen(false)}>Upload</a>
        </nav>
      </div>
    </header>
  );
}