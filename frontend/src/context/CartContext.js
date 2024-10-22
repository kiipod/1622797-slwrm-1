// CartContext.jsx
import React, { createContext, useState, useCallback } from 'react';
import { logToServer } from "../services/logger";

export const CartContext = createContext();

export const CartProvider = ({children}) => {
  const [cartCount, setCartCount] = useState(0);

  const updateCartCount = useCallback((count) => {
    setCartCount(count);
  }, []);

  const addToCart = useCallback(async (item) => {
    const token = localStorage.getItem('token');
    if (!token) {
      logToServer('Токен не найден', 'error');
      return;
    }

    try {
      const response = await fetch('/api/cart/create/', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Token ${token}`
        },
        body: JSON.stringify({product_id: item.id})
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Ошибка при добавлении товара в корзину');
      }

      const cartResponse = await fetch('/api/cart/', {
        headers: {
          'Authorization': `Token ${token}`
        }
      });
      if (!cartResponse.ok) {
        throw new Error('Failed to fetch cart data');
      }
      const cartData = await cartResponse.json();
      if (Array.isArray(cartData) && cartData.length > 0 && Array.isArray(cartData[0].items)) {
        updateCartCount(cartData[0].items.length);
      } else {
        logToServer(`Недействительные данные корзины: ${cartData}`, 'error');
      }
    } catch (error) {
      logToServer(`Ошибка при добавлении продукта в корзину: ${error.message}`, 'error');
    }
  }, [updateCartCount]);

  const clearCart = useCallback(() => {
    setCartCount(0); // Очистка количества товаров в корзине
  }, []);

  return (
    <CartContext.Provider value={{cartCount, updateCartCount, addToCart, clearCart}}>
      {children}
    </CartContext.Provider>
  );
};
