"use client";

import React, { useState, useRef, useEffect } from 'react';
import { Camera as CameraIcon, RefreshCw } from 'lucide-react';

interface CameraProps {
    onCapture: (photo: string) => void;
    isLoading: boolean;
    onRetake: () => void;
    isCaptured: boolean;
}

const Camera: React.FC<CameraProps> = ({ onCapture, isLoading, onRetake, isCaptured }) => {
    const videoRef = useRef<HTMLVideoElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const [stream, setStream] = useState<MediaStream | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [previewImage, setPreviewImage] = useState<string | null>(null);
    const [facingMode, setFacingMode] = useState<'user' | 'environment'>('user');
    const [hasMultipleCameras, setHasMultipleCameras] = useState(false);

    const checkForMultipleCameras = async () => {
        try {
            const devices = await navigator.mediaDevices.enumerateDevices();
            const videoDevices = devices.filter(device => device.kind === 'videoinput');
            setHasMultipleCameras(videoDevices.length > 1);
        } catch (err) {
            console.error('Error checking for cameras:', err);
            setHasMultipleCameras(false);
        }
    };

    const startCamera = async () => {
        try {
            if (stream) {
                stream.getTracks().forEach(track => track.stop());
            }

            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { 
                    facingMode: facingMode,
                    width: { ideal: 1920 },
                    height: { ideal: 1080 }
                },
                audio: false,
            });

            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
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

    const switchCamera = async () => {
        setFacingMode(prev => prev === 'user' ? 'environment' : 'user');
        await startCamera();
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

        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;

        // Always mirror the image
        context.save();
        context.scale(-1, 1);
        context.drawImage(video, -canvas.width, 0, canvas.width, canvas.height);
        context.restore();

        try {
            const photoData = canvas.toDataURL('image/png', 1.0);
            setPreviewImage(photoData);
            onCapture(photoData);
        } catch (err) {
            console.error('Error capturing photo:', err);
            setError('Failed to capture photo. Please try again.');
        }
    };

    const handleRetake = () => {
        setError(null);
        setPreviewImage(null);
        onRetake();
        startCamera();
    };

    useEffect(() => {
        checkForMultipleCameras();
        startCamera();
        return () => {
            stopCamera();
        };
    }, []);

    useEffect(() => {
        if (!isCaptured) {
            setPreviewImage(null);
        }
    }, [isCaptured]);

    return (
        <div className="container relative pt-12">
            <div className="relative aspect-video rounded-md overflow-hidden bg-gray-950">
                {/* Video preview - always mirrored */}
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="absolute inset-0 w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
                
                <canvas
                    ref={canvasRef}
                    className="hidden"
                />
                
                {/* Captured photo - display without mirroring */}
                {isCaptured && previewImage && (
                    <img
                        src={previewImage}
                        alt="Captured"
                        className="absolute inset-0 w-full h-full object-cover"
                    />
                )}

                {isLoading && (
                    <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center">
                        <div className="text-white">Processing...</div>
                    </div>
                )}

                {/* Camera switch button */}
                {hasMultipleCameras && !isCaptured && !isLoading && (
                    <button
                        onClick={switchCamera}
                        className="absolute top-4 right-4 p-2 bg-black bg-opacity-50 rounded-full text-white
                                 hover:bg-opacity-70 transition-opacity"
                    >
                        <RefreshCw className="w-6 h-6" />
                    </button>
                )}
            </div>

            {error && (
                <div className="text-red-500 text-center mt-4 p-2 bg-red-50 rounded">
                    {error}
                </div>
            )}

            {stream && !error && (
                <div className="mt-4 flex justify-center">
                    <button
                        onClick={isCaptured ? handleRetake : takePhoto}
                        disabled={isLoading}
                        className="px-6 py-2 bg-gradient-to-tr from-blue-900 to-emerald-500 text-white rounded-md font-medium
                                 disabled:opacity-50 disabled:cursor-not-allowed hover:opacity-90 transition-opacity flex items-center gap-2"
                    >
                        <CameraIcon className="w-5 h-5" />
                        {isCaptured ? 'Retake Photo' : (isLoading ? 'Processing...' : 'Capture Photo')}
                    </button>
                </div>
            )}
        </div>
    );
};

export default Camera;