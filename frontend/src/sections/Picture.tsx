"use client";

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2 } from 'lucide-react';
import CameraComponent from '@/components/Camera';
import { supabase } from '@/lib/supabase';
import { createClient } from '@supabase/supabase-js' 

const Picture = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Helper function to convert base64 to blob
  const base64ToBlob = async (base64Data: string): Promise<Blob> => {
    // Remove the data URL prefix if present
    const base64String = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;
    
    // Convert base64 to blob using fetch API
    const response = await fetch(`data:image/png;base64,${base64String}`);
    return await response.blob();
  };

  // Helper function to upload to Supabase
  const uploadToSupabase = async (file: Blob | File, prefix: string) => {
    // Generate a unique filename
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file instanceof File ? file.name.split('.').pop() : 'png';
    const fileName = `${prefix}-${timestamp}-${randomString}.${fileExtension}`;
  
    try {
      // Upload the file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('image-store')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg', // Ensure correct content type
        });
  
      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }
  
      console.log('Upload successful:', data);
  
      // Retrieve the public URL of the uploaded file
      const { data: publicUrlData, error: publicUrlError } = supabase.storage
        .from('image-store')
        .getPublicUrl(fileName);
  
      if (publicUrlError) {
        console.error('Public URL error:', publicUrlError);
        throw publicUrlError;
      }
  
      if (!publicUrlData?.publicUrl) {
        throw new Error('Failed to retrieve public URL');
      }
  
      // Insert the image record into the 'images' table
      const { error: dbError } = await supabase
        .from('images')
        .insert([{
          url: data.path,
          public_url: publicUrlData.publicUrl,
          created_at: new Date().toISOString()
        }]);
  
      if (dbError) {
        console.error('Database insertion error:', dbError);
        // Proceed without throwing to return the public URL
      }
  
      return publicUrlData.publicUrl;
    } catch (err) {
      console.error('Detailed upload error:', err);
      if (err.message.includes('not_found')) {
        setError('Upload bucket not found. Please check your Supabase storage configuration.');
      } else if (err.message.includes('Authentication failed')) {
        setError('Authentication required. Please log in and try again.');
      } else {
        setError('Failed to upload file to storage. Please try again.');
      }
      throw err;
    }
  };

  const handleCapture = async (capturedPhoto: string) => {
    setIsLoading(true);
    setError(null);
    
    try {
      // Convert and upload the captured photo
      const blob = await base64ToBlob(capturedPhoto);
      const publicUrl = await uploadToSupabase(blob, 'capture');

      setCapturedImage(capturedPhoto);
      setPhoto(publicUrl);
      setIsCaptured(true);
    } catch (err) {
      console.error('Error uploading captured image:', err);
      setError('Failed to upload captured image. Please try again.');
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
      const publicUrl = await uploadToSupabase(file, 'upload');
      setPhoto(publicUrl);
    } catch (err) {
      console.error('Error uploading file:', err);
      setError('Failed to upload image. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhoto(null);
    setIsCaptured(false);
    setError(null);
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-6 mt-6">
      {/* Action Buttons */}
      <div className="flex gap-4 mb-6">
        <Button
          onClick={() => setShowCamera(prev => !prev)}
          className="flex items-center gap-2"
        >
          <Camera className="w-4 h-4" />
          {showCamera ? 'Hide Camera' : 'Take Picture'}
        </Button>

        <Button
          onClick={() => fileInputRef.current?.click()}
          variant="secondary"
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin" />
          ) : (
            <Upload className="w-4 h-4" />
          )}
          Upload Image
        </Button>
        <input
          type="file"
          ref={fileInputRef}
          onChange={handleFileUpload}
          accept="image/*"
          className="hidden"
        />
      </div>

      {/* Error Display */}
      {error && (
        <div className="text-red-500 mb-4 text-center">
          {error}
        </div>
      )}

      {/* Camera Section */}
      {showCamera && (
        <div className="relative mb-6">
          <CameraComponent 
            onCapture={handleCapture} 
            isLoading={isLoading}
            onRetake={handleRetake}
            isCaptured={isCaptured}
          />
          
          {capturedImage && (
            <div className="absolute inset-0">
              <img 
                src={capturedImage} 
                alt="Captured"
                className="w-full h-full object-cover rounded-lg"
              />
            </div>
          )}
        </div>
      )}

      {/* Display uploaded/captured image */}
      {photo && !showCamera && (
        <div className="mt-4">
          <img 
            src={photo} 
            alt="Uploaded/Captured" 
            className="max-w-md mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}
    </Card>
  );
};

export default Picture;