// ResetPassword.jsx
import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import styles from './ResetPassword.module.scss';
import ResetChangePassword from "../ResetChangePassword/ResetChangePassword";
import { logToServer } from "../../services/logger";

const ResetPassword = () => {
  const { uidb64, token } = useParams();
  const [isValidToken, setIsValidToken] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    const validateToken = async () => {
      if (!uidb64 || !token) {
        setMessage('Неверная ссылка для сброса пароля.');
        return;
      }

      try {
        const response = await fetch(`/api/reset-password/${uidb64}/${token}/`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          setIsValidToken(true);
        } else {
          const errorData = await response.json();
          setMessage(errorData.error || 'Ссылка для сброса пароля недействительна или устарела.');
        }
      } catch (error) {
        logToServer(`Ошибка при проверке токена: ${error.message}`, 'error');
        setMessage('Произошла ошибка при проверке ссылки. Попробуйте позже.');
      }
    };

    validateToken();
  }, [uidb64, token]);

  if (isValidToken) {
    return <ResetChangePassword isResetPassword={true} uidb64={uidb64} token={token} />;
  }

  return (
    <div className={styles.resetPassword}>
      <h2>Сброс пароля</h2>
      {message && <p className={styles.message}>{message}</p>}
      {!isValidToken && !message && <p>Проверка ссылки для сброса пароля...</p>}
    </div>
  );
};

export default ResetPassword;