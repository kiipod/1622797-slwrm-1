// AuthContext.js
import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { logToServer } from "../services/logger";

export const AuthContext = createContext();

export const AuthProvider = ({children}) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [user, setUser] = useState(null);

  // Проверка статуса авторизации при загрузке компонента
  useEffect(() => {
    checkAuthStatus();
  }, []);

  // Функция проверки текущего статуса авторизации
  const checkAuthStatus = () => {
    const storedUser = localStorage.getItem('user');
    const token = localStorage.getItem('token');
    if (storedUser && token) {
      try {
        const parsedUser = JSON.parse(storedUser);
        setIsLoggedIn(true);
        setUser(parsedUser);
      } catch (error) {
        logToServer(`Ошибка при разборе JSON: ${error.message}`, 'error');
        logout();
      }
    } else {
      logout();
    }
  };

  // Функция получения данных пользователя с сервера
  const fetchUserData = useCallback(async () => {
    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const response = await fetch('/api/user/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setUser(data);
        localStorage.setItem('user', JSON.stringify(data));
      } else if (response.status === 401) {
        logout();
      } else {
        logToServer('Ошибка при обновлении данных пользователя', 'error');
      }
    } catch (error) {
      logToServer(`Ошибка при обновлении данных пользователя: ${error.message}`, 'error');
    }
  }, []);

  // Функция входа
  const login = (userData, token) => {
    localStorage.setItem('user', JSON.stringify(userData));
    localStorage.setItem('token', token);
    setIsLoggedIn(true);
    setUser(userData);
  };

  // Функция выхода
  const logout = async () => {
    const token = localStorage.getItem('token');
    try {
      if (token) {
        await fetch('/api/logout/', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Token ${token}`,
          },
        });
      }
    } catch (error) {
      logToServer(`Ошибка при выходе из системы: ${error.message}`, 'error');
    } finally {
      // Очищаем данные локально вне зависимости от того, завершился ли запрос успешно
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      localStorage.removeItem('agreementChecked');
      setIsLoggedIn(false);
      setUser(null);
    }
  };

  return (
    <AuthContext.Provider value={{isLoggedIn, user, login, logout, fetchUserData}}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);