import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  Box,
  Typography,
  IconButton,
  Divider,
  TextField,
  Button,
  CircularProgress,
} from '@mui/material';
import { Close, Send } from '@mui/icons-material';
import { styled } from '@mui/material/styles';
import { useChatRoom } from '../../hooks/useChatRoom';

const PanelContainer = styled(Box)(({ theme }) => ({
  width: 360,
  maxWidth: '100%',
  height: '100%',
  backgroundColor: theme.palette.background.paper,
  borderLeft: `1px solid ${theme.palette.divider}`,
  display: 'flex',
  flexDirection: 'column',
}));

const MessagesContainer = styled(Box)(() => ({
  flex: 1,
  overflowY: 'auto',
  padding: '16px',
  display: 'flex',
  flexDirection: 'column',
  gap: '12px',
}));

const MessageBubble = styled(Box)(({ theme, variant }) => ({
  alignSelf: variant === 'own' ? 'flex-end' : 'flex-start',
  background:
    variant === 'own'
      ? `linear-gradient(135deg, ${theme.palette.primary.main}, ${theme.palette.primary.dark})`
      : theme.palette.background.default,
  color: variant === 'own' ? theme.palette.primary.contrastText : theme.palette.text.primary,
  padding: theme.spacing(1.25, 1.5),
  borderRadius: 14,
  maxWidth: '80%',
  boxShadow: theme.shadows[4],
  border: variant === 'own' ? 'none' : `1px solid ${theme.palette.divider}`,
}));

const MessageMeta = styled(Typography)(({ theme, variant }) => ({
  fontSize: 11,
  marginTop: theme.spacing(0.5),
  opacity: 0.7,
  textAlign: variant === 'own' ? 'right' : 'left',
}));

const formatTime = (value) => {
  if (!value) {
    return '';
  }
  try {
    return new Intl.DateTimeFormat(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(value));
  } catch (error) {
    return '';
  }
};

export const ChatPanel = ({ videoId, videoTitle, open, onClose }) => {
  const { messages, sendMessage, connection, user } = useChatRoom(videoId, open);
  const [inputValue, setInputValue] = useState('');
  const [sending, setSending] = useState(false);
  const messagesEndRef = useRef(null);

  const canChat = useMemo(() => Boolean(user && connection.isConnected), [user, connection]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  useEffect(() => {
    if (!open) {
      setInputValue('');
    }
  }, [open]);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!inputValue.trim() || !videoId) {
      return;
    }
    setSending(true);
    try {
      await sendMessage(inputValue);
      setInputValue('');
    } catch (error) {
      console.error('Unable to send chat message:', error);
    } finally {
      setSending(false);
    }
  };

  if (!open) {
    return null;
  }

  return (
    <PanelContainer>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          p: 2,
        }}
      >
        <Box>
          <Typography variant="subtitle2" color="text.secondary">
            Live Chat
          </Typography>
          <Typography variant="h6" noWrap>
            {videoTitle || 'Now Playing'}
          </Typography>
        </Box>
        {onClose && (
          <IconButton size="small" onClick={onClose}>
            <Close fontSize="small" />
          </IconButton>
        )}
      </Box>
      <Divider />

      <MessagesContainer>
        {connection.status === 'connecting' && (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 1,
              color: 'text.secondary',
            }}
          >
            <CircularProgress size={18} />
            <Typography variant="body2">Connecting to chat…</Typography>
          </Box>
        )}

        {connection.status === 'error' && (
          <Typography variant="body2" color="error">
            {connection.error || 'Unable to load chat right now.'}
          </Typography>
        )}

        {connection.status !== 'error' && messages.length === 0 && connection.isConnected && (
          <Typography variant="body2" color="text.secondary">
            Be the first to start the conversation.
          </Typography>
        )}

        {messages.map((message) => {
          const variant = message.userId === user?.id ? 'own' : 'default';
          return (
            <Box key={message.id} sx={{ display: 'flex', flexDirection: 'column', gap: 0.5 }}>
              <Typography
                variant="caption"
                color={variant === 'own' ? 'text.secondary' : 'text.disabled'}
              >
                {message.userName}
              </Typography>
              <MessageBubble variant={variant}>{message.content}</MessageBubble>
              <MessageMeta variant={variant}>{formatTime(message.createdAt)}</MessageMeta>
            </Box>
          );
        })}
        <div ref={messagesEndRef} />
      </MessagesContainer>

      <Divider />

      <Box
        component="form"
        onSubmit={handleSubmit}
        sx={{
          p: 2,
          borderTop: (theme) => `1px solid ${theme.palette.divider}`,
        }}
      >
        <TextField
          value={inputValue}
          onChange={(event) => setInputValue(event.target.value)}
          placeholder={canChat ? 'Share your thoughts…' : 'Chat will be available soon'}
          fullWidth
          multiline
          maxRows={3}
          disabled={!canChat || sending}
          InputProps={{
            endAdornment: (
              <Button
                type="submit"
                variant="contained"
                size="small"
                sx={{ ml: 1, minWidth: 0, px: 2 }}
                disabled={!canChat || sending || !inputValue.trim()}
                endIcon={<Send fontSize="small" />}
              >
                Send
              </Button>
            ),
          }}
        />
      </Box>
    </PanelContainer>
  );
};
