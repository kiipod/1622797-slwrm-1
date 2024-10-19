# urls.py в приложении main
from django.urls import path
from .views import (
    UserRegistrationView, UserLoginView, ResetPasswordView, ChangePasswordView,
    UserProfileView, landing_page, category_list, category_detail, product_list, product_detail,
    UserDetailView, AvatarUpdateView, MessageListView, MessageCreateView, ConfirmPasswordResetView,
    CartListView, CartCreateView, TelegramWebhookView, LongPollingMessageView,
    CartRemoveView, verify_token, LogoutView, ResetChangePasswordView, ClientLogView
)

urlpatterns = [
    path('', landing_page, name='landing_page'),
    path('register/', UserRegistrationView.as_view(), name='register'),
    path('verify-token/', verify_token, name='verify_token'),
    path('login/', UserLoginView.as_view(), name='login'),
    path('logout/', LogoutView.as_view(), name='logout'),
    path('user/', UserDetailView.as_view(), name='user_detail'),
    path('profile/', UserProfileView.as_view(), name='profile'),
    path('profile/avatar/', AvatarUpdateView.as_view(), name='avatar-update'),

    path('reset-password/', ResetPasswordView.as_view(), name='reset_password'),
    path('reset-password/<str:uidb64>/<str:token>/', ConfirmPasswordResetView.as_view(), name='password_reset_confirm'),
    path('change-password/', ChangePasswordView.as_view(), name='change_password'),
    path('reset-change-password/', ResetChangePasswordView.as_view(), name='reset_change_password'),

    path('categories/', category_list, name='category_list'),
    path('categories/<int:category_id>/', category_detail, name='category_detail'),

    path('products/', product_list, name='product_list'),
    path('products/<int:product_id>/', product_detail, name='product_detail'),

    path('messages/', MessageListView.as_view(), name='message-list'),
    path('messages/create/', MessageCreateView.as_view(), name='message-create'),
    path('telegram-webhook/', TelegramWebhookView.as_view(), name='telegram-webhook'),
    path('long-polling/messages/', LongPollingMessageView.as_view(), name='long_polling_messages'),

    path('cart/', CartListView.as_view(), name='cart-list'),
    path('cart/create/', CartCreateView.as_view(), name='cart-create'),
    path('cart/remove/<int:item_id>/', CartRemoveView.as_view(), name='cart-remove'),

    path('logs/', ClientLogView.as_view(), name='client-logs'),
]
