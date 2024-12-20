"use client";

import React, { useState, useRef, useEffect } from 'react';

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
        stream?.getTracks().forEach(track => track.stop());
        setStream(null);
    };

    const takePhoto = () => {
        if (canvasRef.current && videoRef.current) {
            const context = canvasRef.current.getContext('2d');
            const { videoWidth, videoHeight } = videoRef.current;
            canvasRef.current.width = videoWidth;
            canvasRef.current.height = videoHeight;

            context?.scale(-1, 1); // Horizontal flip (mirror effect)
            context?.drawImage(videoRef.current, -videoWidth, 0, videoWidth, videoHeight);

            const photoData = canvasRef.current.toDataURL('image/png');
            onCapture(photoData);

            stopCamera();
        }
    };

    const handleRetake = () => {
        onRetake();
        startCamera();
    };

    useEffect(() => {
        startCamera();
        return stopCamera;
    }, []);

    return (
        <div className="container relative">
            <div className="relative aspect-video rounded-sm overflow-hidden">
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
                    className="absolute inset-0 w-full h-full"
                    style={{ display: 'none' }}
                />
                {isCaptured && (
                    <img
                        id="captured-photo"
                        src=""
                        alt="Captured"
                        className="absolute inset-0 w-full h-full object-cover"
                        style={{ display: 'block' }}
                    />
                )}
            </div>

            {error && <div className="text-red-500 text-center mt-4">{error}</div>}

            <button
                onClick={isCaptured ? handleRetake : takePhoto}
                disabled={isLoading}
                className="mt-4 w-full px-4 py-2 tracking-tight bg-gradient-to-tr from-blue-900 to-emerald-500 text-white rounded-sm font-medium"
            >
                {isCaptured ? 'Retake Photo' : (isLoading ? 'Processing...' : 'Capture Photo')}
            </button>
        </div>
    );
};

export default Camera;
