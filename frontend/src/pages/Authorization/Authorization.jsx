// Authorization.jsx
import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import styles from './Authorization.module.scss';
import ModalResetPass from '../../components/ModalResetPass/ModalResetPass.jsx';
import { handleLogin, handleRegistration, handleResetPassword } from './authFunctions';
import { FaEye, FaEyeSlash } from 'react-icons/fa';
import { logToServer } from "../../services/logger";

const Authorization = ({initialMode = 'login', setAuthMode}) => {
  const [mode, setMode] = useState(initialMode);
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [resetEmail, setResetEmail] = useState('');
  const [loginAttempts, setLoginAttempts] = useState(0);
  const [isCheckboxChecked, setIsCheckboxChecked] = useState(false);
  const navigate = useNavigate();
  const {isLoggedIn, login} = useAuth();

  useEffect(() => {
    if (isLoggedIn && mode !== 'changePassword') {
      navigate('/');
    }
  }, [isLoggedIn, navigate, mode]);

  useEffect(() => {
    if (setAuthMode) {
      setAuthMode(mode);
    }
  }, [mode, setAuthMode]);

  const validateUsername = (username) => {
    if (username.includes(' ')) {
      setModalMessage('Имя пользователя не должно содержать пробелов');
      setIsModalOpen(true);
      return false;
    }
    return true;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setModalMessage('');

    if (mode === 'register' && !validateUsername(username)) {
      return;
    }

    try {
      switch (mode) {
        case 'login':
          await handleLogin(username, password, login, navigate, setError, setLoginAttempts);
          if (loginAttempts + 1 >= 3) {
            setModalMessage('Неверные учетные данные. Хотите сбросить пароль?');
            setIsModalOpen(true);
          }
          break;
        case 'register':
          if (isCheckboxChecked) {
            await handleRegistration(
              password,
              confirmPassword,
              username,
              email,
              setError,
              setModalMessage,
              setIsModalOpen,
              login,
              navigate
            );
          } else {
            setModalMessage('Пожалуйста, дайте согласие на обработку персональных данных');
            setIsModalOpen(true);
          }
          break;
        default:
          logToServer(`Неизвестный режим: ${mode}`, 'error');
      }
    } catch (error) {
      logToServer(`Ошибка при обработке формы: ${error.message}`, 'error');
      setModalMessage('Произошла ошибка. Пожалуйста, попробуйте еще раз.');
      setIsModalOpen(true);
    }
  };

    const handleResetPasswordClick = async () => {
    try {
      await handleResetPassword(
        resetEmail,
        (errorMessage) => {
          if (errorMessage) {
            setError(errorMessage);
          }
        },
        (modalMessage) => {
          setModalMessage(modalMessage);
          setIsModalOpen(true);
        },
        setIsModalOpen,
        setMode
      );
    } catch (error) {
      logToServer(`Ошибка при обработке сброса пароля: ${error.message}`, 'error');
      setModalMessage('Произошла ошибка при отправке запроса на сброс пароля.');
      setIsModalOpen(true);
    }
    };

  const handleModalClose = () => {
    setIsModalOpen(false);
  };

  return (
    <div className={styles.registrationForm}>
      <div className={styles.registrationContainer}>
        <div className={styles.registrationFormWrapper}>
          <h2>{mode === 'login' ? 'Войти' : 'Зарегистрироваться'}</h2>
          {error && <div className={styles.error}>{error}</div>}
          <form onSubmit={handleSubmit}>
            <div className={styles.formGroup}>
              <input
                type="text"
                id="username"
                placeholder="Имя пользователя"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            {mode === 'register' && (
              <div className={styles.formGroup}>
                <input
                  type="email"
                  id="email"
                  placeholder="Email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                />
              </div>
            )}
            <div className={styles.formGroup}>
              <div className={styles.passwordWrapper}>
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  placeholder="Пароль"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <span
                  className={styles.passwordToggle}
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <FaEyeSlash/> : <FaEye/>}
                </span>
              </div>
              {mode === 'register' && (
                <div className={styles.passwordWrapper}>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="confirmPassword"
                    placeholder="Подтвердите пароль"
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
              )}
            </div>
            {mode === 'register' && (
              <div className={styles.checkboxContainer}>
                <input
                  type="checkbox"
                  id="agreement"
                  checked={isCheckboxChecked}
                  onChange={() => setIsCheckboxChecked(!isCheckboxChecked)}
                  required
                />
                <label htmlFor="agreement">
                  Я даю согласие на обработку персональных данных и соглашаюсь с
                  <br/>
                  <Link className={styles.privacyPolicyLink} to="/privacy-policy" target="_blank"
                        rel="noopener noreferrer">
                    Политикой обработки персональных данных
                  </Link>
                </label>
              </div>
            )}
            <div className={styles.buttonContainer}>
              <button type="submit" disabled={mode === 'register' && !isCheckboxChecked}>
                {mode === 'login' ? 'Войти' : 'Зарегистрироваться'}
              </button>
              {mode === 'login' ? (
                <button type="button" onClick={() => setMode('register')}>Зарегистрироваться</button>
              ) : (
                <button type="button" onClick={() => setMode('login')}>Войти</button>
              )}
            </div>
          </form>
        </div>
      </div>
      <ModalResetPass
        isOpen={isModalOpen}
        onClose={handleModalClose}
        message={modalMessage}
        email={resetEmail}
        setEmail={setResetEmail}
        onResetPassword={loginAttempts >= 3 ? handleResetPasswordClick : undefined}
      />
    </div>
  );
};

export default Authorization;