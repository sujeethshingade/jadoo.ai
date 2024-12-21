import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import Model from "@/sections/Model";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import TapeSection from "@/sections/Tape";
import AboutSection from "@/sections/About";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <TapeSection />
      <AboutSection />
      <Model />
      <InfiniteScroll />
      <Footer />
    </div>
  );
}
