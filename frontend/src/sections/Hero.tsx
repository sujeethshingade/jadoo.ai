import ArrowDown from "@/assets/arrow-down.svg";
import grainImage from "@/assets/grain.jpg";
import StarIcon from "@/assets/star.svg";
import SparkleIcon from "@/assets/sparkle.svg";
import { HeroOrbit } from "@/components/HeroOrbit";

export default function Hero() {
    return (
        <div className="py-32 md:py-48 lg:py-60 relative z-0 overflow-x-clip">
            <div className="absolute inset-0 [mask-image:linear-gradient(to_bottom,transparent,black_20%,black_70%,transparent)]">
                <div className="absolute inset-0 -z-30 opacity-5" style={{
                    backgroundImage: `url(${grainImage.src})`,
                }}>
                </div>
                <div className="size-[620px] hero-ring"></div>
                <div className="size-[820px] hero-ring"></div>
                <div className="size-[1020px] hero-ring"></div>
                <div className="size-[1220px] hero-ring"></div>
                <div className="size-[1420px] hero-ring"></div>
                <HeroOrbit size={800} rotation={-72} shouldOrbit orbitDuration="48s" shouldSpin spinDuration="10s">
                    <StarIcon className="size-28 text-emerald-300" />
                </HeroOrbit>
                <HeroOrbit size={550} rotation={20} shouldOrbit orbitDuration="38s" shouldSpin spinDuration="10s">
                    <StarIcon className="size-12 text-emerald-300" />
                </HeroOrbit>
                <HeroOrbit size={590} rotation={98} shouldOrbit orbitDuration="40s" shouldSpin spinDuration="10s">
                    <StarIcon className="size-8 text-emerald-300" />
                </HeroOrbit>
                <HeroOrbit size={430} rotation={-14} shouldOrbit orbitDuration="30s" shouldSpin spinDuration="30s">
                    <SparkleIcon className="size-8 text-emerald-300/20" />
                </HeroOrbit>
                <HeroOrbit size={440} rotation={79} shouldOrbit orbitDuration="32s" shouldSpin spinDuration="30s">
                    <SparkleIcon className="size-5 text-emerald-300/20" />
                </HeroOrbit>
                <HeroOrbit size={530} rotation={178} shouldOrbit orbitDuration="36s" shouldSpin spinDuration="30s">
                    <SparkleIcon className="size-10 text-emerald-300/20" />
                </HeroOrbit>
                <HeroOrbit size={710} rotation={144} shouldOrbit orbitDuration="44s" shouldSpin spinDuration="30s">
                    <SparkleIcon className="size-14 text-emerald-300/20" />
                </HeroOrbit>
                <HeroOrbit size={720} rotation={85} shouldOrbit orbitDuration="46s">
                    <div className="size-3 rounded-full bg-emerald-300/20"></div>
                </HeroOrbit>
                <HeroOrbit size={520} rotation={-41} shouldOrbit orbitDuration="34s">
                    <div className="size-2 rounded-full bg-emerald-300/20"></div>
                </HeroOrbit>
                <HeroOrbit size={650} rotation={-5} shouldOrbit orbitDuration="42s">
                    <div className="size-2 rounded-full bg-emerald-300/20"></div>
                </HeroOrbit>
            </div>
            <div className="container">
                <div className="flex flex-col items-center">
                </div>
                <div className="max-w-lg mx-auto">
                    <h1 className="font-serif text-3xl md:text-5xl text-center mt-8 tracking-wide">
                    Unveiling Stories Behind Every Pixel.
                    </h1>
                    <p className="mt-4 text-center text-white/60 md:text-lg">
                    Discover the Power of AI-Driven Image Descriptions.
                    </p>
                </div>
            </div>
        </div>
    );
};
