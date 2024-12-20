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

    const startCamera = async () => {
        try {
            const mediaStream = await navigator.mediaDevices.getUserMedia({
                video: { facingMode: "user", width: { ideal: 1920 }, height: { ideal: 1080 } },
                audio: false,
            });
            setStream(mediaStream);
            if (videoRef.current) {
                videoRef.current.srcObject = mediaStream;
                videoRef.current.onloadedmetadata = () => videoRef.current?.play().catch(console.error);
            }
        } catch (err) {
            setError("Failed to access camera. Please grant permissions.");
            console.error(err);
        }
    };

    const stopCamera = () => {
        if (stream) {
            stream.getTracks().forEach(track => track.stop());
            setStream(null);
        }
    };

    const takePhoto = () => {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d');
            const { videoWidth, videoHeight } = videoRef.current;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            context?.scale(-1, 1);
            context?.drawImage(videoRef.current, -videoWidth, 0, videoWidth, videoHeight);

            const photoData = canvasRef.current.toDataURL('image/png');
            onCapture(photoData);
        }
    };

    useEffect(() => {
        startCamera();
        return () => stopCamera();
    }, []);

    if (error) {
        return (
            <div className="text-red-500 text-center p-4">
                {error}
            </div>
        );
    }

    return (
        <div className="space-y-4">
            <div className="aspect-video relative rounded-lg overflow-hidden">
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={{ transform: 'scaleX(-1)' }}
                />
                <canvas
                    ref={canvasRef}
                    className="hidden"
                />
            </div>

            <div className="flex justify-center">
              <Button
                  onClick={takePhoto}
                  disabled={isLoading || !stream}
                  className="flex items-center gap-2"
              >
                  <CameraIcon className="w-4 h-4" />
                  Capture Photo
              </Button>
            </div>
        </div>
    );
};

export default Camera;