// Profile.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import styles from './Profile.module.scss';
import Modal from '../../components/Modal/Modal.jsx';
import defaultAvatar from '../../assets/default_user_icon.png';
import { logToServer } from "../../services/logger";

const Profile = () => {
  const {user, fetchUserData, logout} = useAuth();
  const navigate = useNavigate();
  const [avatar, setAvatar] = useState(null);
  const [avatarUrl, setAvatarUrl] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMessage, setModalMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [isProfileFetched, setIsProfileFetched] = useState(false);
  const [isAvatarSelected, setIsAvatarSelected] = useState(false);

  const fetchUserDetails = useCallback(async () => {
    setIsLoading(true);
    try {
      await fetchUserData();
      if (user) {
        const avatarResponse = await fetch('/api/profile/avatar/', {
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
        });

        if (avatarResponse.ok) {
          const data = await avatarResponse.json();
          setAvatarUrl(`${data.avatar}`);
        } else {
          logToServer(`Ошибка при получении аватара: ${avatarResponse.statusText}`, 'error');
        }
      }
    } catch (error) {
      logToServer(`Ошибка при получении данных пользователя: ${error.message}`, 'error');
    } finally {
      setIsLoading(false);
    }
  }, [fetchUserData, user]);

  useEffect(() => {
    if (!isProfileFetched) {
      fetchUserDetails();
      setIsProfileFetched(true);
    }
  }, [fetchUserDetails, isProfileFetched]);

  const handleLogout = () => {
    logout();
    navigate('/auth');
  };

  const handleMasterclassAccess = (masterclass) => {
    if (user?.groups?.includes('VIP')) {
      navigate(`/masterclass`);
    } else {
      setModalMessage('Доступ к этому мастер-классу закрыт. Пожалуйста, оплатите для доступа.');
      setIsModalOpen(true);
    }
  };

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setAvatarUrl(reader.result);
        setAvatar(file);
        setIsAvatarSelected(true);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAvatarUpload = async () => {
    if (avatar) {
      const formData = new FormData();
      formData.append('avatar', avatar);

      try {
        const response = await fetch('/api/profile/avatar/', {
          method: 'PUT',
          headers: {
            'Authorization': `Token ${localStorage.getItem('token')}`,
          },
          body: formData,
        });

        if (response.ok) {
          alert('Аватар успешно загружен.');
          setIsAvatarSelected(false);
          fetchUserDetails();
        } else {
          alert('Ошибка при загрузке аватара.');
        }
      } catch (error) {
        setModalMessage('Ошибка при загрузке аватара.');
        setIsModalOpen(true);
        logToServer(`Ошибка при загрузке аватара: ${error.message}`, 'error');
      }
    }
  };

  if (isLoading) {
    return <div>Загрузка...</div>;
  }

  if (!user) {
    return <div>Пользователь не найден. Пожалуйста, <Link to="/auth">войдите в систему</Link>.</div>;
  }

  return (
    <div className={styles.profile}>
      <div className={styles.cardProfile}>
        <h3>Профиль</h3>
        <div className={styles.profileInfo}>
          <img
            src={avatarUrl || defaultAvatar}
            alt="User"
            className={styles.userIcon}
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = defaultAvatar;
            }}
          />
          <div className={styles.userInfo}>
            <p className={styles.userName}><strong>Имя пользователя:</strong> {user.username}</p>
            <br/>
            <p className={styles.userName}><strong>Email:</strong> {user.email}</p>
          </div>
        </div>
        <input
          type="file"
          accept="image/*"
          onChange={handleAvatarChange}
          style={{display: 'none'}}
          id="avatarUpload"
        />
        <div className={styles.textAvatarAddBlock}>
          {!avatarUrl && !isAvatarSelected ? (
            <label htmlFor="avatarUpload" className={styles.customFileUpload}>
              Выберите файл
            </label>
          ) : isAvatarSelected ? (
            <div className={styles.profile__addButton} onClick={handleAvatarUpload}>
              Загрузить аватар
            </div>
          ) : (
            <label htmlFor="avatarUpload" className={styles.customFileUpload}>
              Изменить аватар
            </label>
          )}
          <input
            type="file"
            accept="image/*"
            onChange={handleAvatarChange}
            style={{display: 'none'}}
            id="avatarUpload"
          />
          <Link to="/change-password" className={styles.profile__link}>Изменить пароль</Link>
          <div onClick={handleLogout} className={styles.profile__logoutButton}>
            Выйти
          </div>
        </div>
      </div>

      <div className={styles.cardMasterClasses}>
        <h3>Доступные мастер-классы</h3>
        {user.groups?.includes('VIP') ? (
          <ul>
            <li onClick={() => handleMasterclassAccess('marena-garden')}>
              <button className={styles.masterclass}>Цветной фон</button>
            </li>
          </ul>
        ) : (
          <p>Нет доступных мастер-классов</p>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        message={modalMessage}
      />
    </div>
  );
};

export default Profile;
