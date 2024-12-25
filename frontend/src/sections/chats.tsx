"use client";
import React, { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, RefreshCcw } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/lib/supabase";
import { useRouter } from "next/navigation";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { v4 as uuidv4 } from "uuid"; // Import uuid for session ID generation

// LoadingSpinner Component for Animation
const LoadingSpinner: React.FC = () => {
  return (
    <span className="ml-2 inline-block">
      <svg
        className="animate-spin h-5 w-5 text-white"
        xmlns="http://www.w3.org/2000/svg"
        fill="none"
        viewBox="0 0 24 24"
      >
        <circle
          className="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          strokeWidth="4"
        ></circle>
        <path
          className="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8v8H4z"
        ></path>
      </svg>
    </span>
  );
};
// Utility function to extract image ID from URL
const extractImageIdFromUrl = (url: string): string | null => {
  try {
    // URL format: https://[domain]/storage/v1/object/public/chat-images/[session-id]/[filename]
    const parts = url.split('chat-images/');
    if (parts.length > 1) {
      return `chat-images/${parts[1]}`;
    }
    return null;
  } catch (error) {
    console.error('Error extracting image ID:', error);
    return null;
  }
};

interface ChatMessage {
  id?: number;
  text: string;
  type: "user" | "agent";
  isImage?: boolean;
  imageUrl?: string;
  imageId?: string; // Added imageId property
}

const Chats: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const [sessionId, setSessionId] = useState<string>(""); // New state for session ID
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  // Generate a new session ID when the component mounts
  useEffect(() => {
    const newSessionId = uuidv4();
    setSessionId(newSessionId);
  }, []);

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        "[data-radix-scroll-area-viewport]"
      );
      if (scrollElement) {
        scrollElement.scrollTop = scrollElement.scrollHeight;
      }
    }
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push("/login");
          return;
        }
        setUser(user);
      } catch (err) {
        console.error("Auth error:", err);
        router.push("/login");
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_OUT") {
        router.push("/login");
      } else if (event === "SIGNED_IN" && session?.user) {
        setUser(session.user);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Check for initial image data from sessionStorage
    const chatImageData = sessionStorage.getItem("chatImage");
    if (chatImageData) {
      const { url, description, image_id } = JSON.parse(chatImageData);
      sessionStorage.removeItem("chatImage");

      // Initialize messages with image and description
      const initialMessages: ChatMessage[] = [
        {
          text: "Shared an image",
          type: "user",
          isImage: true,
          imageUrl: url,
          imageId: image_id, // Include imageId
        },
        {
          text: description || "No description available",
          type: "user",
        },
      ];
      setMessages(initialMessages);
    }
  }, []);

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;
  
    try {
      setIsLoading(true);
  
      // Add the user message to the chat
      const userMessage: ChatMessage = { text: inputMessage, type: "user" };
      setMessages((prev) => [...prev, userMessage]);
      setInputMessage("");
  
      // Add a temporary processing message 
      const processingMessage: ChatMessage = {
        text: "Processing your request...",
        type: "agent",
      };
      setMessages((prev) => [...prev, processingMessage]);
  
      // Get latest image from Supabase
      const { data: latestImageData, error: imageError } = await supabase
        .from('images')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(1)
        .single();
  
      if (imageError || !latestImageData) {
        console.error('Image fetch error:', imageError);
        throw new Error("Please upload an image before sending a prompt.");
      }

      // Extract the file path from the full URL if needed
      const imagePath = latestImageData.url.includes('image-store/') 
        ? latestImageData.url.split('image-store/')[1]
        : latestImageData.url;

      console.log('Image path:', imagePath);
  
      // Get the signed URL for the image
      const { data: urlData, error: urlError } = await supabase.storage
        .from("image-store")
        .createSignedUrl(imagePath, 3600);
  
      if (urlError || !urlData?.signedUrl) {
        console.error('Signed URL error:', urlError);
        console.error('URL Data:', urlData);
        throw new Error("Failed to get image URL");
      }

      console.log('Signed URL generated:', urlData.signedUrl);
  
      // Make API call with latest image
      const response = await fetch("http://localhost:5000/chatbot", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          content: inputMessage,
          image_url: urlData.signedUrl,
          image_id: latestImageData.id
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error('API error:', errorData);
        throw new Error(errorData.message || "Failed to get response from server");
      }
  
      const data = await response.json();
  
      // Update the processing message with response
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "agent" && msg.text === "Processing your request..."
            ? { ...msg, text: data.reply }
            : msg
        )
      );
  
    } catch (err: any) {
      console.error("Error:", err);
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "agent" && msg.text === "Processing your request..."
            ? {
                ...msg, 
                text: err.message || "An error occurred. Please try again."
              }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsLoading(true);

    try {
      const userMessage: ChatMessage = {
        text: `Uploading file: ${file.name}`,
        type: "user",
      };
      setMessages((prev) => [...prev, userMessage]);

      const processingMessage: ChatMessage = {
        text: "Processing your request...",
        type: "agent",
      };
      setMessages((prev) => [...prev, processingMessage]);

      // Upload the file to Supabase Storage
      const { data, error: uploadError } = await supabase.storage
        .from("chat-images") // Ensure this bucket exists in your Supabase Storage
        .upload(`${sessionId}/${file.name}`, file, {
          cacheControl: "3600",
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get the public URL of the uploaded image
      const { publicURL, error: urlError } = supabase.storage
        .from("chat-images")
        .getPublicUrl(data.path);

      if (urlError) throw urlError;

      const imageUrl = publicURL;
        const imageId = data.path; // Using the file path as imageId

      // Create a chat message with the uploaded image
      const finalUserMessage: ChatMessage = {
        text: "Image uploaded successfully.",
        type: "user",
        isImage: true,
        imageUrl: imageUrl,
        imageId: imageId,
      };
      setMessages((prev) => [...prev, finalUserMessage]);

      // Optionally, you can send the imageId to the server here if needed
    } catch (error: any) {
      console.error("Upload error:", error);
      const errorMessage: ChatMessage = {
        text:
          error.message ||
          "Sorry, I encountered an error processing your file. Please try again.",
        type: "agent",
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === "agent" && msg.text === "Processing your request..."
            ? { ...msg, text: errorMessage.text }
            : msg
        )
      );
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleClearChat = async (
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    try {
      setIsLoading(true);
      setMessages([]);

      const { error: deleteError } = await supabase
        .from("messages")
        .delete()
        .eq("user_id", user.id); // Assuming messages have a user_id column

      if (deleteError) throw deleteError;
    } catch (err) {
      console.error("Error clearing chat:", err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-10 bg-gray-950 text-white">
      {user ? (
        <>
          <Card className="bg-gray-950 rounded-md border border-white/10">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-semibold text-lg text-white">
                Jadoo.ai
              </CardTitle>
              <button
                onClick={handleClearChat}
                className={`text-white hover:text-primary transition-colors duration-300 flex items-center gap-2`}
                disabled={isLoading}
              >
                <RefreshCcw className="w-5 h-5" />
                Clear
              </button>
            </CardHeader>
            <CardContent className="p-6">
              <div className="h-[350px] flex flex-col">
                <ScrollArea ref={scrollAreaRef} className="flex-grow pr-4 -mr-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div
                        className={`text-center flex items-center justify-center h-full text-white`}
                      >
                        No messages yet.
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.type === "user" ? "justify-end" : "justify-start"
                          } animate-fade-in`}
                        >
                          <div
                            className={`p-3 rounded-sm ${
                              message.type === "user"
                                ? "bg-primary text-white"
                                : "bg-primary text-white"
                            }`}
                            style={{
                              wordWrap: "break-word",
                              display: "inline-block",
                              maxWidth: "70%",
                            }}
                          >
                            {message.isImage ? (
                              <div className="max-w-sm">
                                <img
                                  src={message.imageUrl}
                                  alt="Shared content"
                                  className="w-full h-auto rounded-md"
                                  loading="lazy"
                                />
                              </div>
                            ) : message.type === "agent" &&
                              message.text === "Processing your request..." ? (
                              <span className="flex items-center">
                                Processing your request
                                <LoadingSpinner />
                              </span>
                            ) : (
                              <ReactMarkdown>{message.text}</ReactMarkdown>
                            )}
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </ScrollArea>
                <div className="mt-4 relative">
                  <Input
                    type="text"
                    value={inputMessage}
                    onChange={(e) => setInputMessage(e.target.value)}
                    onKeyUp={(e) =>
                      e.key === "Enter" && handleSendMessage()
                    }
                    placeholder="chat with latest image"
                    className="w-full bg-gray-950 text-white border border-white/10 rounded-md pl-4 pr-20 py-5 outline-none"
                    disabled={isLoading}
                  />

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-4">
                    <Button
                      onClick={handleSendMessage}
                      className="text-white bg-transparent"
                      disabled={isLoading}
                    >
                      <ArrowUp className="w-5 h-5" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          <input
            type="file"
            accept="image/*, .csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </>
      ) : (
        <div className="text-center text-xl">Please login to proceed.</div>
      )}
    </div>
  );
};

export default Chats;