import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import Picture from "@/sections/Picture";

export default function Home() {
    return (
        <div>
            <Navbar />
            <Picture />
            <InfiniteScroll />
            <Footer />
        </div>
    );
}
