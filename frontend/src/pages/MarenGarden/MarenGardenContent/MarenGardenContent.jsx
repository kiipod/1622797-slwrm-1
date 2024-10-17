// MarenGardenContent.jsx
import React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './MarenGardenContent.module.scss';

const MarenGardenContent = ({ marenGardenChapters = [] }) => {
  const { chapterId } = useParams();
  const navigate = useNavigate();

  const currentChapter = marenGardenChapters.find((ch) => ch.id === parseInt(chapterId));

  const handleChapterChange = (newChapterId) => {
    navigate(`/masterclass/${newChapterId}`);
  };

  const handleGoBack = () => {
    navigate('/masterclass');
  };

  if (!currentChapter) {
    return <p>Раздел не найден</p>;
  }

  return (
    <div className={styles.content}>
      {/* Sidebar скрывается на мобильных устройствах */}
      <div className={styles.sidebar}>
        <ol>
          {marenGardenChapters.map((chapter) => (
            <li
              key={chapter.id}
              onClick={() => handleChapterChange(chapter.id)}
              className={chapter.id === parseInt(chapterId) ? styles.activeChapter : ''}
            >
              {chapter.title}
            </li>
          ))}
        </ol>
      </div>

      {/* Контент раздела отображается в полном виде на мобильных устройствах */}
      <div className={styles.chapterContent}>
        {currentChapter.content}
        {/* Кнопка назад для мобильных устройств */}
        <button onClick={handleGoBack} className={styles.backButton}>
          Назад
        </button>
      </div>
    </div>
  );
};

export default MarenGardenContent;
