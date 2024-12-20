import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import Model from "@/sections/Model";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import Picture from "@/sections/Picture";
import SearchImage from "@/sections/Search";
import TapeSection from "@/sections/Tape";
import AboutSection from "@/sections/About";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <TapeSection />
      <Picture />
      <SearchImage />
      <AboutSection />
      <Model />
      <InfiniteScroll />
      <Footer />
    </div>
  );
}
