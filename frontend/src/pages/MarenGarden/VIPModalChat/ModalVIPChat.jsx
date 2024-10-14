import React, { useState, useEffect, useRef } from 'react';
import styles from '../../../components/ChatButton/ModalChat/ModalChat.module.scss';

const ModalVIPChat = ({ onClose }) => {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const lastMessageId = useRef(0); // Отслеживание последнего сообщения
  const [isPolling, setIsPolling] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (token) {
      const fetchInitialMessages = async () => {
        const response = await fetch('/api/vip-messages/', {
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
      };

      fetchInitialMessages();
      longPolling();
    }

    return () => {
      setIsPolling(false); // Остановить long polling при размонтировании компонента
    };
  }, []);

  const longPolling = async () => {
    const token = localStorage.getItem('token');
    while (isPolling) {
      try {
        const response = await fetch(`/api/vip-messages/long-polling/?last_message_id=${lastMessageId.current}`, {
          headers: {
            'Authorization': `Token ${token}`
          }
        });
        if (response.ok) {
          const newMessages = await response.json();
          if (newMessages.length > 0) {
            setMessages(prevMessages => [...prevMessages, ...newMessages]);
            lastMessageId.current = newMessages[newMessages.length - 1].id;
          }
        } else {
          console.error('Error in long polling response:', response.status, response.statusText);
        }
      } catch (error) {
        console.error('Error during long polling:', error);
      }

      // Делаем паузу перед следующей итерацией
      await new Promise(resolve => setTimeout(resolve, 40000));
    }
  };

  const addMessage = (message) => {
    setMessages(prevMessages => [...prevMessages, message]);
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    const token = localStorage.getItem('token');
    const response = await fetch('/api/vip-messages/create/', {
      method: 'POST',
      headers: {
        'Authorization': `Token ${token}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ content: newMessage, is_admin: false })
    });
    if (response.ok) {
      const data = await response.json();
      addMessage(data);
      setNewMessage('');  // Сброс текста в поле ввода
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
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalHeader}>
          <h2>Чат для участников мастер-класса</h2>
          <div className={styles.modalButton} onClick={onClose}>Закрыть</div>
        </div>
        <div className={styles.chatWindow}>
          {messages.map((message, index) => (
            <div key={index} className={`${styles.message} ${message.is_admin ? styles.adminMessage : styles.userMessage}`}>
              <strong>{message.user}:</strong> {message.content}
              <div className={styles.timestamp}>{new Date(message.timestamp).toLocaleString()}</div>
            </div>
          ))}
        </div>
        <form onSubmit={handleSendMessage}>
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Введите ваше сообщение..."
            required
          />
          <button className={styles.modalButtonSend} type="submit">Отправить</button>
        </form>
      </div>
    </div>
  );
};

export default ModalVIPChat;
