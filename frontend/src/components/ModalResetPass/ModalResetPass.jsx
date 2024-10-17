// ModalResetPass.jsx
import React, { useState } from 'react';
import styles from './ModalResetPass.module.scss';

const ModalResetPass = ({isOpen, onClose, message, email, setEmail, onResetPassword}) => {
  const [showSuccessMessage, setShowSuccessMessage] = useState(false);

  if (!isOpen) return null;

  const handleEmailChange = (e) => {
    setEmail(e.target.value);
  };

  const handleResetPassword = () => {
    onResetPassword().then(() => {
      setShowSuccessMessage(true);
      setTimeout(() => {
        setShowSuccessMessage(false);
        onClose();
      }, 3000);
    });
  };

  return (
    <div className={styles.modalOverlay}>
      <div className={styles.modal}>
        <div className={styles.modalContent}>
          <h1>Сброс пароля</h1>
          {showSuccessMessage ? (
            <p>На ваш email отправлена ссылка для сброса пароля.</p>
          ) : (
            <>
              <p>{message}</p>
              <input
                type="email"
                placeholder="Введите ваш email"
                value={email}
                onChange={handleEmailChange}
                className={styles.emailInput}
                required
              />
              <button className={styles.button_reset} onClick={handleResetPassword}>Сбросить пароль</button>
            </>
          )}
          <button className={styles.button_reset} onClick={onClose}>Закрыть</button>
        </div>
      </div>
    </div>
  );
};

export default ModalResetPass;
