"use client";
import { useState } from 'react';
import LogoIcon from "@/assets/logo.png";
import Image from 'next/image';
import { MenuIcon, XIcon } from 'lucide-react';
import { Button } from "@/components/Button";

export default function Header() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <header className="py-4 border-b border-white/15 md:border-none sticky top-0 z-10">
      <div className={`absolute inset-0 backdrop-blur transition-opacity duration-300 ${menuOpen ? 'bg-black bg-opacity-50' : 'bg-transparent'}`}></div>
      <div className="container"> 
        <div className="flex justify-between items-center md:border border-white/15 md:p-2.5 max-w-2xl mx-auto rounded-xl relative">
          <div>
            <div className="border w-10 h-10 rounded-lg inline-flex justify-center items-center border-white/15">
              <div className="absolute inset-0 backdrop-blur -z-10 hidden md:block"></div>
              <Image src={LogoIcon.src} alt="Logo" width={32} height={32} className="w-8 h-8" />
            </div>
          </div>
          {/* Menu for large screens */}
          <div className="hidden md:block">
            <nav className="flex gap-8 text-sm">
              <a href="#" className="text-white/70 hover:text-white transition">Gallery</a>
              <a href="#" className="text-white/70 hover:text-white transition">Search</a>
              <a href="#" className="text-white/70 hover:text-white transition">Upload</a>
            </nav>
          </div>
          <div className="flex gap-4 items-center">
            <Button>Join waitlist</Button>
            <MenuIcon
              className="w-8 h-8 md:hidden cursor-pointer"
              onClick={() => setMenuOpen(true)}
            />
          </div>
        </div>
      </div>
      {/* Sidebar menu for small screens */}
      <div className={`fixed inset-y-0 right-0 w-80 bg-black transform ${menuOpen ? 'translate-x-0' : 'translate-x-full'} transition-transform duration-300 ease-in-out z-30 md:hidden`}>
        <div className="flex items-center justify-end p-4">
          <XIcon
            className="w-6 h-6 text-white cursor-pointer"
            onClick={() => setMenuOpen(false)}
          />
        </div>
        <nav className="flex flex-col items-center mt-10 gap-6 px-4">
          <a href="#" className="text-white text-lg" onClick={() => setMenuOpen(false)}>
            Gallery
          </a>
          <a href="#" className="text-white text-lg" onClick={() => setMenuOpen(false)}>
            Search
          </a>
          <a href="#" className="text-white text-lg" onClick={() => setMenuOpen(false)}>
            Upload
          </a>
        </nav>
      </div>
    </header>
  );
}