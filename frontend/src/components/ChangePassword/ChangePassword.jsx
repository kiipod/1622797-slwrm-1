// ChangePassword.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './ChangePassword.module.scss';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { logToServer } from "../../services/logger";
import { getCookie } from "../../pages/Authorization/authFunctions";

const ChangePassword = ({ isResetPassword = false, uidb64, token }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const { login } = useAuth();
  const navigate = useNavigate();
  const csrfToken = getCookie('csrftoken');

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    try {
      let url = '/api/change-password/';
      let headers = {
        'Content-Type': 'application/json',
        'Authorization': `Token ${localStorage.getItem('token')}`,
        'X-CSRFToken': csrfToken
      };
      let body = {
        new_password: newPassword,
        current_password: currentPassword
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        // Обновляем токен в локальном хранилище
        if (data.token) {
          localStorage.setItem('token', data.token);
          login({ id: data.user_id, email: data.email }, data.token);
        }
        setSuccess('Пароль успешно изменен');
        setTimeout(() => navigate('/profile'), 2000);
      } else {
        if (data.current_password) {
          setError(data.current_password[0]);
        } else if (data.new_password) {
          setError(data.new_password[0]);
        } else if (data.message) {
          setError(data.message);
        } else {
          setError('Произошла ошибка при изменении пароля');
        }
      }
    } catch (error) {
      logToServer(`Ошибка при изменении пароля: ${error.message}`, 'error'); // НЕ РАБОТАЕТ
      setError('Произошла ошибка при отправке запроса');
    }
  };

  return (
    <div className={styles.changePassword}>
      <div className={styles.changePasswordContainer}>
        <div className={styles.changePasswordFormWrapper}>
          <h2>{isResetPassword ? 'Сброс пароля' : 'Изменить пароль'}</h2>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <form onSubmit={handleChangePassword}>
            {!isResetPassword && (
              <div className={styles.formGroup}>
                <label htmlFor="currentPassword">Текущий пароль:</label>
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                  />
                  <span
                    className={styles.passwordToggle}
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </span>
                </div>
              </div>
            )}
            <div className={styles.formGroup}>
              <label htmlFor="newPassword">Новый пароль:</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="newPassword"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                />
                <span
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <div className={styles.formGroup}>
              <label htmlFor="confirmPassword">Подтвердите новый пароль:</label>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                />
                <span
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash /> : <FaEye />}
                </span>
              </div>
            </div>
            <button type="submit">
              {isResetPassword ? 'Сбросить пароль' : 'Изменить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ChangePassword;
