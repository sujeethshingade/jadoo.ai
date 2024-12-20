"use client";

import React, { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Search, Loader2 } from 'lucide-react';
import { supabase } from '@/lib/supabase';

const SearchImage = () => {
  const [searchQuery, setSearchQuery] = useState('');
  interface Image {
    id: string;
    url: string;
    signedUrl?: string;
  }

  const [images, setImages] = useState<Image[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    
    setIsLoading(true);
    try {
      // Search in Supabase
      const { data, error } = await supabase
        .from('images')
        .select('*')
        .ilike('url', `%${searchQuery}%`);

      if (error) throw error;

      // Get URLs for the images
      const imageUrls = await Promise.all(
        data.map(async (image: Image) => {
          const { data: urlData } = await supabase.storage
            .from('image-store')
            .createSignedUrl(image.url, 3600); // 1 hour expiry
          return { ...image, signedUrl: urlData?.signedUrl };
        })
      );

      setImages(imageUrls);
    } catch (error) {
      console.error('Error searching images:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-16">
    <Card className="w-full max-w-4xl mx-auto p-6 bg-transparent border border-white/10 rounded-md">
      <div className="space-y-6">
        {/* Search Input */}
        <div className="flex gap-4">
          <Input
            type="text"
            placeholder="Search images..."
            value={searchQuery}
            onChange={(e: { target: { value: React.SetStateAction<string>; }; }) => setSearchQuery(e.target.value)}
            onKeyPress={(e: { key: string; }) => e.key === 'Enter' && handleSearch()}
            className="flex-1 text-white border border-white/10 rounded-md"
          />
          <Button 
            onClick={handleSearch}
            disabled={isLoading}
            className="flex items-center gap-2 border border-white/10 bg-transparent hover:bg-white/15 rounded-md transition duration-300"
          >
            {isLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <div className="w-4 h-4">
                <Search />
              </div>
            )}
            Search
          </Button>
        </div>

        {/* Search Results */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {images.map((image) => (
            <div key={image.id} className="relative aspect-square">
              <img
                src={image.signedUrl}
                alt={`Image ${image.id}`}
                className="w-full h-full object-cover rounded-md"
              />
            </div>
          ))}
        </div>

        {/* No Results Message */}
        {!isLoading && images.length === 0 && searchQuery && (
          <p className="text-center text-gray-500">
            No images found for "{searchQuery}"
          </p>
        )}
      </div>
    </Card>
    </div>
  );
};

export default SearchImage;