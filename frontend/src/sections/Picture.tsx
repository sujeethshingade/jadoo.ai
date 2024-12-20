"use client";

import React, { useState, useRef } from 'react';
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
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = async (capturedPhoto: string) => {
    setCapturedImage(capturedPhoto);
    setPhoto(capturedPhoto);
    setIsCaptured(true);
    setIsLoading(true);
    
    try {
      // Convert base64 to blob
      const base64Data = capturedPhoto.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      const fileName = `capture-${Date.now()}.png`;

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('image-store')
        .upload(fileName, blob);

      if (error) throw error;
      
      // Save reference in images table
      await supabase.from('images')
        .insert([{ 
          url: data.path,
          created_at: new Date().toISOString()
        }]);

      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsLoading(false);
    }
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setPhoto(null);
    setIsCaptured(false);
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files && event.target.files[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      const fileName = `upload-${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('image-store')
        .upload(fileName, file);

      if (error) throw error;

      await supabase.from('images')
        .insert([{ 
          url: data.path,
          created_at: new Date().toISOString()
        }]);

      // Get and display the uploaded image
      const { data: urlData } = await supabase.storage
        .from('image-store')
        .createSignedUrl(data.path, 3600);

      setPhoto(urlData?.signedUrl || null);
      setIsLoading(false);
    } catch (error) {
      console.error('Error uploading image:', error);
      setIsLoading(false);
    }
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

          <Button
            onClick={isCaptured ? handleRetake : () => capturedImage && handleCapture(capturedImage)}
            className="absolute bottom-4 left-1/2 transform -translate-x-1/2"
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Processing...
              </>
            ) : (
              isCaptured ? 'Retake' : 'Capture'
            )}
          </Button>
        </div>
      )}

      {/* Display captured/uploaded image */}
      {photo && !showCamera && (
        <div className="mt-4">
          <img 
            src={photo} 
            alt="Captured" 
            className="max-w-md mx-auto rounded-lg shadow-lg"
          />
        </div>
      )}
    </Card>
  );
};

export default Picture;