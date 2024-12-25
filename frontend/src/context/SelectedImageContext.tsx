import React, { createContext, useState, ReactNode } from "react";

interface SelectedImage {
  url?: string;
  description?: string;
  id?: string;
  tags?: string;
}

interface SelectedImageContextProps {
  selectedImage: SelectedImage | null;
  setSelectedImage: (image: SelectedImage | null) => void;
}

export const SelectedImageContext = createContext<SelectedImageContextProps>({
  selectedImage: null,
  setSelectedImage: () => {},
});

interface ProviderProps {
  children: ReactNode;
}

export const SelectedImageProvider: React.FC<ProviderProps> = ({ children }) => {
  const [selectedImage, setSelectedImage] = useState<SelectedImage | null>(null);

  return (
    <SelectedImageContext.Provider value={{ selectedImage, setSelectedImage }}>
      {children}
    </SelectedImageContext.Provider>
  );
};