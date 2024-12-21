"use client";

import React, { useState, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/lib/supabase";
import { useAuth } from "@/context/AuthContext";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2, Search, Heart } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast, ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

interface Image {
  id: string;
  url: string;
  uri?: string;
  signedUrl?: string;
  description?: string;
  tags?: string;
  likes?: number; // Total number of likes
}

const SearchImage = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isLiking, setIsLiking] = useState(false); // Track like operation loading
  const [selectedImage, setSelectedImage] = useState<Image | null>(null);
  const [hasSearched, setHasSearched] = useState(false);
  const [noResultsMessage, setNoResultsMessage] = useState("");
  const { user } = useAuth();
  // Map to track like status per image
  const [likedImages, setLikedImages] = useState<{ [key: string]: boolean }>({});

  useEffect(() => {
    // Check like status for all images on initial load
    if (user && images.length > 0) {
      images.forEach((image) => {
        checkIfUserLiked(image);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [images, user]);

  // Function to check if the user has already liked the image
  const checkIfUserLiked = async (image: Image) => {
    if (!user || !user.id) {
      console.warn("User is not authenticated properly.");
      setLikedImages((prev) => ({ ...prev, [image.id]: false }));
      return;
    }

    if (!image.id) {
      console.warn("Image ID is undefined.");
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

      if (error && status !== 406) { // 406 Not Acceptable corresponds to "No rows found"
        console.error("Error checking like status:", error);
        toast.error("Failed to check like status. Please try again.");
        setLikedImages((prev) => ({ ...prev, [image.id]: false }));
        return;
      }

      setLikedImages((prev) => ({ ...prev, [image.id]: !!data }));
      console.log(`Has liked status for image ${image.id}:`, !!data);
    } catch (err: any) {
      console.error("Error checking like status:", err.message || err);
      toast.error("An unexpected error occurred.");
      setLikedImages((prev) => ({ ...prev, [image.id]: false }));
    }
  };

  // Handle selecting an image to view in a modal
  const handleImageClick = async (image: Image) => {
    setSelectedImage(image);
  };

  // Handle searching images by tags from Supabase
  const handleSearch = async () => {
    setNoResultsMessage("");
    setHasSearched(true);
    if (!searchQuery.trim()) {
      toast.warning("Please enter a search query.");
      return;
    }
    setIsLoading(true);

    try {
      // Fetch images by matching tags
      const { data, error } = await supabase
        .from("images")
        .select("*") // Ensure this includes the 'likes' column
        .ilike("tags", `%${searchQuery}%`);

      if (error) {
        throw error;
      }

      if (!data || data.length === 0) {
        setNoResultsMessage(`No images found for "${searchQuery}"`);
        setImages([]);
        return;
      }

      // Generate signed URLs
      const imageUrls = await Promise.all(
        data.map(async (image: Image) => {
          const { data: urlData, error: urlError } = await supabase.storage
            .from("image-store")
            .createSignedUrl(image.url, 3600);

          if (urlError) {
            console.error("Error generating signed URL:", urlError);
            return {
              ...image,
              signedUrl: image.url, // Fallback to original URL
              likes: image.likes ?? 0, // Preserve likes if available
            };
          }

          return {
            ...image,
            signedUrl: urlData?.signedUrl || image.url,
            likes: image.likes ?? 0, // Preserve likes if available
          };
        })
      );

      setImages(imageUrls);
    } catch (err: any) {
      console.error("Error searching images:", err.message || err);
      toast.error("Failed to search images. Please try again.");
      setImages([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle incrementing likes for the selected image
  const handleLike = async () => {
    if (!selectedImage || !user || !user.id) {
      toast.error("You must be logged in to like images.");
      return;
    }

    const imageId = selectedImage.id;

    if (likedImages[imageId]) {
      toast.info("You have already liked this image.");
      return; // Prevent multiple likes
    }

    // Debugging: Log user and image IDs
    console.log("Attempting to like image with ID:", imageId);
    console.log("Logged in user ID:", user.id);

    if (!imageId) {
      console.error("Selected image ID is undefined.");
      toast.error("Cannot like the image. Invalid image ID.");
      return;
    }

    setIsLiking(true);

    try {
      // Insert into 'likes' table
      const { data: likeData, error: likeError, status: likeStatus } = await supabase
        .from("likes")
        .insert([
          {
            user_id: user.id, // Using user.id from Auth
            image_id: imageId,
          },
        ]);

      if (likeError) {
        console.error("Error inserting like:", likeError);
        if (likeError.code === "23505") { // Unique violation
          console.warn("User has already liked this image.");
          toast.info("You have already liked this image.");
          setLikedImages((prev) => ({ ...prev, [imageId]: true }));
        } else {
          toast.error("Failed to like the image. Please try again.");
        }
        return;
      }

      // Log successful like insertion
      console.log("Like inserted successfully:", likeData);

      // Update the 'likes' count in 'images' table
      const { data, error, status } = await supabase
        .from("images")
        .update({ likes: (selectedImage.likes ?? 0) + 1 })
        .eq("id", imageId)
        .select()
        .single();

      if (error) {
        console.error("Error updating image likes:", error);
        toast.error("Failed to update like count. Please try again.");
        return;
      }

      // Log successful image update
      console.log("Image updated successfully:", data);

      // Update local state with new like count and like status
      setSelectedImage({ ...selectedImage, likes: data.likes });
      setLikedImages((prev) => ({ ...prev, [imageId]: true }));
      // Update the images list as well
      setImages((prev) =>
        prev.map((img) =>
          img.id === imageId ? { ...img, likes: data.likes } : img
        )
      );
      toast.success("You liked this image!");
    } catch (err: any) {
      console.error("Error liking image:", err.message || err);
      toast.error("An unexpected error occurred while liking the image.");
    } finally {
      setIsLiking(false);
    }
  };

  return (
    <>
      <ToastContainer />
      <div className="container py-16">
        <div className="space-y-6">
          {user ? (
            <>
              {/* Search Input */}
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
                    <div className="w-4 h-4">
                      <Search />
                    </div>
                  )}
                  Search
                </Button>
              </div>

              {/* No Results Message */}
              {noResultsMessage && <p className="text-center">{noResultsMessage}</p>}

              {/* Image Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {images.map((image) => (
                  <div key={image.id} className="relative">
                    <img
                      src={image.signedUrl || image.url}
                      alt={`Image ${image.id}`}
                      className="w-full h-auto rounded-md cursor-pointer"
                      onClick={() => handleImageClick(image)}
                    />
                    {/* Like Symbol on Top Left Corner */}
                    <div className="absolute top-2 left-2">
                      <Button
                        onClick={() => handleImageClick(image)} // Open modal
                        className="p-1 bg-transparent"
                        aria-label={`Likes: ${image.likes}`}
                      >
                        <Heart
                          className={`w-6 h-6 ${
                            likedImages[image.id]
                              ? "bg-gradient-to-r from-blue-900 to-emerald-500 text-transparent bg-clip-text fill-current"
                              : "stroke-white fill-none"
                          }`}
                        />
                      </Button>
                      {/* Number of Likes Below the Like Symbol */}
                      <span className="absolute top-8 left-0 w-full text-center text-white text-sm">
                        {image.likes ?? 0}
                      </span>
                    </div>
                  </div>
                ))}
              </div>

              {/* Modal for Selected Image */}
              {selectedImage && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
                  <Card className="bg-gray-950 w-full max-w-7xl mx-auto border border-white/10 rounded-lg m-4">
                    <div className="flex flex-col md:flex-row gap-6 p-4 relative max-h-[90vh]">
                      {/* Image Display */}
                      <ScrollArea className="w-full md:w-3/5 h-[50vh] md:h-[80vh] relative">
                        <div className="h-full flex items-center justify-center">
                          <img
                            src={selectedImage.signedUrl || selectedImage.url}
                            alt={`Image ${selectedImage.id}`}
                            className="max-w-full max-h-full rounded-lg object-contain"
                          />
                          {/* Like Symbol on Top Left Corner of Modal Image */}
                          <div className="absolute top-2 left-2">
                            <Button
                              onClick={handleLike}
                              className={`p-1 bg-transparent focus:outline-none`}
                              aria-label={likedImages[selectedImage.id] ? "Liked" : "Like"}
                              disabled={isLiking || likedImages[selectedImage.id]} // Disable while liking or already liked
                            >
                              <Heart
                                className={`w-6 h-6 ${
                                  likedImages[selectedImage.id]
                                    ? " text-white bg-clip-text fill-white"
                                    : "stroke-white fill-none"
                                }`}
                              />
                            </Button>
                            {/* Number of Likes Below the Like Symbol */}
                            <span className="block text-white text-sm mt-1 text-center">
                              {selectedImage.likes ?? 0}
                            </span>
                          </div>
                        </div>
                      </ScrollArea>

                      {/* Description + Additional Actions */}
                      <div className="w-full md:w-2/5 flex flex-col">
                        <ScrollArea className="h-[30vh] md:h-[80vh] overflow-auto">
                          <div className="p-4 text-white">
                            <ReactMarkdown className="prose prose-invert">
                              {selectedImage.description ?? "No description available"}
                            </ReactMarkdown>
                          </div>
                        </ScrollArea>

                        {/* Spacer */}
                        <div className="mt-8"></div>

                        {/* Close Button */}
                        <Button
                          className="mx-4 mt-2 text-white border border-white/10 hover:bg-white/10 bg-transparent rounded-md transition duration-300 w-full md:w-auto"
                          onClick={() => setSelectedImage(null)}
                        >
                          Close
                        </Button>
                      </div>

                      {/* Close Button for Mobile */}
                      <button
                        className="absolute top-2 right-2 md:hidden text-white/60 hover:text-white"
                        onClick={() => setSelectedImage(null)}
                        aria-label="Close"
                      >
                        &times;
                      </button>
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
    </>
  );
};

export default SearchImage;