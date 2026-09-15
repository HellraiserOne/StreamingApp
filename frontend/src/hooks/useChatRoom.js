import { useCallback, useEffect, useMemo, useState } from 'react';
import { chatService } from '../services/chat.service';
import { useAuth } from '../contexts/AuthContext';

const sortMessages = (messages = []) =>
  [...messages].sort(
    (a, b) => new Date(a.createdAt || 0) - new Date(b.createdAt || 0),
  );

export const useChatRoom = (videoId, isOpen) => {
  const { user, token } = useAuth();
  const [messages, setMessages] = useState([]);
  const [status, setStatus] = useState('idle');
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!videoId || !token || !isOpen) {
      setStatus('idle');
      setMessages([]);
      return undefined;
    }

    let active = true;
    setStatus('connecting');
    setError(null);

    const initialize = async () => {
      try {
        const history = await chatService.fetchHistory(videoId, 100, token);
        if (!active) return;
        setMessages(sortMessages(history));
      } catch (historyError) {
        console.error('Failed to load chat history:', historyError);
      }

      try {
        const response = await chatService.joinRoom(videoId, token);
        if (!active) return;
        if (response?.messages?.length) {
          setMessages((prev) => {
            const existingIds = new Set(prev.map((message) => message.id));
            const next = [...prev];
            response.messages.forEach((message) => {
              if (!existingIds.has(message.id)) {
                next.push(message);
              }
            });
            return sortMessages(next);
          });
        }
        setStatus('connected');
      } catch (joinError) {
        console.error('Unable to join chat room:', joinError);
        if (!active) return;
        setError(joinError.message);
        setStatus('error');
        return;
      }

      const handleIncomingMessage = (message) => {
        if (!message) {
          return;
        }
        setMessages((prev) => {
          if (prev.some((item) => item.id === message.id)) {
            return prev;
          }
          return [...prev, message];
        });
      };

      chatService.on('chat:message', handleIncomingMessage);

      return () => {
        chatService.off('chat:message', handleIncomingMessage);
      };
    };

    const cleanupPromise = initialize();

    return () => {
      active = false;
      chatService.leaveRoom(videoId);
      Promise.resolve(cleanupPromise)?.then((cleanupFn) => {
        if (typeof cleanupFn === 'function') {
          cleanupFn();
        }
      });
    };
  }, [videoId, token, isOpen]);

  const sendMessage = useCallback(
    async (content) => {
      if (!videoId || !content?.trim()) {
        return;
      }

      await chatService.sendMessage(videoId, content.trim());
    },
    [videoId],
  );

  const connection = useMemo(
    () => ({
      status,
      error,
      isConnected: status === 'connected',
    }),
    [status, error],
  );

  return {
    messages: sortMessages(messages),
    sendMessage,
    connection,
    user,
  };
};
