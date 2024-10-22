// ShopPage.jsx
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import styles from './ShopPage.module.scss';
import { logToServer } from "../../services/logger";

const ShopPage = () => {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [isBurgerMenuOpen, setIsBurgerMenuOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [productsResponse, categoriesResponse] = await Promise.all([
          fetch('/api/products/'),
          fetch('/api/categories/')
        ]);

        const productsData = await productsResponse.json();
        const categoriesData = await categoriesResponse.json();

        setProducts(productsData);
        setCategories(categoriesData);
      } catch (error) {
        logToServer(`Ошибка при получении данных: ${error.message}`, 'error');
      }
    };

    fetchData();
  }, []);

  const filteredProducts = selectedCategory
    ? products.filter(product => product.category === selectedCategory)
    : products;

  return (
    <div className={styles.shopContainer}>
      <div className={styles.categoriesWrapper}>
        <div className={styles.categoriesContainer}>
          <ul>
            {categories
              .filter(category => {
                return category.id !== 6;
              })
              .map(category => (
                <li key={category.id}>
                  <button
                    className={selectedCategory === category.id ? styles.activeCategory : ''}
                    onClick={() => setSelectedCategory(category.id)}
                  >
                    {category.name}
                  </button>
                </li>
              ))}
            <br/>
            <li>
              <button
                className={selectedCategory === null ? styles.activeCategory : ''}
                onClick={() => setSelectedCategory(null)}
              >
                все категории
              </button>
            </li>
          </ul>
        </div>
      </div>
      <div className={styles.productsContainer}>
        <div className={styles.productsGrid}>
          {Array.isArray(filteredProducts) && filteredProducts.length > 0 ? (
            filteredProducts.map((product, index) => (
              <div
                key={product.id}
                className={styles.productCard}
              >
                <Link to={`/product/${product.id}`}>
                  <div className={styles.productImage}>
                    {product.images && product.images.length > 0 ? (
                      <img src={product.images[0]} alt={product.title} onError={(e) => {
                        e.target.onerror = null;
                        e.target.src = 'https://via.placeholder.com/100';
                      }}/>
                    ) : (
                      <img src='https://via.placeholder.com/100' alt={product.title}/>
                    )}
                  </div>
                  <h3 className={styles.productTitle}>{product.title}</h3>
                  <p className={styles.productDescription}>{product.description}</p>
                  <p className={styles.productPrice}>Цена: {product.price} руб.</p>
                  <button className={styles.productButton}>ПОДРОБНЕЕ</button>
                </Link>
              </div>
            ))
          ) : (
            <h2 className={styles.productNot}>Нет доступных товаров</h2>
          )}
        </div>
      </div>
      <div className={styles.burgerMenu}>
        <button className={styles.burgerButton} onClick={() => setIsBurgerMenuOpen(!isBurgerMenuOpen)}>
          {isBurgerMenuOpen ? 'Закрыть категории' : 'Открыть категории'}
        </button>
        {isBurgerMenuOpen && (
          <div className={styles.burgerMenuOpen}>
            <ul>
              {categories
                .filter(category => category.id !== 6)
                .map(category => (
                  <li key={category.id}>
                    <button
                      className={selectedCategory === category.id ? styles.activeCategory : ''}
                      onClick={() => setSelectedCategory(category.id)}
                    >
                      {category.name}
                    </button>
                  </li>
                ))}
              <br />
              <li>
                <button
                  className={selectedCategory === null ? styles.activeCategory : ''}
                  onClick={() => setSelectedCategory(null)}
                >
                  все категории
                </button>
              </li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ShopPage;
