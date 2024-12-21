import Navbar from "@/sections/Navbar";
import Chats from "@/sections/chats";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";

export default function Home() {
    return (
        <>
          <Navbar />
          <Chats />
          <InfiniteScroll />
          <Footer/>
          
        </>
      );
    }