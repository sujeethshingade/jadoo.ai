import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import SearchImage from "@/sections/Search";
import Gallery from "@/sections/Gallery";

export default function Home() {
  return (
    <div>
      <Navbar />
      <Gallery />
      <SearchImage />
      <InfiniteScroll />
      <Footer />
    </div>
  );
}
