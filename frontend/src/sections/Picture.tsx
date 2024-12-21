"use client";

import { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2 } from 'lucide-react';
import CameraComponent from '@/components/Camera';
import { supabase } from '@/lib/supabase';

const Picture = () => {
  const [photo, setPhoto] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isCaptured, setIsCaptured] = useState(false);
  const [showCamera, setShowCamera] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Helper function to convert base64 to blob
  const base64ToBlob = async (base64Data: string): Promise<Blob> => {
    const base64String = base64Data.includes('base64,') 
      ? base64Data.split('base64,')[1] 
      : base64Data;
    
    const response = await fetch(`data:image/png;base64,${base64String}`);
    return await response.blob();
  };

  // Helper function to upload to Supabase
  const uploadToSupabase = async (file: Blob | File, prefix: string) => {
    const timestamp = Date.now();
    const randomString = Math.random().toString(36).substring(2, 15);
    const fileExtension = file instanceof File ? file.name.split('.').pop() : 'png';
    const fileName = `${prefix}-${timestamp}-${randomString}.${fileExtension}`;

    try {
      // Upload the file to Supabase storage
      const { data, error: uploadError } = await supabase.storage
        .from('image-store') // Ensure this matches your Supabase bucket name
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type || 'image/jpeg',
        });

      if (uploadError) {
        console.error('Upload error:', uploadError);
        throw uploadError;
      }

      console.log('Upload successful:', data);

      // Retrieve the public URL of the uploaded file
      const { data: publicUrlData } = supabase.storage
        .from('image-store')
        .getPublicUrl(fileName);

      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Failed to retrieve public URL');
        throw new Error('Failed to retrieve public URL');
      }

      if (!publicUrlData || !publicUrlData.publicUrl) {
        console.error('Failed to retrieve public URL');
        throw new Error('Failed to retrieve public URL');
      }

      const publicURL = publicUrlData.publicUrl;

      // Insert the image record into the 'images' table
      const { data: insertedData, error: dbError } = await supabase
        .from('images')
        .insert([{
          url: publicURL,
          created_at: new Date().toISOString()
        }])
        .select('id')
        .single();

      if (dbError) {
        console.error('Database insertion error:', dbError);
        throw dbError;
      }

      if (!insertedData?.id) {
        console.error('No ID returned from database');
        throw new Error('Failed to retrieve image ID');
      }

      console.log
      ('Fetched image ID:', insertedData.id);

      // Make POST request to the backend endpoint with the image ID
      const response = await fetch('https://jadooai.el.r.appspot.com/update_image_info', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ id: insertedData.id }),
      });

      if (!response.ok) {
        const responseData = await response.json();
        console.error('Update endpoint error:', responseData);
        throw new Error(responseData.message || 'Failed to update image info');
      }

      return publicURL;
    } catch (err: any) {
      console.error('Detailed upload error:', err);
      if (err.message.includes('not_found')) {
        setError('Upload bucket not found. Please check your Supabase storage configuration.');
      } else if (err.message.includes('Authentication failed')) {
        setError('Authentication required. Please log in and try again.');
      } else if (err.message.includes('Failed to update image info')) {
        setError('Failed to process image information. Please try again.');
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
      const blob = await base64ToBlob(capturedPhoto);
      const publicUrl = await uploadToSupabase(blob, 'capture');

      setCapturedImage(capturedPhoto);
      setPhoto(publicUrl);
      setIsCaptured(true);
    } catch (err) {
      console.error('Error uploading captured image:', err);
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
          <Upload className="w-4 h-4" />
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