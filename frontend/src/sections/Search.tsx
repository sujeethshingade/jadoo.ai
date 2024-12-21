"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Heart, ArrowDown, X, MessageCircle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";

interface Image {
  id: string;
  url: string;
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
  const [isDownloading, setIsDownloading] = useState(false);
  const [likedImages, setLikedImages] = useState<{ [key: string]: boolean }>({});

  const { user } = useAuth();
  const router = useRouter();

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

          if (urlError || !urlData?.signedUrl) {
            console.error("Error generating signed URL:", urlError);
            return {
              ...image,
              signedUrl: image.url.startsWith("http") ? image.url : `${process.env.NEXT_PUBLIC_SUPABASE_URL}/storage/v1/object/public/image-store/${image.url}`,
              likes: image.likes ?? 0,
            };
          }

          return {
            ...image,
            signedUrl: urlData.signedUrl,
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
    if (!selectedImage || !user?.id) return;

    const imageId = selectedImage.id;
    if (!imageId) return;

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

  const handleImageClick = (image: Image) => {
    setSelectedImage(image);
  };

  const handleChatRedirect = () => {
    if (selectedImage) {
      sessionStorage.setItem('chatImage', JSON.stringify({
        url: selectedImage.signedUrl || selectedImage.url,
        description: selectedImage.description || ""
      }));
      router.push('/chat');
    }
  };

  const handleDownload = async () => {
    if (!selectedImage?.signedUrl) {
      toast.error("Download URL not available");
      return;
    }

    setIsDownloading(true);
    try {
      // Download image
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
      
      // Download description if available
      if (selectedImage.description) {
        const descBlob = new Blob([selectedImage.description], { type: 'text/plain' });
        const descUrl = window.URL.createObjectURL(descBlob);
        const descLink = document.createElement('a');
        descLink.href = descUrl;
        descLink.download = `description-${selectedImage.id}.txt`;
        document.body.appendChild(descLink);
        descLink.click();
        window.URL.revokeObjectURL(descUrl);
        document.body.removeChild(descLink);
      }

      toast.success("Download completed");
    } catch (error) {
      console.error('Error downloading:', error);
      toast.error("Failed to download");
    } finally {
      setIsDownloading(false);
    }
  };

  return (
    <div className="container py-16">
      <h2 className="text-4xl text-center mb-4 tracking-tighter">
        Find them out here!
      </h2>
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
                          className={`w-6 h-6 ${
                            likedImages[image.id]
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
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-transparent p-4">
                <Card className="bg-gray-950 w-full max-w-6xl mx-auto border border-white/10 rounded-md">
                  <div className="flex flex-col lg:flex-row gap-6 max-h-[90vh] overflow-auto">
                    {/* Image Section */}
                    <div className="w-full lg:w-3/5 flex flex-col gap-4">
                      <div className="relative aspect-video bg-transparent rounded-md overflow-hidden">
                        <img
                          src={selectedImage.signedUrl || selectedImage.url}
                          alt={`Image ${selectedImage.id}`}
                          className="w-full h-full object-contain"
                        />

                        {/* Like Button */}
                        <div className="absolute top-4 left-4">
                          <Button
                            onClick={handleLikeToggle}
                            className="bg-black/50 hover:bg-black/70 transition-colors p-2 rounded-full"
                            aria-label={
                              likedImages[selectedImage.id] ? "Unlike" : "Like"
                            }
                            disabled={isLiking}
                          >
                            <Heart
                              className={`w-6 h-6 ${
                                likedImages[selectedImage.id]
                                  ? "text-red-500 fill-red-500"
                                  : "stroke-white fill-none"
                              }`}
                            />
                            <span className="ml-2 text-white text-sm">
                              {selectedImage.likes ?? 0}
                            </span>
                          </Button>
                        </div>
                      </div>

                      {/* Tags */}
                      {selectedImage.tags && (
                        <div className="flex flex-wrap items-center gap-2 mb-4 ml-4 mt-4 lg:mb-0">
                          {selectedImage.tags.split(",").map((tag, i) => (
                            <div
                              key={i}
                              className="px-3 py-1 bg-white/10 rounded-full text-sm text-white/80"
                            >
                              {tag.trim()}
                            </div>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Description & Actions Section */}
                    <div className="w-full lg:w-2/5 flex flex-col gap-4">
                      {/* Action Buttons */}
                      <div className="flex justify-end gap-2 sticky top-0 bg-gray-950 pr-2 pb-2 pt-2 z-10">
                      <Button
                          onClick={handleChatRedirect}
                          className="flex items-center bg-white/10 hover:bg-white/20 transition-colors"
                          title="Chat"
                        >
                          <MessageCircle className="w-5 h-5" />
                          <span className="ml-2">Chat</span>
                        </Button>
                      <Button
                          onClick={handleDownload}
                          disabled={isDownloading}
                          className="bg-white/10 hover:bg-white/20 transition-colors"
                          title="Download"
                        >
                          {isDownloading ? (
                            <Loader2 className="w-5 h-5 animate-spin" />
                          ) : (
                            <>
                              <ArrowDown className="w-5 h-5" />
                              <span className="ml-2">Download</span>
                            </>
                          )}
                        </Button>
                        <Button
                          onClick={() => setSelectedImage(null)}
                          className="bg-white/10 hover:bg-white/20 transition-colors"
                          title="Close"
                        >
                          <X className="w-5 h-5" />
                        </Button>
                      </div>

                      {/* Description with Scroll */}
                      <ScrollArea className="flex-1 h-[300px] lg:h-[calc(90vh-200px)]">
                        <div className="p-4 text-white/90">
                          <ReactMarkdown className="prose prose-invert prose-sm">
                            {selectedImage.description ??
                              "No description available"}
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
          <div className="text-white text-xl text-center p-4">
            Please login to proceed.
          </div>
        )}
      </div>
    </div>
  );
};

export default SearchImage;
