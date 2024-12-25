import React from "react";
import { AppProps } from "next/app";
import { SelectedImageProvider } from "../context/SelectedImageContext";

const MyApp: React.FC<AppProps> = ({ Component, pageProps }) => {
  return (
    <SelectedImageProvider>
      <Component {...pageProps} />
    </SelectedImageProvider>
  );
};

export default MyApp;