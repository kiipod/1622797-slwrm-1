// PaymentInstructionsPage.jsx
import React from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import styles from './PaymentInstructionsPage.module.scss';

const PaymentInstructionsPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { totalAmount } = location.state || {};

  if (!totalAmount) {
    navigate('/cart');
    return null;
  }

  return (
    <div className={styles.paymentInstructionsPage}>
      <h1>Благодарим за ваш выбор!</h1>
      <div className={styles.instructionsContainer}>
        <p>Дорогой покупатель,</p>
        <p>От всего сердца благодарю вас за то, что вы обратили внимание на моё творчество и решили приобрести эти
          уникальные изделия. Ваш выбор – это не просто покупка, это инвестиция в красоту и вдохновение, которые
          теперь будут окружать вас каждый день.</p>
        <h2>Инструкции по оплате</h2>
        <p>Чтобы завершить процесс покупки, выполните следующие шаги:</p>
        <ol>
          <li>Сумма к оплате: <strong>{totalAmount}</strong> рублей</li>
          <li>
            Способ оплаты:
            <p>Пожалуйста, переведите указанную сумму на карту:</p>
            <ul>
              <li>Номер карты: 2202 2062 6922 0393</li>
              <li>Получатель: Нина Александровна К.</li>
              <li>Банк получателя: Сбербанк</li>
            </ul>
          </li>
          <li>
            Подтверждение оплаты:
            <p>После осуществления перевода, пожалуйста, отправьте подтверждение платежа на
              email: <strong>
                <a href="mailto:koltsovaecoprint@yandex.ru">
                  koltsovaecoprint@yandex.ru
                </a>
              </strong>
            </p>
            Вы также можете подтвердить оплату через любой другой способ связи на нашем сайте.
          </li>
        </ol>
        <h2>Что дальше?</h2>
        <p>После получения подтверждения оплаты, мы незамедлительно приступим к подготовке вашего заказа.</p>
        <p>Я обязательно с вами свяжусь и мы договоримся как лучше доставить вам заказ.</p>
        <p>Если у вас возникнут какие-либо вопросы или пожелания, наша команда поддержки всегда готова помочь вам. Не
          стесняйтесь обращаться к нам любым из способов связи, указанным внизу сайта или в чате сайта.</p>
        <p>Еще раз благодарим вас за выбор моих изделий. Мы уверены, что приобретенные произведения искусства принесут
          в ваш дом гармонию и вдохновение.</p>
        <p>С искренним уважением и благодарностью,<br />
          Нина Кольцова<br />
          ДушуГрею<br />
          художник экопринта</p>
      </div>
      <button className={styles.backButton} onClick={() => navigate('/cart')}>
        Вернуться в корзину
      </button>
    </div>
  );
};

export default PaymentInstructionsPage;
