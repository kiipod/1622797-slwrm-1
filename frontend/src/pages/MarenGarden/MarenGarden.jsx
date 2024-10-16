import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import styles from './MarenGarden.module.scss';

const MarenGarden = ({ marenGardenChapters = [] }) => {
  return (
    <div className={styles.masterclass}>
      <h2>Мастер-класс "Цветной фон".</h2>
      <p>Благодарю вас за то, что вы обратили внимание на моё творчество и приобрели этот мастер-класс. Надеюсь, это вдохновило вас на создание прекрасных и неповторимых шедевров, создаваемых вместе с природой.</p>
      <p>Если у вас остались какие-то вопросы, пожалуйста, напишите мне. Я обязательно на них отвечу.</p>
      <p>Этот мастер-класс лишь "вершина айсберга" бездонного океана экопринта.</p>
      <p>Экспериментируйте, творите, а я всегда помогу вам в этом.</p>

      {/* Секция с главами мастер-класса */}
      <div className={styles.chapters}>
        {marenGardenChapters.map((chapter, index) => (
          <motion.div
            key={chapter.id}
            className={styles.chapter}
            initial={{ opacity: index < 2 ? 1 : 0, x: index % 2 === 0 ? '-100vw' : '100vw' }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ type: 'spring', stiffness: 360 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, amount: 0.8 }}
          >
            <div className={styles.chapterContent}>
              <div className={styles.chapterNumber}>{chapter.id}</div>
              <Link to={`/masterclass/${chapter.id}`} className={styles.link}>
                <h3>{chapter.title}</h3>
              </Link>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Вкладка Часто задаваемые вопросы */}
      <div className={styles.faqSection}>
        <h3>Часто задаваемые вопросы</h3>
        <ul>
          <li><strong>Вопрос 1:</strong> Как долго доступен мастер-класс?</li>
          <li><strong>Ответ:</strong> Доступ к мастер-классу предоставляется бессрочно.</li>
          <li><strong>Вопрос 2:</strong> Могу ли я скачать видео мастер-класса?</li>
          <li><strong>Ответ:</strong> Нет, видео доступны только для просмотра онлайн.</li>
          <li><strong>Вопрос 3:</strong> Как задать вопрос автору?</li>
          <li><strong>Ответ:</strong> Вы можете связаться со мной через форму обратной связи на сайте или через наш закрытый Telegram-канал.</li>
        </ul>
      </div>
    </div>
  );
};

export default MarenGarden;
