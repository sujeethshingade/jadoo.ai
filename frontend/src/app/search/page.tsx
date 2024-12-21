import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import SearchImage from "@/sections/Search";

export default function Home() {
  return (
    <div>
      <Navbar />
      <SearchImage />
      <InfiniteScroll />
      <Footer />
    </div>
  );
}
