"use client";

import Image from 'next/image';
import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';
import { supabase } from "@/lib/supabase";

interface GalleryImage {
    id: string;
    url: string;
    signedUrl?: string;
    tags?: string;
}

export default function Gallery() {
    const [galleryImages, setGalleryImages] = useState<GalleryImage[]>([]);

    useEffect(() => {
        const fetchGalleryImages = async () => {
            try {
                const { data, error } = await supabase
                    .from("images")
                    .select("*")
                    .or('tags.ilike.%paris%,tags.ilike.%wine%,tags.ilike.%food%,tags.ilike.%zuck%');

                if (error) throw error;

                if (data) {
                    const imageUrls = await Promise.all(
                        data.map(async (image: GalleryImage) => {
                            const { data: urlData } = await supabase.storage
                                .from("image-store")
                                .createSignedUrl(image.url, 3600);
                            return {
                                ...image,
                                signedUrl: urlData?.signedUrl || image.url,
                            };
                        })
                    );
                    setGalleryImages(imageUrls);
                }
            } catch (err) {
                console.error('Error fetching gallery images:', err);
            }
        };

        fetchGalleryImages();
    }, []);

    return (
        <section className="py-12">
            <div className="container">
                <h2 className="text-4xl text-center tracking-tighter">
                Discover Images Easily: Just Type a Keyword!
                </h2>
                <div className='flex overflow-hidden mt-6 [mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]'>
                    <motion.div
                        initial={{ translateX: '-50%' }}
                        animate={{ translateX: '0%' }}
                        transition={{ duration: 60, repeat: Infinity, ease: 'linear' }}
                        className="flex flex-none py-2 pr-5"
                    >
                        {galleryImages.map((image, index) => (
                            <div
                                key={`${image.id}-${index}`}
                                className="relative w-[300px] h-[200px] mx-2.5 rounded-md overflow-hidden"
                            >
                                <Image
                                    src={image.signedUrl || image.url}
                                    alt={`Gallery image ${index + 1}`}
                                    fill
                                    className="object-cover"
                                    priority={index < 4}
                                />
                            </div>
                        ))}
                    </motion.div>
                </div>
            </div>
        </section>
    );
}