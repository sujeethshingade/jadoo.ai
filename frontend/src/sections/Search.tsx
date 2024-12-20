"use client";

import React, { useState } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase"; // Adjust path as per your setup
import { useAuth } from "@/context/AuthContext";              // Adjust path as per your setup
import { Card } from "@/components/ui/card";       // Adjust imports as needed
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search } from "lucide-react";

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
  const { user } = useAuth();

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .ilike("tags", `%${searchQuery}%`);
      if (error) throw error;

      // Fetch signed URLs from the bucket if needed
      const imageUrls = await Promise.all(
        (data || []).map(async (image: Image) => {
          // If you need a signed URL from 'image-store'
          const { data: urlData } = await supabase.storage
            .from("image-store")
            .createSignedUrl(image.url, 3600);
          return {
            ...image,
            signedUrl: urlData?.signedUrl || image.url, // fallback to raw URL
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
        {user ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative aspect-square">
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70">
                <Card className="bg-gray-950 p-4 max-w-xl mx-auto border border-white/10 rounded-md">
                  <img
                    src={selectedImage.signedUrl || selectedImage.url}
                    alt={`Image ${selectedImage.id}`}
                    className="w-full h-auto rounded-md"
                  />
                  <p className="text-white mt-2">
                    <ReactMarkdown>
                      {selectedImage.description || ""}
                    </ReactMarkdown>
                  </p>
                  <Button
                    className="mt-4 text-white border border-white/10 hover:bg-white/10 bg-transparent rounded-md transition duration-300"
                    onClick={() => setSelectedImage(null)}
                  >
                    Close
                  </Button>
                </Card>
              </div>
            )}

            {!isLoading && images.length === 0 && searchQuery && (
              <p className="text-center text-gray-500">
                No images found for "{searchQuery}"
              </p>
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