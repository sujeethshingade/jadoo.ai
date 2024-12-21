import Navbar from "@/sections/Navbar";
import Footer from "@/sections/Footer";
import InfiniteScroll from "@/sections/InfiniteScroll";
import Chats from "@/sections/Chats";

export default function Home() {
  return (
    <>
      <Navbar />
      <Chats />
      <InfiniteScroll />
      <Footer />
    </>
  );
}