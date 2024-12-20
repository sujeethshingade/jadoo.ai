import Navbar from "@/sections/Navbar";
import Hero from "@/sections/Hero";
import Model from "@/sections/Model";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import Picture from "@/sections/Picture";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Hero />
      <Picture />
      <Model />
      <InfiniteScroll />
      <Footer />
    </div>
  );
}
