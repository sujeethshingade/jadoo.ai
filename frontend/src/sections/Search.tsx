"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area"

interface Image {
    id: string;
    url: string;
    uri?: string;
    signedUrl?: string;
    description?: string;
    tags?: string;
}

const SearchImage = () => {
    const [searchQuery, setSearchQuery] = useState("");
    const [images, setImages] = useState<Image[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    const [selectedImage, setSelectedImage] = useState<Image | null>(null);
    const [hasSearched, setHasSearched] = useState(false);
    const [noResultsMessage, setNoResultsMessage] = useState("");
    const { user } = useAuth();

    const handleImageClick = (image: Image) => {
        setSelectedImage(image);
    };

    const handleSearch = async () => {
        setNoResultsMessage("");
        setHasSearched(true);
        if (!searchQuery.trim()) return;
        setIsLoading(true);

        try {
            const { data, error } = await supabase
                .from("images")
                .select("*")
                .ilike("tags", `%${searchQuery}%`);
            if (error) throw error;

            if (!data || data.length === 0) {
                setNoResultsMessage(`No images found for "${searchQuery}"`);                setIsLoading(false);
                return;
            }

            const imageUrls = await Promise.all(
                (data || []).map(async (image: Image) => {
                    const { data: urlData } = await supabase.storage
                        .from("image-store")
                        .createSignedUrl(image.url, 3600);
                    return {
                        ...image,
                        signedUrl: urlData?.signedUrl || image.url,
                    };
                })
            );

            setImages(imageUrls);
        } catch (err) {
            console.error("Error searching images:", err);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <div className="container py-16">
            <div className="space-y-6">
                {/* Search Input */}
                <div className="flex gap-4">
                    <Input
                        type="text"
                        placeholder="Search images..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                        className="flex-1 text-white border border-white/10 rounded-md"
                    />
                    <Button
                        onClick={handleSearch}
                        disabled={isLoading}
                        className="flex items-center gap-2 border border-white/10 bg-transparent hover:bg-white/15 rounded-md transition duration-300"
                    >
                        {isLoading ? (
                            <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                            <div className="w-4 h-4">
                                <Search />
                            </div>
                        )}
                        Search
                    </Button>
                </div>

                {/* Search Results */}
                {noResultsMessage && <p className="text-center">{noResultsMessage}</p>}
                {user ? (
                    <>
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                            {images.map((image) => (
                                <div key={image.id} className="relative">
                                    <img
                                        src={image.signedUrl || image.url}
                                        alt={`Image ${image.id}`}
                                        className="w-full h-auto rounded-md"
                                        onClick={() => handleImageClick(image)}
                                    />
                                </div>
                            ))}
                        </div>

                        {selectedImage && (
                            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80">
                                <Card className="bg-gray-950 w-full max-w-7xl mx-auto border border-white/10 rounded-lg m-4">
                                    <div className="flex flex-col md:flex-row gap-6 p-4 relative max-h-[90vh]">
                                        {/* Image Container - Mobile: 50vh, Desktop: 80vh */}
                                        <ScrollArea className="w-full md:w-3/5 h-[50vh] md:h-[80vh]">
                                            <div className="h-full flex items-center justify-center">
                                                <img
                                                    src={selectedImage.signedUrl || selectedImage.url}
                                                    alt={`Image ${selectedImage.id}`}
                                                    className="max-w-full max-h-full rounded-lg object-contain"
                                                />
                                            </div>
                                        </ScrollArea>

                                        {/* Description Container - Mobile: 30vh, Desktop: 80vh */}
                                        <div className="w-full md:w-2/5 flex flex-col">
                                            <ScrollArea className="h-[30vh] md:h-[80vh]">
                                                <div className="p-4">
                                                    <ReactMarkdown className="text-white prose prose-invert">
                                                        {selectedImage.description || "No description available"}
                                                    </ReactMarkdown>
                                                </div>
                                            </ScrollArea>

                                            <Button
                                                className="mt-4 text-white border border-white/10 hover:bg-white/10 
                                 bg-transparent rounded-md transition duration-300 w-full md:w-auto"
                                                onClick={() => setSelectedImage(null)}
                                            >
                                                Close
                                            </Button>
                                        </div>

                                        <button
                                            className="absolute top-2 right-2 md:hidden text-white/60 hover:text-white"
                                            onClick={() => setSelectedImage(null)}
                                        >
                                            <span className="sr-only">Close</span>
                                        </button>
                                    </div>
                                </Card>
                            </div>
                        )}
                    </>
                ) : (
                    <div className="text-white text-center p-8">
                        Please log in to view search results.
                    </div>
                )}
            </div>
        </div>
    );
};

export default SearchImage;