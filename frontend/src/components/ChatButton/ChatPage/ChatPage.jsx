import React, {useState, useEffect, useRef} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './ChatPage.module.scss';

const ChatPage = () => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const lastMessageId = useRef(0);
  const messagesEndRef = useRef(null);
  const [isPolling, setIsPolling] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      setIsAuthenticated(true);
      fetchMessages(token);
    } else {
      navigate('/auth');
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({behavior: 'smooth'});
    }
  }, [messages]);

  const fetchMessages = async (token) => {
    try {
      const response = await fetch('/api/messages/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (response.ok) {
        const data = await response.json();
        setMessages(data);
        if (data.length > 0) {
          lastMessageId.current = data[data.length - 1].id;
        }
      } else {
        console.error('Failed to fetch messages');
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const longPolling = async () => {
    const token = localStorage.getItem('token');
    while (isPolling) {
      const controller = new AbortController();
      try {
        const response = await fetch(`/api/long-polling/messages/?last_message_id=${lastMessageId.current}`, {
          signal: controller.signal,
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (response.ok) {
          const newMessages = await response.json();
          if (newMessages.length > 0) {
            setMessages(prevMessages => {
              const messageIds = new Set(prevMessages.map(msg => msg.id));
              const filteredNewMessages = newMessages.filter(msg => !messageIds.has(msg.id));
              if (filteredNewMessages.length > 0) {
                lastMessageId.current = filteredNewMessages[filteredNewMessages.length - 1].id; // Обновляем lastMessageId
              }
              return [...prevMessages, ...filteredNewMessages];
            });
          }
        }
      } catch (error) {
        if (error.name !== 'AbortError') {
          console.error('Error during long polling:', error);
        }
      }
      await new Promise(resolve => setTimeout(resolve, 20000)); // Пауза перед следующим запросом
    }
  };

  useEffect(() => {
    if (isAuthenticated) {
      longPolling();
    }
  }, [isAuthenticated]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch('/api/messages/create/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({content: newMessage, is_admin: false})
    });
    if (response.ok) {
      const data = await response.json();
      setMessages(prevMessages => {
        const messageExists = prevMessages.some(msg => msg.id === data.id);
        if (!messageExists) {
          return [...prevMessages, data];
        }
        return prevMessages;
      });
      setNewMessage('');
    } else {
      console.error('Failed to send message');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage(e);
    }
  };

  return (
    <div className={styles.chatPage}>
      <div className={styles.chatContainer}>
        <div className={styles.chatHeader}>
          <h2>Чат</h2>
        </div>
        <div className={styles.chatWindow}>
          {messages.map((message, index) => (
            <div
              key={index}
              className={`${styles.message} ${message.is_admin ? styles.adminMessage : styles.userMessage} `}
            >
              <strong>{message.user_name || "Unknown"}:</strong> {message.content}
              <div className={styles.timestamp}>{new Date(message.timestamp).toLocaleString()}</div>
            </div>
          ))}
          <div ref={messagesEndRef}/>
        </div>
        <form onSubmit={handleSendMessage} className={styles.chatInput}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите ваше сообщение..."
            required
          />
          <button className={styles.send__button} type="submit">Отправить</button>
        </form>
      </div>
    </div>
  );
};

export default ChatPage;
