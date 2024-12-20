import LogoIcon from "@/assets/logo.png";
import Image from 'next/image';
//import XSocial from "../assets/social-x.svg";
//import InstaSocial from "../assets/social-instagram.svg";
//import YTSocial from "../assets/social-youtube.svg";

export default function Footer() {
    return (
        <footer className="py-5 border-t border-white/15">
            <div className="container">
                <div className="flex flex-col lg:flex-row lg:items-center gap-6">
                    <div className="flex gap-2 items-center lg:flex-1">
                        <Image src={LogoIcon.src} alt="Logo" width={32} height={32} className="w-8 h-8" />
                        <div className="tracking-tight text-white/70">Jadoo.ai</div>
                    </div>
                    <nav className="flex flex-col lg:flex-row gap-5 lg:gap-7 lg:flex-1 lg:justify-center lg:items-center">
                        <a href="https://www.youtube.com/shorts/hQD6yXoGSbg" className="text-white/70 hover:text-white transition tracking-tight">Wanna get Surprised?</a>
                    </nav>
                    <div className="flex flex-row gap-5 lg:flex-1 lg:justify-end">
                        <p className="text-white/70 tracking-tight">Team Raptors</p>
                    </div>
                </div>
            </div>
        </footer>
    );
};