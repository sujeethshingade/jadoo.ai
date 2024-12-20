"use client";

import { motion } from 'framer-motion';

export default function InfiniteScroll() {
    return (
        <div className="py-12 overflow-hidden">
            <div className="flex flex-1 items-center justify-between overflow-hidden">
                <motion.div
                    initial={{ translateX: '-50%' }}
                    animate={{ translateX: '0%' }}
                    transition={{ duration: 100, repeat: Infinity, ease: 'linear' }}
                    className="flex flex-none items-center justify-between whitespace-nowrap -translate-x-1/2">
                    <nav className='text-8xl md:text-[128px] font-bold text-white/10 mr-10 pb-4'>
                        <span>Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ </span>
                        <span>Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ </span>
                        <span>Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ </span>
                        <span>Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ Jadoo.ai ⭑ </span>
                    </nav>
                </motion.div>
            </div>
        </div>
    );
};