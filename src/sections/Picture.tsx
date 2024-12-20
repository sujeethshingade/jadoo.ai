"use client";

import React, { useState, useEffect } from 'react';
import Camera from '@/components/Camera';

const Picture: React.FC = () => {
    const [photo, setPhoto] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isCaptured, setIsCaptured] = useState(false);

    const handleCapture = (capturedPhoto: string) => {
        setPhoto(capturedPhoto);
        setIsCaptured(true);
        setIsLoading(false);
    };

    const handleRetake = () => {
        setPhoto(null);
        setIsCaptured(false);
        setIsLoading(false);
    };

    useEffect(() => {
        if (photo) {
            const capturedImg = document.getElementById('captured-photo') as HTMLImageElement;
            if (capturedImg) {
                capturedImg.src = photo;
            }
        }
    }, [photo]);

    return (
        <div>
            <Camera
                onCapture={handleCapture}
                isLoading={isLoading}
                onRetake={handleRetake}
                isCaptured={isCaptured}
            />
        </div>
    );
};

export default Picture;
