// ProductDetail.jsx
import React, { useEffect, useState, useContext } from 'react';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import styles from './ProductDetail.module.scss';
import VerticalGallery from '../../../components/VerticalGallery/VerticalGallery';
import { CartContext } from '../../../context/CartContext';
import { AuthContext } from "../../../context/AuthContext";
import LightboxModal from '../../../pages/GalleryPage/LightboxModal/LightboxModal';
import { logToServer } from "../../../services/logger";

const ProductDetail = () => {
  const { productId } = useParams();
  const [product, setProduct] = useState(null);
  const [notification, setNotification] = useState('');
  const { addToCart } = useContext(CartContext);
  const { isLoggedIn } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(null);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const response = await fetch(`/api/products/${productId}/`);
        if (!response.ok) {
          throw new Error('Failed to fetch product');
        }
        const data = await response.json();
        setProduct(data);
      } catch (error) {
        logToServer(`Ошибка при загрузке продукта: ${error.message}`, 'error');
        setNotification('Не удалось загрузить детали продукта');
      }

    };

    fetchProduct();
  }, [productId]);

  const handleAddToCart = () => {
    if (isLoggedIn) {
      addToCart(product);
      setNotification('Товар добавлен в корзину');
      setTimeout(() => setNotification(''), 3000);
    } else {
      navigate('/profile', { state: { from: location.pathname } });
    }
  };

  const renderContent = (content) => {
    return content.split('\n').map((paragraph, index) => (
      <p key={index}>{paragraph}</p>
    ));
  };

  const handleGoBack = () => {
    navigate('/shop');
  };

  const openLightbox = (index) => {
    setSelectedImageIndex(index);
    setLightboxOpen(true);
  };

  const closeLightbox = () => {
    setLightboxOpen(false);
    setSelectedImageIndex(null);
  };

  if (!product) return <div>Загрузка...</div>;

  return (
    <div className={styles.productDetail}>
      {notification && <div className={styles.notification}>{notification}</div>}
      <div className={styles.productContent}>
        <div className={styles.productImages}>
          {product.images && product.images.length > 0 && (
            <VerticalGallery
              images={product.images}
              onImageClick={openLightbox}
            />
          )}
        </div>

        <div className={styles.productInfo}>
          <h1>{product.title}</h1>
          <div className={styles.productText}>
            {renderContent(product.content)}
            <p className={styles.productPrice}>Цена: {product.price} руб.</p>
          </div>
          <button className={styles.addToCartButton} onClick={handleAddToCart}>
            {isLoggedIn ? 'Добавить в корзину' : 'Войти для покупки'}
          </button>
          <button onClick={handleGoBack} className={styles.backToShopButton}>
            Назад в магазин
          </button>
        </div>
      </div>

      {/* Lightbox for viewing images */}
      {lightboxOpen && (
        <LightboxModal
          images={product.images}
          selectedImageIndex={selectedImageIndex}
          closeLightbox={closeLightbox}
        />
      )}
    </div>
  );
};

export default ProductDetail;
