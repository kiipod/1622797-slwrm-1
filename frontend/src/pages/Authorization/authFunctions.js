// authFunction.jsx
import { logToServer } from "../../services/logger";

export function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      // Проверяем, начинается ли эта строка с нужного имени
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Получаем CSRF-токен
const csrfToken = getCookie('csrftoken');

export const handleLogin = async (username, password, login, navigate, setError, setLoginAttempts) => {
  try {
    const response = await fetch('/api/login/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({username, password}),
    });

    if (response.ok) {
      const data = await response.json();
      const userData = {
        id: data.user.id,
        username: data.user.username,
        email: data.user.email,
      };
      login(userData, data.user.token); // Передаем данные пользователя в функцию login
      navigate('/'); // Перенаправляем на главную страницу после успешного входа
    } else {
      const errorData = await response.json();
      setError(errorData.message || 'Неверный логин или пароль');
      setLoginAttempts((prevAttempts) => prevAttempts + 1);
    }
  } catch (error) {
    logToServer(`Ошибка входа: ${error.message}`, 'error');
    setError('Ошибка входа');
    setLoginAttempts((prevAttempts) => prevAttempts + 1);
  }
};

export const handleRegistration = async (password, confirmPassword, username, email, setError, setModalMessage, setIsModalOpen, login, navigate) => {
  if (password !== confirmPassword) {
    setError('Пароли не совпадают');
    setIsModalOpen(true);
    setModalMessage('Пароли не совпадают');
    return;
  }

  try {
    const response = await fetch('/api/register/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({username, email, password}),
    });

    const data = await response.json();

    if (response.ok) {
      // Успешная регистрация
      setModalMessage('Регистрация успешна! Выполняется вход...');
      setIsModalOpen(true);

      // Автоматический вход пользователя
      login({id: data.user_id, email: data.email}, data.token);

      setIsModalOpen(false);
      navigate('/');
    } else {
      setError(data.error || JSON.stringify(data) || 'Ошибка регистрации');
      setIsModalOpen(true);
      setModalMessage(data.error || JSON.stringify(data) || 'Ошибка регистрации');
    }
  } catch (error) {
    logToServer(`Ошибка регистрации: ${error.message}`, 'error');
    setError('Ошибка регистрации');
    setIsModalOpen(true);
    setModalMessage('Ошибка регистрации');
  }
};

// Функция для сброса пароля
export const handleResetPassword = async (email, setError, setModalMessage, setIsModalOpen, setMode) => {
  try {
    const response = await fetch('/api/reset-password/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({email}),
    });

    if (response.ok) {
      setModalMessage('Проверьте ваш email для инструкций по сбросу пароля.');
      setIsModalOpen(true);
      setMode('login');
    } else {
      setError('Ошибка при сбросе пароля');
    }
  } catch (error) {
    logToServer(`Ошибка при сбросе пароля: ${error.message}`, 'error');
    setModalMessage('Ошибка при сбросе пароля');
    setIsModalOpen(true);
  }
};