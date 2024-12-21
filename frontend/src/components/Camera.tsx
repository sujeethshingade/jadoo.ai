"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Camera as CameraIcon } from 'lucide-react';

interface CameraProps {
    onCapture: (photo: string) => void;
    isLoading: boolean;
    onRetake: () => void;
    isCaptured: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, isLoading }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    // Add state for the captured image preview
    const [previewImage, setPreviewImage] = useState<string | null>(null);

    const startCamera = async () => {
        try {
            // Stop any existing stream
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: "user",
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false,
            });

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                // Ensure video is fully loaded before playing
                videoRef.current.onloadedmetadata = () => {
                    if (videoRef.current) {
                        videoRef.current.play().catch(err => {
                            console.error('Error playing video:', err);
                            setError('Failed to start video stream');
                        });
                    }
                };
            }
        } catch (err) {
            console.error('Camera access error:', err);
            setError(
                err instanceof DOMException && err.name === 'NotAllowedError'
                    ? 'Camera access denied. Please grant permission in your browser settings.'
                    : 'Failed to access camera. Please ensure your device has a working camera.'
            );
            setStream(null);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
        if (videoRef.current) {
            videoRef.current.srcObject = null;
        }
    };

    const takePhoto = () => {
        if (!canvasRef.current || !videoRef.current) return;

        const video = videoRef.current;
        const canvas = canvasRef.current;
        const context = canvas.getContext('2d');
        
        if (!context) return;

        // Set canvas dimensions to match video
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Handle mirroring for selfie view
        context.save();
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();

        try {
            // Convert to base64 with maximum quality
            const photoData = canvas.toDataURL('image/png', 1.0);
            setPreviewImage(photoData); // Set the preview image
            onCapture(photoData); // Send to parent component
        } catch (err) {
            console.error('Error capturing photo:', err);
            setError('Failed to capture photo. Please try again.');
        }
    };

    const handleRetake = () => {
        setError(null);
        setPreviewImage(null); // Clear the preview image
        onRetake();
        startCamera();
    };

    useEffect(() => {
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    // Reset preview image when isCaptured changes to false
    useEffect(() => {
        if (!isCaptured) {
            setPreviewImage(null);
        }
    }, [isCaptured]);

    return (
        <div className="container relative py-16">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-gray-900">
                {/* Video preview */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
                
                {/* Hidden canvas for capturing */}
                <canvas
                    ref={canvasRef}
                    className="hidden"
                />
                
                {/* Captured photo display */}
                {isCaptured && previewImage && (
                    <img
                        src={previewImage}
                        alt="Captured"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}

                {/* Loading overlay */}
                {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white">Processing...</div>
                    </div>
                )}
            </div>

            {/* Error display */}
            {error && (
                <div className="text-red-500 text-center mt-4 p-2 bg-red-50 rounded">
                    {error}
                </div>
            )}

            {/* Camera controls */}
            {stream && !error && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={isCaptured ? handleRetake : takePhoto}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gradient-to-tr from-blue-900 to-emerald-500 text-white rounded-lg font-medium
                                 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity"
                    >
                        {isCaptured ? 'Retake Photo' : (isLoading ? 'Processing...' : 'Capture Photo')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Camera;