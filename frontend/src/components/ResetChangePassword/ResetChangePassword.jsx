// ResetChangePassword.jsx
import React, {useState} from 'react';
import {useNavigate} from 'react-router-dom';
import styles from './ResetChangePassword.module.scss';
import {FaEye, FaEyeSlash} from 'react-icons/fa';
import {logToServer} from "../../services/logger";

const ResetChangePassword = ({uidb64, token}) => {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const navigate = useNavigate();

  const handleChangePassword = async (e) => {
    e.preventDefault();

    if (newPassword !== confirmPassword) {
      setError('Новые пароли не совпадают');
      return;
    }

    try {
      let url = '/api/reset-change-password/';
      let headers = {
        'Content-Type': 'application/json',
      };
      let body = {
        new_password: newPassword,
        uidb64: uidb64,
        token: token,
      };

      const response = await fetch(url, {
        method: 'POST',
        headers: headers,
        body: JSON.stringify(body),
      });

      const data = await response.json();

      if (response.ok) {
        setSuccess('Пароль успешно изменен');
        setTimeout(() => navigate('/auth'), 2000);
      } else {
        if (data.message) {
          setError(data.message);
        } else {
          setError('Произошла ошибка при изменении пароля');
        }
      }
    } catch (error) {
      logToServer(`Ошибка при изменении пароля: ${error.message}`, 'error');
      setError('Произошла ошибка при отправке запроса');
    }
  };

  return (
    <div className={styles.changePassword}>
      <div className={styles.changePasswordContainer}>
        <div className={styles.changePasswordFormWrapper}>
          <h2>{'Сброс пароля'}</h2>
          {error && <div className={styles.error}>{error}</div>}
          {success && <div className={styles.success}>{success}</div>}
          <form onSubmit={handleChangePassword}>
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
                                    {showPassword ? <FaEyeSlash/> : <FaEye/>}
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
                                    {showPassword ? <FaEyeSlash/> : <FaEye/>}
                                </span>
              </div>
            </div>
            <button type="submit">
              {'Сбросить пароль'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetChangePassword;
