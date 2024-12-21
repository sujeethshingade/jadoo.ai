import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import Picture from "@/sections/Picture";
import SearchImage from "@/sections/Search";

export default function Home() {
    return (
        <div>
            <Navbar />
            <Picture />
            <SearchImage />
            <InfiniteScroll />
            <Footer />
        </div>
    );
}
