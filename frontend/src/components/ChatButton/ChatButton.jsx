import React from 'react';
import styles from './ChatButton.module.scss';
import { FaComments } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';

const ChatButton = () => {
  const navigate = useNavigate();

  const handleChatClick = () => {
    console.log('Navigating to chat page');
    navigate('/chat'); // Перенаправляем на страницу чата
  };

  return (
    <div className={styles.chatButton} onClick={handleChatClick}>
      <FaComments />
    </div>
  );
};

export default ChatButton;
