// logger.js
import { getCookie } from "../pages/Authorization/authFunctions";

// Получаем CSRF-токен
const csrfToken = getCookie('csrftoken');

export const logToServer = async (message, level = 'info') => {
  try {
    const response = await fetch('/api/logs/', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRFToken': csrfToken,
      },
      body: JSON.stringify({
        message,
        level,
        timestamp: new Date().toISOString(),
      }),
      credentials: 'include',
    });

    if (!response.ok) {
      console.error('Failed to send log to server');
    }
  } catch (error) {
    console.error('Error sending log:', error);
  }
};
