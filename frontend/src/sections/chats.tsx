"use client";
import React, { useState, useRef, useEffect } from 'react';
import ReactMarkdown from 'react-markdown';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Paperclip, ArrowUp, RefreshCcw } from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';

type ChatTopic = {
  title: string;
  prompt: string;
};

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

interface ChatMessage {
    id?: number;
    text: string;
    type: 'user' | 'agent';
    isImage?: boolean;
    imageUrl?: string;
  }

const chats: React.FC = () => {
    const [messages, setMessages] = useState<ChatMessage[]>([]);

  const [inputMessage, setInputMessage] = useState('');
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState<any>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const router = useRouter();
  const [accessToken, setAccessToken] = useState<string | null>(null);

  const sustainabilityTopics: ChatTopic[] = [
    {
      title: 'Transportation using Renewable Energy',
      prompt:
        'Discuss the latest innovations in renewable energy for transportation.',
    },
    {
      title: 'Sustainable Packaging of Goods',
      prompt:
        'Analyze the current trends and challenges in sustainable packaging solutions.',
    },
    {
      title: 'Carbon Footprint Comparison',
      prompt:
        'Compare carbon footprints for different activities or organizations.',
    },
    {
      title: 'Environmental Impact Reports',
      prompt:
        'What are the key components of a comprehensive environmental impact report?',
    },
  ];

  const scrollToBottom = () => {
    if (scrollAreaRef.current) {
      const scrollElement = scrollAreaRef.current.querySelector(
        '[data-radix-scroll-area-viewport]'
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
    const fetchSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session) {
        setAccessToken(session.access_token);
      }
    };

    fetchSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session) {
        setAccessToken(session.access_token);
      } else {
        setAccessToken(null);
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const {
          data: { user },
        } = await supabase.auth.getUser();
        if (!user) {
          router.push('/login');
          return;
        }
        setUser(user);
        await createNewSession();
      } catch (err) {
        console.error('Auth error:', err);
        router.push('/login');
      }
    };

    checkAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_OUT') {
        router.push('/login');
      } else if (event === 'SIGNED_IN' && session?.user) {
        setUser(session.user);
        await createNewSession();
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    // Check for initial image data from sessionStorage
    const chatImageData = sessionStorage.getItem('chatImage');
    if (chatImageData) {
      const { url, description } = JSON.parse(chatImageData);
      sessionStorage.removeItem('chatImage');

      // Initialize messages with image and description
      const initialMessages: ChatMessage[] = [
        {
          text: 'Shared an image',
          type: 'user',
          isImage: true,
          imageUrl: url
        },
        {
          text: description || 'No description available',
          type: 'user'
        }
      ];
      setMessages(initialMessages);
    }
  }, []);

  const createNewSession = async () => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data: session, error: sessionError } = await supabase
        .from('chat_sessions')
        .insert({
          title: 'New Chat',
          user_id: user.id,
        })
        .select()
        .single();

      if (sessionError) {
        throw sessionError;
      }

      if (session && session.id) {
        setCurrentSessionId(session.id);
        setMessages([]);
        console.log(`New session created with ID: ${session.id}`);
      } else {
        throw new Error('Failed to create a new session.');
      }
    } catch (err) {
      console.error('Error creating session:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSessionSelect = async (sessionId: string) => {
    if (!user) return;

    try {
      setIsLoading(true);
      const { data: messages, error: messagesError } = await supabase
        .from('messages')
        .select('*')
        .eq('session_id', sessionId)
        .order('created_at', { ascending: true });

      if (messagesError) throw messagesError;

      setCurrentSessionId(sessionId);
      setMessages(
        messages.map((msg) => ({
          id: msg.id,
          text: msg.content,
          type: msg.type as 'user' | 'agent',
        }))
      );
    } catch (err) {
      console.error('Error fetching messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const saveMessagesToDatabase = async (
    newMessages: { text: string; type: 'user' | 'agent' }[]
  ) => {

    const { data: insertedMessages, error: messagesError } = await supabase
      .from('messages')
      .insert(
        newMessages.map((msg) => ({
          session_id: currentSessionId,
          content: msg.text,
          type: msg.type,
        }))
      )
      .select();


    if (insertedMessages) {
      setMessages((prevMessages) => {
        const updatedMessages = [...prevMessages];
        let insertIndex = 0;
        updatedMessages.forEach((msg, idx) => {
          if (!msg.id) {
            msg.id = insertedMessages[insertIndex]?.id;
            insertIndex++;
          }
        });
        return updatedMessages;
      });
    }
  };

  const updateMessageInDatabase = async (messageId: number, newText: string) => {
    const { error } = await supabase
      .from('messages')
      .update({ content: newText })
      .eq('id', messageId);

    if (error) {
      console.error('Failed to update message in database:', error);
    }
  };

  const updateSessionTitle = async (title: string) => {
    if (!currentSessionId) return;

    const { error } = await supabase
      .from('chat_sessions')
      .update({ title: title.slice(0, 50) })
      .eq('id', currentSessionId);

    if (error) {
      console.error('Error updating session title:', error);
    }
  };

  const handleTopicClick = async (topic: ChatTopic) => {
    try {
      setIsLoading(true);

      if (!currentSessionId) {
        await createNewSession();
      }

      const newMessages = [
        { text: topic.prompt, type: 'user' as const },
        { text: 'Processing your request...', type: 'agent' as const },
      ];

      setMessages((prev) => [...prev, ...newMessages]);
      await saveMessagesToDatabase(newMessages);

      if (messages.length === 0) {
        await updateSessionTitle(topic.title);
      }
    } catch (err) {
      console.error('Error processing topic:', err);
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    try {
      
  
      createNewSession();

      setIsLoading(true);
      const userMessage = { text: inputMessage, type: 'user' as const };
      setMessages((prev) => [...prev, userMessage]);

      await saveMessagesToDatabase([userMessage]);

      setInputMessage('');

      const processingMessage = {
        text: 'Processing your request...',
        type: 'agent' as const,
      };
      setMessages((prev) => [...prev, processingMessage]);

      

      const response = await fetch('http://localhost:5000/api/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          content: inputMessage,
          session_id: currentSessionId,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to get response from server');
      }

      const data = await response.json();

      const finalAgentMessage = { text: data.reply, type: 'agent' as const };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'agent' && msg.text === 'Processing your request...'
            ? { ...msg, text: finalAgentMessage.text }
            : msg
        )
      );

      const processingMsg = messages.find(
        (msg) =>
          msg.type === 'agent' && msg.text === 'Processing your request...'
      );

      if (processingMsg && processingMsg.id) {
        await updateMessageInDatabase(processingMsg.id, finalAgentMessage.text);
      } else {
        await saveMessagesToDatabase([finalAgentMessage]);
      }
    } catch (err) {
      console.error('Error handling message:', err);
      const errorMessage = {
        text: 'Sorry, I encountered an error processing your message. Please try again.',
        type: 'agent' as const,
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'agent' && msg.text === 'Processing your request...'
            ? { ...msg, text: errorMessage.text }
            : msg
        )
      );

      const processingMsg = messages.find(
        (msg) =>
          msg.type === 'agent' && msg.text === errorMessage.text
      );

      if (processingMsg && processingMsg.id) {
        await updateMessageInDatabase(processingMsg.id, errorMessage.text);
      } else {
        await saveMessagesToDatabase([errorMessage]);
      }
    } finally {
      setIsLoading(false);
      scrollToBottom();
    }
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!currentSessionId) {
      await createNewSession();
    }

    setIsLoading(true);

    try {
      const userMessage = {
        text: `Uploading file: ${file.name}`,
        type: 'user' as const,
      };
      setMessages((prev) => [...prev, userMessage]);
      await saveMessagesToDatabase([userMessage]);

      const processingMessage = {
        text: 'Processing your request...',
        type: 'agent' as const,
      };
      setMessages((prev) => [...prev, processingMessage]);
      await saveMessagesToDatabase([processingMessage]);

      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch(
        'http://localhost:5000/api/v1/sustainability/upload',
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
          },
          body: formData,
          credentials: 'include',
        }
      );

      if (!response.ok) {
        let errorMessage = 'Failed to upload file';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch (e) {}
        throw new Error(errorMessage);
      }

      const data = await response.json();


      const finalAgentMessage = {
        text: data.reply || 'File processed successfully.',
        type: 'agent' as const,
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'agent' && msg.text === 'Processing your request...'
            ? { ...msg, text: finalAgentMessage.text }
            : msg
        )
      );

      const processingMsg = messages.find(
        (msg) =>
          msg.type === 'agent' && msg.text === finalAgentMessage.text
      );

      if (processingMsg && processingMsg.id) {
        await updateMessageInDatabase(
          processingMsg.id,
          finalAgentMessage.text
        );
      } else {
        await saveMessagesToDatabase([finalAgentMessage]);
      }
    } catch (error: any) {
      console.error('Upload error:', error);
      const errorMessage = {
        text: 'Sorry, I encountered an error processing your file. Please try again.',
        type: 'agent' as const,
      };
      setMessages((prev) =>
        prev.map((msg) =>
          msg.type === 'agent' && msg.text === 'Processing your request...'
            ? { ...msg, text: errorMessage.text }
            : msg
        )
      );

      const processingMsg = messages.find(
        (msg) =>
          msg.type === 'agent' && msg.text === errorMessage.text
      );

      if (processingMsg && processingMsg.id) {
        await updateMessageInDatabase(processingMsg.id, errorMessage.text);
      } else {
        await saveMessagesToDatabase([errorMessage]);
      }
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

      if (currentSessionId) {
        const { error: deleteError } = await supabase
          .from('messages')
          .delete()
          .eq('session_id', currentSessionId);

        if (deleteError) throw deleteError;
        await createNewSession();
      }
    } catch (err) {
      console.error('Error clearing chat:', err);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container py-16 bg-gray-950 text-white ">
      {user ? (
        <>
          <Card className="bg-gray-950 rounded-none">
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
              <div className="h-[500px] flex flex-col">
                <ScrollArea ref={scrollAreaRef} className="flex-grow pr-4 -mr-4">
                  <div className="space-y-4">
                    {messages.length === 0 ? (
                      <div className={`text-center flex items-center justify-center h-full text-white`}>
                        Upload a document or Start a conversation...
                      </div>
                    ) : (
                      messages.map((message, index) => (
                        <div
                          key={index}
                          className={`flex ${
                            message.type === 'user' ? 'justify-end' : 'justify-start'
                          } animate-fade-in`}
                        >
                          <div
                            className={`p-3 rounded-sm ${
                              message.type === 'user'
                                ? 'bg-primary text-white text-right'
                                : 'bg-primary text-white text-left'
                            }`}
                            style={{
                              wordWrap: 'break-word',
                              display: 'inline-block',
                              maxWidth: '70%',
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
                            ) : message.type === 'agent' ? (
                              message.text === 'Processing your request...' ? (
                                <span className="flex items-center">
                                  Processing your request
                                  <LoadingSpinner />
                                  </span>
                              ) : (
                                <ReactMarkdown>{message.text}</ReactMarkdown>
                              )
                            ) : (
                              message.text
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
                      e.key === 'Enter' && handleSendMessage()
                    }
                    placeholder="Send a message..."
                    className="w-full bg-gray-950 text-white border pl-4 pr-20 py-5 outline-none focus:border-primary"
                    disabled={isLoading}
                  />

                  <div className="absolute right-4 top-1/2 -translate-y-1/2 flex gap-4">
                    <Button
                      onClick={handleSendMessage}
                      className="transition-colors duration-300 text-white"
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
            accept=".csv"
            className="hidden"
            onChange={handleFileUpload}
            disabled={isLoading}
          />
        </>
      ) : (
        <div className="text-center">Please login to continue...</div>
      )}
    </div>
  );
};

export default chats;