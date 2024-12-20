"use client";

import React, { useState, useRef } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Camera, Upload, Loader2, Check } from 'lucide-react';
import CameraComponent from '@/components/Camera';
import { supabase } from '@/lib/supabase';

const Picture = () => {
  const [mode, setMode] = useState<'initial' | 'camera' | 'preview'>('initial');
  const [isLoading, setIsLoading] = useState(false);
  const [capturedImage, setCapturedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleCapture = (capturedPhoto: string) => {
    setCapturedImage(capturedPhoto);
    setMode('preview');
  };

  const handleRetake = () => {
    setCapturedImage(null);
    setMode('camera');
  };

  const handleUploadCaptured = async () => {
    if (!capturedImage) return;
    setIsLoading(true);
    
    try {
      // Convert base64 to blob
      const base64Data = capturedImage.split(',')[1];
      const blob = await fetch(`data:image/png;base64,${base64Data}`).then(res => res.blob());
      const fileName = `capture-${Date.now()}.png`;

      // Upload to Supabase
      const { data, error } = await supabase.storage
        .from('image-store')
        .upload(`public/${fileName}`, blob);

      if (error) throw error;

      // Reset states after successful upload
      setMode('initial');
      setCapturedImage(null);
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);
    
    try {
      const fileName = `upload-${Date.now()}-${file.name}`;
      
      const { data, error } = await supabase.storage
        .from('image-store')
        .upload(`public/${fileName}`, file);

      if (error) throw error;

      setMode('initial');
    } catch (error) {
      console.error('Error uploading image:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-3xl mx-auto p-6">
      {mode === 'initial' && (
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => setMode('camera')}
            className="flex items-center justify-center gap-2 py-6"
          >
            <Camera className="w-6 h-6" />
            Take Picture
          </Button>
          
          <Button
            onClick={() => fileInputRef.current?.click()}
            variant="outline"
            className="flex items-center justify-center gap-2 py-6"
            disabled={isLoading}
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Upload className="w-6 h-6" />
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
      )}

      {mode === 'camera' && (
        <div className="relative">
          <CameraComponent 
            onCapture={handleCapture}
            isLoading={isLoading}
            onRetake={handleRetake}
            isCaptured={false}
          />
        </div>
      )}

      {mode === 'preview' && capturedImage && (
        <div className="space-y-4">
          <div className="aspect-video relative rounded-lg overflow-hidden">
            <img 
              src={capturedImage}
              alt="Preview"
              className="w-full h-full object-cover"
            />
          </div>
          
          <div className="flex justify-center gap-4">
            <Button
              onClick={handleRetake}
              variant="outline"
              disabled={isLoading}
            >
              Retake
            </Button>
            
            <Button
              onClick={handleUploadCaptured}
              disabled={isLoading}
              className="flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Check className="w-4 h-4" />
                  Upload
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </Card>
  );
};

export default Picture;