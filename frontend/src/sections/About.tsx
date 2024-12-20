"use client";

import { SectionHeader } from "@/components/SectionHeader";
import { Card } from "@/components/Card";
import { CardHeader } from "@/components/CardHeader";
import { ToolboxItems } from "@/components/ToolboxItems";
import { motion } from "framer-motion";
import { useRef } from "react";
import Image from "next/image";
import JavaScriptIcon from "@/assets/square-js.svg";
import PythonIcon from "@/assets/python-5.svg";
import FlaskIcon from "@/assets/Flask.svg";
import ReactIcon from "@/assets/react.svg";
import VercelIcon from "@/assets/vercel.svg";
import GitHubIcon from "@/assets/github.svg";
import mapImage from "@/assets/India.jpeg";

const toolboxItems = [
    {
        title: 'JavaScript',
        iconType: JavaScriptIcon,
    },
    {
        title: 'Python',
        iconType: PythonIcon,
    },
    {
        title: 'Flask',
        iconType: FlaskIcon,
    },
    {
        title: 'React',
        iconType: ReactIcon,
    },
    {
        title: 'Vercel',
        iconType: VercelIcon,
    },
    {
        title: 'GitHub',
        iconType: GitHubIcon,
    },
]

const features = [
    {
        title: 'Emotion Detection',
        emoji: '😊',
        left: '5%',
        top: '5%',
    },
    {
        title: 'Object Detection',
        emoji: '🔍',
        left: '50%',
        top: '5%',
    },
    {
        title: 'Contextual Analysis',
        emoji: '🔗',
        left: '35%',
        top: '40%',
    },
    {
        title: 'Automated Captioning',
        emoji: '📝',
        left: '10%',
        top: '35%',
    },
    {
        title: 'Key-Point Detection',
        emoji: '📌',
        left: '70%',
        top: '40%',
    },
    {
        title: 'Image Segmentation',
        emoji: '✂️',
        left: '5%',
        top: '65%',
    },
    {
        title: 'Panoptic Segmentation',
        emoji: '🌐',
        left: '45%',
        top: '70%',
    },
]

export default function AboutSection() {
    const constraintRef = useRef(null);
    return (
        <div className="py-16">
            <div className="container">
                <SectionHeader
                    eyebrow="About Us"
                    title="Your Visuals, Our Descriptions Seamlessly Aligned."
                    description="Where Vision Meets Verbal Precision. From Images to Insights, Effortlessly."
                />
                <div className="mt-20 flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:grid-cols-3">
                        <Card className="h-[320px] md:col-span-2 lg:col-span-1">
                            <CardHeader title="Our Features" description="Discover the cutting-edge features that drive our project." />
                        </Card>
                        <Card className="h-[320px] p-0 md:col-span-3 lg:col-span-2">
                            <CardHeader
                                title="Tech Stack"
                                description="Explore the technologies and tools used to craft exceptional descriptions."
                                className="px-6 pt-6"
                            />
                            <ToolboxItems toolboxItems={toolboxItems} className="mt-6" itemWrapperClassName="animate-move-left [animation-duration:30s]" />
                            <ToolboxItems toolboxItems={toolboxItems} className="mt-6" itemWrapperClassName="animate-move-right [animation-duration:15s]" />
                        </Card>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-5 gap-8 lg:grid-cols-3">
                        <Card className="h-[320px] p-0 flex flex-col md:col-span-3 lg:col-span-2">
                            <CardHeader title="One Description, Endless Parameters" description="Decoding every image with precision, powered by AI's limitless insights." className="px-6 pt-6" />
                            <div className="relative flex-1" ref={constraintRef}>
                                {features.map(feature => (
                                    <motion.div key={feature.title} className="inline-flex items-center gap-2 px-6 bg-gradient-to-r from-emerald-300 to-sky-400 rounded-full py-1.5 absolute"
                                        style={{
                                            left: feature.left,
                                            top: feature.top,
                                        }}
                                        drag
                                        dragConstraints={constraintRef}
                                    >
                                        <span className="text-gray-950 font-medium">{feature.title}</span>
                                        <span>{feature.emoji}</span>
                                    </motion.div>
                                ))}
                            </div>
                        </Card>
                        <Card className="h-[320px] p-0 relative md:col-span-2 lg:col-span-1">
                            <Image src={mapImage} alt="Map" className="h-full w-full object-cover object-left-top" />
                            <div className="absolute bottom-1/4 left-1/2 -translate-x-1/2 -translate-y-2/4 size-5 rounded-full after:content-[''] after:absolute after:inset-0 after:outline after:outline-2 after:-outline-offset-2 after:rounded-full after:outline-gray-950/30">
                                <div className="absolute inset-0 rounded-full bg-gradient-to-r from-emerald-300 to-sky-400 -z-20 animate-ping [animation-duration:2s]"></div>
                                <div className="absolute inset-0 rounded-full bg-emerald-300 -z-10"></div>
                            </div>
                        </Card>
                    </div>
                </div>
            </div>
        </div>
    );
};