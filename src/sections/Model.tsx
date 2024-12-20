"use client";

import gridLines from "@/assets/grid-lines.png";
import Spline from "@splinetool/react-spline";
import { motion, useMotionTemplate, useMotionValue, useScroll, useTransform } from "framer-motion";
import { RefObject, useEffect, useRef } from "react";

const useRelativeMousePosition = (to: RefObject<HTMLElement | null>) => {
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const updateMousePosition = (event: MouseEvent) => {
    if (!to.current) return;
    const { top, left } = to.current.getBoundingClientRect();
    mouseX.set(event.x - left);
    mouseY.set(event.y - top);
  };
  useEffect(() => {
    window.addEventListener("mousemove", updateMousePosition);
    return () => {
      window.removeEventListener("mousemove", updateMousePosition);
    };
  }, []);
  return [mouseX, mouseY];
};

export default function Model() {
  const sectionRef = useRef<HTMLElement>(null);
  const borderedDivRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  const backgroundPositionY = useTransform(scrollYProgress, [0, 1], [-300, 300]);
  const [mouseX, mouseY] = useRelativeMousePosition(borderedDivRef);
  const maskImage = useMotionTemplate`radial-gradient(50% 50% at ${mouseX}px ${mouseY}px, black, transparent)`;

  return (
    <section ref={sectionRef}>
      <div className="container py-16">
        <div className="max-w-6xl mx-auto space-y-4">
          <motion.div
            className="border relative group min-h-[360px] md:min-h-[400px] border-white overflow-hidden"
            style={{
              backgroundPositionY,
            }}
          >
            <div
              className="absolute inset-0 bg-white/30 bg-blend-overlay [mask-image:radial-gradient(50%_50%_at_50%_50%,black,transparent)] group-hover:opacity-0 transition duration-700"
              style={{
              }}
            />
            <motion.div
              ref={borderedDivRef}
              className="absolute inset-0 bg-white/30 bg-blend-overlay opacity-0 group-hover:opacity-100 transition duration-700"
              style={{
                maskImage,
              }}
            />
            {/* Container for Spline model */}
            <div className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] flex items-center justify-center">
              <Spline
                scene="https://prod.spline.design/6nQvb7qQ3b8hFBQj/scene.splinecode"
                className="w-full h-full"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}