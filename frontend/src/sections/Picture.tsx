"use client";

import { useState, useRef } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Camera, Upload, Loader2 } from "lucide-react";
import CameraComponent from "@/components/Camera";
import { supabase } from "@/lib/supabase";
import ReactMarkdown from "react-markdown";

const Picture = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [imageDescription, setImageDescription] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const base64ToBlob = async (base64Data: string): Promise<Blob> => {
    const base64String = base64Data.includes("base64,")
      ? base64Data.split("base64,")[1]
      : base64Data;
    const response = await fetch(`data:image/png;base64,${base64String}`);
    return await response.blob();
  };

  const uploadToSupabase = async (file: Blob | File, prefix: string) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file instanceof File ? file.name.split(".").pop() : "png";
    const fileName = `${prefix}-${timestamp}-${randomString}.${fileExtension}`;

    try {
      const { data, error: uploadError } = await supabase.storage
        .from("image-store")
        .upload(fileName, file, {
          cacheControl: "3600",
          upsert: false,
          contentType: file.type || "image/jpeg",
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from("image-store")
        .getPublicUrl(fileName);

      if (!publicUrlData?.publicUrl) throw new Error("Failed to retrieve public URL");
      const publicURL = publicUrlData.publicUrl;

      const { data: insertedData, error: dbError } = await supabase
        .from("images")
        .insert([{ url: publicURL, created_at: new Date().toISOString() }])
        .select("id")
        .single();

      if (dbError || !insertedData?.id) throw dbError || new Error("Failed to retrieve image ID");

      const response = await fetch("https://jadooai.el.r.appspot.com/update_image_info", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: insertedData.id }),
      });
      if (!response.ok) {
        const responseData = await response.json();
        throw new Error(responseData.message || "Failed to update image info");
      }

      // Fetch the updated description
      const { data: newImageData, error: fetchError } = await supabase
        .from("images")
        .select("description")
        .eq("id", insertedData.id)
        .single();

      if (!fetchError && newImageData?.description) {
        setImageDescription(newImageData.description);
      }

      return publicURL;
    } catch (err: any) {
      if (err.message.includes("not_found")) {
        setError("Upload bucket not found. Please check your Supabase storage.");
      } else if (err.message.includes("Authentication failed")) {
        setError("Authentication required. Please log in and try again.");
      } else if (err.message.includes("Failed to update image info")) {
        setError("Failed to process image information. Please try again.");
      } else {
        setError("Failed to upload file. Please try again.");
      }
      throw err;
    }
  };

  const handleCapture = async (capturedPhoto: string) => {
    setIsLoading(true);
    setError(null);
    try {
      const blob = await base64ToBlob(capturedPhoto);
      const publicUrl = await uploadToSupabase(blob, "capture");
      setCapturedImage(capturedPhoto);
      setPhoto(publicUrl);
      setIsCaptured(true);
    } catch (err) {
      console.error("Error uploading captured image:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    setIsLoading(true);
    setError(null);
    try {
      const publicUrl = await uploadToSupabase(file, "upload");
      setPhoto(publicUrl);
    } catch (err) {
      console.error("Error uploading file:", err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhoto(null);
    setIsCaptured(false);
    setError(null);
    setImageDescription(null);
  };

  return (
    <div className="container">
      <Card className="w-full bg-transparent border-none mx-auto">
        <div className="relative mb-6">
          <CameraComponent
            onCapture={handleCapture}
            isLoading={isLoading}
            onRetake={handleRetake}
            isCaptured={isCaptured}
          />
        </div>
        <div className="flex flex-col gap-2">
          <div className="text-center">
            <p className="text-white mb-8">Or</p>
            <Button
              onClick={() => fileInputRef.current?.click()}
              variant="secondary"
              className="flex mt-2 items-center gap-2 bg-transparent border text-white border-white/15 hover:bg-white/10 mx-auto"
              disabled={isLoading}
            >
              {isLoading ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
              Upload Image File
            </Button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={handleFileUpload}
              accept="image/*"
              className="hidden"
            />
          </div>
        </div>

        {error && <div className="text-red-500 mt-4 text-center">{error}</div>}

        {photo && !capturedImage && (
          <div className="mt-6 text-center container overflow-x-clip">
            <div className="flex items-center justify-center gap-2 text-green-500 mb-4">
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M5 13l4 4L19 7"
                />
              </svg>
              <span>Image uploaded successfully!</span>
            </div>
            <img src={photo} alt="Uploaded" className="mx-auto rounded-md" />

            {imageDescription && (
              <div className="text-white mt-4 text-left">
                <span className="font-semibold">Description</span>

                <div className="mt-2">
                  <ReactMarkdown>{imageDescription}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  );
};

export default Picture;