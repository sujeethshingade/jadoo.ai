"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Heart, ArrowDown, X } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Image {
  id: string;
  url: string;
  uri?: string;
  signedUrl?: string;
  description?: string;
  tags?: string;
  likes?: number;
}

const SearchImage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false);
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState("");
  const { user } = useAuth();
  const [likedImages, setLikedImages] = useState<{ [key: string]: boolean }>({});
  const [isDownloading, setIsDownloading] = useState(false);

  useEffect(() => {
    if (user && images.length > 0) {
      images.forEach((image) => {
        checkIfUserLiked(image);
      });
    }
  }, [images, user]);

  const checkIfUserLiked = async (image: Image) => {
    if (!user?.id || !image.id) {
      setLikedImages((prev) => ({ ...prev, [image.id]: false }));
      return;
    }

    try {
      const { data, error, status } = await supabase
        .from("likes")
        .select("*")
        .eq("user_id", user.id)
        .eq("image_id", image.id)
        .maybeSingle();

      if (error && status !== 406) {
        console.error("Error checking like status:", error);
        setLikedImages((prev) => ({ ...prev, [image.id]: false }));
        return;
      }

      setLikedImages((prev) => ({ ...prev, [image.id]: !!data }));
    } catch (err: any) {
      console.error("Error checking like status:", err.message || err);
      setLikedImages((prev) => ({ ...prev, [image.id]: false }));
    }
  };

  const handleImageClick = async (image: Image) => {
    setSelectedImage(image);
  };

  const handleDownloadImage = async () => {
    if (!selectedImage?.signedUrl) {
      toast.error("Download URL not available");
      return;
    }

    setIsDownloading(true);
    try {
      const response = await fetch(selectedImage.signedUrl);
      if (!response.ok) throw new Error('Download failed');

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `image-${selectedImage.id}.jpg`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Image downloaded successfully");
    } catch (error) {
      console.error('Error downloading image:', error);
      toast.error("Failed to download image");
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadDescription = () => {
    if (!selectedImage?.description) {
      toast.error("No description available");
      return;
    }

    try {
      const blob = new Blob([selectedImage.description], { type: 'text/plain' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `description-${selectedImage.id}.txt`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
      toast.success("Description downloaded successfully");
    } catch (error) {
      console.error('Error downloading description:', error);
      toast.error("Failed to download description");
    }
  };

  const handleSearch = async () => {
    setNoResultsMessage("");
    setHasSearched(true);
    if (!searchQuery.trim()) {
      return;
    }
    setIsLoading(true);

    try {
      const { data, error } = await supabase
        .from("images")
        .select("*")
        .ilike("tags", `%${searchQuery}%`);

      if (error) throw error;

      if (!data || data.length === 0) {
        setNoResultsMessage(`No images found for "${searchQuery}"`);
        setImages([]);
        return;
      }

      const imageUrls = await Promise.all(
        data.map(async (image: Image) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from("image-store")
            .createSignedUrl(image.url, 3600);

          if (urlError) {
            console.error("Error generating signed URL:", urlError);
            return {
              ...image,
              signedUrl: image.url,
              likes: image.likes ?? 0,
            };
          }

          return {
            ...image,
            signedUrl: urlData?.signedUrl || image.url,
            likes: image.likes ?? 0,
          };
        })
      );

      setImages(imageUrls);
    } catch (err: any) {
      console.error("Error searching images:", err.message || err);
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLikeToggle = async () => {
    if (!selectedImage || !user?.id) {
      return;
    }

    const imageId = selectedImage.id;
    if (!imageId) {
      console.error("Selected image ID is undefined.");
      return;
    }

    setIsLiking(true);
    const isCurrentlyLiked = likedImages[imageId];

    try {
      if (isCurrentlyLiked) {
        const { error: unlikeError } = await supabase
          .from("likes")
          .delete()
          .eq("user_id", user.id)
          .eq("image_id", imageId);

        if (unlikeError) throw unlikeError;

        const { data, error: updateError } = await supabase
          .from("images")
          .update({ likes: Math.max((selectedImage.likes ?? 1) - 1, 0) })
          .eq("id", imageId)
          .select()
          .single();

        if (updateError) throw updateError;

        setSelectedImage({ ...selectedImage, likes: data.likes });
        setLikedImages((prev) => ({ ...prev, [imageId]: false }));
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, likes: data.likes } : img
          )
        );
      } else {
        const { error: likeError } = await supabase
          .from("likes")
          .insert([{ user_id: user.id, image_id: imageId }]);

        if (likeError) {
          if (likeError.code === "23505") {
            setLikedImages((prev) => ({ ...prev, [imageId]: true }));
            return;
          }
          throw likeError;
        }

        const { data, error: updateError } = await supabase
          .from("images")
          .update({ likes: (selectedImage.likes ?? 0) + 1 })
          .eq("id", imageId)
          .select()
          .single();

        if (updateError) throw updateError;

        setSelectedImage({ ...selectedImage, likes: data.likes });
        setLikedImages((prev) => ({ ...prev, [imageId]: true }));
        setImages((prev) =>
          prev.map((img) =>
            img.id === imageId ? { ...img, likes: data.likes } : img
          )
        );
      }
    } catch (err: any) {
      console.error("Error toggling like:", err.message || err);
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <div className="container py-16">
      <div className="space-y-6">
        {user ? (
          <>
            <div className="flex gap-2 justify-center">
              <Input
                type="text"
                placeholder="Search images..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onKeyPress={(e) => e.key === "Enter" && handleSearch()}
                className="text-white border border-white/10 rounded-md"
              />
              <Button
                onClick={handleSearch}
                disabled={isLoading}
                className="flex items-center gap-2 border border-white/10 bg-transparent hover:bg-white/15 rounded-md transition duration-300"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Search className="w-4 h-4" />
                )}
                Search
              </Button>
            </div>

            {noResultsMessage && <p className="text-center">{noResultsMessage}</p>}

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {images.map((image) => (
                <div key={image.id} className="relative">
                  <img
                    src={image.signedUrl || image.url}
                    alt={`Image ${image.id}`}
                    className="w-full h-auto rounded-md cursor-pointer"
                    onClick={() => handleImageClick(image)}
                  />
                  <div className="absolute top-2 left-2">
                    <div className="relative">
                      <div className="absolute inset-0 rounded-full opacity-50"></div>
                      <Button
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedImage(image);
                          handleLikeToggle();
                        }}
                        className="p-2 bg-transparent relative"
                        aria-label={`Likes: ${image.likes}`}
                      >
                        <Heart
                          className={`w-6 h-6 ${likedImages[image.id]
                              ? "text-red-500 fill-red-500"
                              : "stroke-white fill-none"
                            }`}
                        />
                      </Button>
                    </div>
                    <span className="absolute top-10 left-0 w-full text-center text-white text-sm">
                      {image.likes ?? 0}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {selectedImage && (
              <div className="fixed inset-0 z-50 flex items-center justify-center">
                <Card className="bg-gray-950 w-full max-w-7xl mx-auto border border-white/10 rounded-md m-4">
                  <div className="flex flex-col md:flex-row gap-6 p-4 relative max-h-[90vh]">
                    {/* Top right corner buttons */}
                    <div className="absolute top-4 right-6 flex gap-1 z-10">
                      <Button
                        onClick={() => { handleDownloadImage(); handleDownloadDescription(); }}
                        disabled={isDownloading}
                        className="p-2 bg-transparent hover:bg-transparent rounded-full"
                        title="Download Image"
                      >
                        {isDownloading ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <ArrowDown className="w-5 h-5 text-white" />
                        )}
                      </Button>

                      <Button
                        onClick={() => setSelectedImage(null)}
                        className="p-2 bg-transparent hover:bg-transparent rounded-full"
                        title="Close"
                      >
                        <X className="w-5 h-5 text-white" />
                      </Button>
                    </div>

                    <ScrollArea className="w-full md:w-3/5 h-[50vh] md:h-[80vh] relative">
                      <div className="h-full flex items-center justify-center">
                        <img
                          src={selectedImage.signedUrl || selectedImage.url}
                          alt={`Image ${selectedImage.id}`}
                          className="max-w-full max-h-full rounded-md object-contain"
                        />
                        <div className="absolute top-2 left-2">
                          <div className="relative">
                            <div className="absolute inset-0 rounded-full opacity-50"></div>
                            <Button
                              onClick={handleLikeToggle}
                              className="p-2 bg-transparent relative"
                              aria-label={likedImages[selectedImage.id] ? "Unlike" : "Like"}
                              disabled={isLiking}
                            >
                              <Heart
                                className={`w-6 h-6 ${likedImages[selectedImage.id]
                                    ? "text-red-500 fill-red-500"
                                    : "stroke-white fill-none"
                                  }`}
                              />
                            </Button>
                          </div>
                          <span className="block text-white text-sm mt-1 text-center">
                            {selectedImage.likes ?? 0}
                          </span>
                        </div>
                      </div>
                    </ScrollArea>

                    <div className="w-full md:w-2/5 flex flex-col">
                      <ScrollArea className="h-[30vh] md:h-[80vh] overflow-auto">
                        <div className="p-4 text-white">
                          <ReactMarkdown className="prose prose-invert">
                            {selectedImage.description ?? "No description available"}
                          </ReactMarkdown>
                        </div>
                      </ScrollArea>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </>
        ) : (
          <div className="text-white text-xl text-center p-4">Please login to proceed.</div>
        )}
      </div>
    </div>
  );
};

export default SearchImage;