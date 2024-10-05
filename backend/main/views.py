# views.py
from django.http import JsonResponse
from django.shortcuts import render, get_object_or_404
from rest_framework.authtoken.models import Token
from django.conf import settings
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.views import View
from django.contrib.auth import login as auth_login, logout
from rest_framework.views import APIView
from rest_framework import generics, status, viewsets
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.decorators import api_view, permission_classes
from django.contrib.auth import authenticate, update_session_auth_hash
from django.contrib.auth.models import User, Group
from django.core.mail import send_mail, BadHeaderError
from .models import Category, Activation, EcoStaff, Profile, Message, Cart, VIPMessage
from .serializers import UserRegistrationSerializer, EcoStaffSerializer, UserSerializer, ChangePasswordSerializer, \
    CategorySerializer, ProfileSerializer, MessageSerializer, CartSerializer, VIPMessageSerializer, \
    EcoStaffImageSerializer
import requests
import logging
import json
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from django.utils import timezone
from datetime import timedelta
from rest_framework.pagination import PageNumberPagination
from django_filters.rest_framework import DjangoFilterBackend
from rest_framework.filters import SearchFilter, OrderingFilter

logger = logging.getLogger(__name__)


@method_decorator(csrf_exempt, name='dispatch')
class TelegramWebhookView(View):
    ADMIN_USER_ID = 707268574

    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
            logger.debug(f"Webhook received data: {data}")
            message = data.get('message')
            if message:
                chat_id = message['chat']['id']
                text = message.get('text')
                message_id = message.get('message_id')  # Get the message ID
                user_id = message['from']['id']
                user_name = message['from'].get('username', 'Unknown')
                if text:
                    # Check for duplicate message
                    if Message.objects.filter(message_id=message_id).exists():
                        return JsonResponse({"status": "ok", "message": "Duplicate message"})

                    # Save the message if it's not from a bot and not a duplicate
                    if not message.get('from', {}).get('is_bot'):
                        is_admin = user_id == self.ADMIN_USER_ID
                        Message.objects.create(
                            user_name=user_name,
                            content=text,
                            is_admin=is_admin,
                            message_id=message_id
                        )
                        return JsonResponse({"status": "ok"})
            return JsonResponse({"status": "not ok"}, status=400)
        except Exception as e:
            logger.error(f"Error in webhook: {e}")
            return JsonResponse({"status": "error", "message": str(e)}, status=500)


@method_decorator(csrf_exempt, name='dispatch')
class LongPollingMessageView(View):
    def get(self, request, *args, **kwargs):
        last_message_id = request.GET.get('last_message_id')

        try:
            if last_message_id:
                last_message_id = int(last_message_id)
                new_messages = Message.objects.filter(id__gt=last_message_id).order_by('id')
            else:
                new_messages = Message.objects.all().order_by('id')

            messages_list = list(new_messages.values('id', 'user_name', 'content', 'timestamp', 'is_admin'))
            return JsonResponse(messages_list, safe=False)
        except Exception as e:
            print(f"Error fetching new messages: {e}")
            return JsonResponse({'error': 'Something went wrong'}, status=500)


@csrf_exempt
def send_message(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        user_id = data['user_id']
        text = data['text']
        url = f'https://api.telegram.org/bot{settings.GENERAL_TELEGRAM_BOT_TOKEN}/sendMessage'
        requests.post(url, data={'chat_id': user_id, 'text': text})
        return JsonResponse({'status': 'ok'})
    return JsonResponse({'status': 'error'}, status=400)


@api_view(['POST'])
@permission_classes([AllowAny])
def add_user_to_vip_group(request):
    user = request.data.get('user')
    vip_group, created = Group.objects.get_or_create(name='VIP')
    user.groups.add(vip_group)
    user.save()
    return Response({"status": "ok"})


def landing_page(request):
    return render(request, 'landing_page.html')


def category_list(request):
    categories = Category.objects.all()
    return JsonResponse([{"id": category.id, "name": category.name} for category in categories], safe=False)


def category_detail(request, category_id):
    category = get_object_or_404(Category, id=category_id)
    products = EcoStaff.objects.filter(category=category)
    products_data = [
        {
            "id": product.id,
            "title": product.title,
            "description": product.description,
            "content": product.content,
            "price": product.price,
            "images": [image.image.url for image in product.images.all()],
            "category": product.category.id
        }
        for product in products
    ]
    category_data = {
        "id": category.id,
        "name": category.name,
        "products": products_data
    }
    return JsonResponse(category_data, safe=False)


def product_list(request):
    products = EcoStaff.objects.all()
    products_data = [
        {
            "id": product.id,
            "title": product.title,
            "description": product.description,
            "content": product.content,
            "price": product.price,
            "category": product.category.id,
            "images": [image.image.url for image in product.images.all()]
        }
        for product in products
    ]
    return JsonResponse(products_data, safe=False)


def product_detail(request, product_id):
    product = get_object_or_404(EcoStaff, id=product_id)
    product_data = {
        "id": product.id,
        "title": product.title,
        "content": product.content,
        "price": product.price,
        "category": product.category.name,
        "images": [image.image.url for image in product.images.all()]
    }
    return JsonResponse(product_data, safe=False)


class RefreshTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        token = request.auth
        is_expired = timezone.now() > token.created + timedelta(days=7)
        if is_expired:
            token.delete()
            token = Token.objects.create(user=request.user)
        return Response({"token": token.key})


class StandardResultsSetPagination(PageNumberPagination):
    page_size = 10
    page_size_query_param = 'page_size'
    max_page_size = 100


class UserRegistrationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request, *args, **kwargs):
        logger.info('Received registration request')
        serializer = UserRegistrationSerializer(data=request.data, context={'request': request})
        if serializer.is_valid():
            user = serializer.save()
            user.is_active = True
            user.save()

            token, created = Token.objects.get_or_create(user=user)

            try:
                send_mail(
                    'Новый пользователь зарегистрирован',
                    f'Пользователь {user.username} зарегистрировался с email {user.email}.',
                    'koltsovaecoprint@yandex.ru',
                    ['kumaradji@me.com'],
                    fail_silently=False,
                )
                logger.info(f'Admin notification sent for user: {user.username}')
            except Exception as e:
                logger.error(f'Error sending admin notification: {e}')

            return Response(
                {"message": "Пользователь успешно зарегистрирован.", "token": token.key},
                status=status.HTTP_201_CREATED
            )
        logger.error(f'Registration errors: {serializer.errors}')
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSerializer(request.user)
        return Response(serializer.data)


class AvatarUpdateView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, *args, **kwargs):
        profile = Profile.objects.get(user=request.user)
        serializer = ProfileSerializer(profile)
        return Response(serializer.data)

    def put(self, request, *args, **kwargs):
        profile = Profile.objects.get(user=request.user)
        if profile.avatar:
            profile.avatar.delete()
        serializer = ProfileSerializer(profile, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_200_OK)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    def delete(self, request, *args, **kwargs):
        profile = Profile.objects.get(user=request.user)
        if profile.avatar:
            profile.avatar.delete()
        profile.avatar = None
        profile.save()
        return Response({"message": "Avatar deleted successfully"}, status=status.HTTP_200_OK)


class AvatarDeleteView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        profile = Profile.objects.get(user=request.user)
        if profile.avatar:
            profile.avatar.delete()
        profile.avatar = None
        profile.save()
        return Response({"message": "Avatar deleted successfully"}, status=status.HTTP_200_OK)


class UserLoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        # Аутентификация пользователя
        user = authenticate(username=username, password=password)

        # Проверка успешной аутентификации и активации пользователя
        if user is not None:
            # Генерация или получение токена для пользователя
            token, created = Token.objects.get_or_create(user=user)
            user_data = {
                'id': user.id,
                'username': user.username,
                'email': user.email,
                'token': token.key
            }
            return Response({"message": "Успешный вход", "user": user_data}, status=status.HTTP_200_OK)
        else:
            return Response({"message": "Неверные учетные данные или пользователь не активен"},
                            status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        try:
            request.user.auth_token.delete()
        except:
            pass
        logout(request)
        return Response({"message": "Successfully logged out."}, status=status.HTTP_200_OK)


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        serializer = ChangePasswordSerializer(data=request.data)
        if serializer.is_valid():
            user = request.user
            if not user.check_password(serializer.validated_data.get('current_password')):
                return Response({"message": "Текущий пароль неверен"}, status=status.HTTP_400_BAD_REQUEST)

            new_password = serializer.validated_data.get('new_password')
            user.set_password(new_password)
            user.save()

            # Обновляем сессию
            update_session_auth_hash(request, user)

            # Создаем новый токен
            Token.objects.filter(user=user).delete()
            new_token = Token.objects.create(user=user)

            # Выполняем повторный вход пользователя
            auth_login(request, user)

            logger.info(f"User {user.username} changed password successfully")
            return Response({"message": "Пароль успешно изменен", "token": new_token.key}, status=status.HTTP_200_OK)

        logger.warning(f"Password change failed for user {request.user.username}. Errors: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class ResetPasswordView(APIView):
    permission_classes = [AllowAny]

    # Отправка письма для сброса пароля
    def post(self, request, *args, **kwargs):
        email = request.data.get('email')
        user = User.objects.filter(email=email).first()

        if not user:
            return Response({"message": "Пользователь с таким email не найден"}, status=status.HTTP_400_BAD_REQUEST)

        token = default_token_generator.make_token(user)
        uid = urlsafe_base64_encode(force_bytes(user.pk))

        # Изменяем URL на тот, который ведет на фронтенд
        reset_url = f"http://localhost:3000/reset-password/{uid}/{token}/"

        subject = 'Сброс пароля на сайте ДушуГрею'
        message = f'''
            Здравствуйте!
            Вы запросили сброс пароля на сайте ДушуГрею.
            Для установки нового пароля, пожалуйста, перейдите по следующей ссылке:
            {reset_url}

            Если вы не запрашивали сброс пароля, проигнорируйте это письмо.

            С уважением,
            Нина Кольцова
        '''

        try:
            send_mail(
                subject,
                message,
                'koltsovaecoprint@yandex.ru',
                [user.email],
                fail_silently=False,
            )
        except BadHeaderError:
            return Response({"message": "Неправильный заголовок письма."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"message": f"Ошибка при отправке письма: {str(e)}"},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)

        return Response({
            "message": "Инструкции по сбросу пароля отправлены на ваш email"
        }, status=status.HTTP_200_OK)

    # Обработка запроса на изменение пароля
    def put(self, request, *args, **kwargs):
        uid = request.data.get('uid')
        token = request.data.get('token')
        password = request.data.get('password')

        # Проверка всех необходимых данных
        if not uid or not token or not password:
            return Response({"message": "Все поля (uid, token, password) обязательны."},
                            status=status.HTTP_400_BAD_REQUEST)

        try:
            user_id = urlsafe_base64_decode(uid).decode()
            user = User.objects.get(pk=user_id)

            if not default_token_generator.check_token(user, token):
                return Response({"message": "Неверный или устаревший токен."}, status=status.HTTP_400_BAD_REQUEST)

            user.set_password(password)
            user.save()

            return Response({"message": "Пароль успешно изменен."}, status=status.HTTP_200_OK)

        except User.DoesNotExist:
            return Response({"message": "Пользователь не найден."}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"message": f"Ошибка: {str(e)}"}, status=status.HTTP_400_BAD_REQUEST)


class ConfirmPasswordResetView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, uidb64, token):
        logger.info(f"Received GET request for password reset. uidb64: {uidb64}, token: {token}")
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
            if default_token_generator.check_token(user, token):
                return Response({"message": "Токен действителен"}, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Неверная ссылка для сброса пароля или срок действия истек"},
                                status=status.HTTP_400_BAD_REQUEST)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Недействительный идентификатор пользователя"},
                            status=status.HTTP_400_BAD_REQUEST)

    def post(self, request, uidb64, token):
        logger.info(f"Received POST request for password reset. uidb64: {uidb64}, token: {token}")
        try:
            uid = force_str(urlsafe_base64_decode(uidb64))
            user = User.objects.get(pk=uid)
        except (TypeError, ValueError, OverflowError, User.DoesNotExist):
            return Response({"error": "Недействительный идентификатор пользователя"},
                            status=status.HTTP_400_BAD_REQUEST)

        if default_token_generator.check_token(user, token):
            new_password = request.data.get('new_password')
            if new_password:
                user.set_password(new_password)
                user.save()
                # Очистка всех существующих токенов пользователя
                Token.objects.filter(user=user).delete()
                # Создание нового токена
                new_token = Token.objects.create(user=user)
                return Response({
                    "message": "Пароль успешно сброшен",
                    "token": new_token.key
                }, status=status.HTTP_200_OK)
            else:
                return Response({"error": "Требуется новый пароль"}, status=status.HTTP_400_BAD_REQUEST)
        else:
            return Response({"error": "Неверная ссылка для сброса пароля или срок действия истек"},
                            status=status.HTTP_400_BAD_REQUEST)


class ActivateUser(APIView):
    permission_classes = [AllowAny]

    def get(self, request, token):
        print('Полученный токен:', token)
        activation = get_object_or_404(Activation, token=token)
        user = activation.user
        if not user.is_active:
            user.is_active = True
            user.save()
            activation.delete()
            print('Пользователь активирован:', user.username)
        else:
            print('Аккаунт уже активирован')

        # Рендерим страницу с благодарностью
        return render(request, 'activation_success.html', {'username': user.username})


class UserDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user = request.user
        user_data = {
            'id': user.id,
            'username': user.username,
            'email': user.email,
            'groups': [group.name for group in user.groups.all()],
        }
        return Response(user_data)


class MessageListView(generics.ListAPIView):
    queryset = Message.objects.all().select_related('user').order_by('timestamp')
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]


class MessageCreateView(generics.CreateAPIView):
    queryset = Message.objects.all().select_related('user')
    serializer_class = MessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        is_admin = self.request.user.is_staff or self.request.user.is_superuser
        message_instance = serializer.save(user=self.request.user, is_admin=is_admin)
        self.send_message_to_telegram(message_instance.content, self.request.user.username)

    def send_message_to_telegram(self, message, username):
        TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.GENERAL_TELEGRAM_BOT_TOKEN}/sendMessage"
        GENERAL_CHAT_ID = settings.GENERAL_TELEGRAM_CHAT_ID

        full_message = f"{username}: {message}"
        response = requests.post(TELEGRAM_API_URL, json={
            'chat_id': GENERAL_CHAT_ID,
            'text': full_message,
        })

        if response.status_code != 200:
            raise Exception('Error sending message to Telegram')


class MessageViewSet(viewsets.ModelViewSet):
    queryset = Message.objects.all()
    serializer_class = MessageSerializer

    def perform_create(self, serializer):
        user = self.request.user
        serializer.save(user=user, user_name=user.username)


class VIPMessageListView(generics.ListAPIView):
    queryset = VIPMessage.objects.all().select_related('user').order_by('timestamp')
    serializer_class = VIPMessageSerializer
    permission_classes = [IsAuthenticated]


class VIPMessageCreateView(generics.CreateAPIView):
    queryset = VIPMessage.objects.all().select_related('user')
    serializer_class = VIPMessageSerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        is_admin = self.request.user.is_staff or self.request.user.is_superuser
        message_instance = serializer.save(user=self.request.user, is_admin=is_admin)
        self.send_message_to_telegram(message_instance.content, self.request.user.username)

    def send_message_to_telegram(self, message, username):
        TELEGRAM_API_URL = f"https://api.telegram.org/bot{settings.VIP_TELEGRAM_BOT_TOKEN}/sendMessage"
        VIP_CHAT_ID = settings.VIP_TELEGRAM_CHAT_ID

        full_message = f"{username}: {message}"
        response = requests.post(TELEGRAM_API_URL, json={
            'chat_id': VIP_CHAT_ID,
            'text': full_message,
        })

        if response.status_code != 200:
            logger.error(f"Error sending message to Telegram: {response.status_code}, {response.text}")
            raise Exception(f"Error sending message to Telegram: {response.status_code}, {response.text}")
        else:
            logger.info(f"Message sent to Telegram: {full_message}")


class CartListView(generics.ListAPIView):
    serializer_class = CartSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Cart.objects.filter(user=self.request.user)


class CartCreateView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, *args, **kwargs):
        logger.info(f"User {request.user.id}: Received request to add product to cart")
        cart, created = Cart.objects.get_or_create(user=request.user)
        product_id = request.data.get('product_id')

        if not product_id:
            logger.error(f"User {request.user.id}: Product ID is missing in the request")
            return Response({"error": "Product ID is required"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            product = EcoStaff.objects.get(id=product_id)
            logger.info(f"User {request.user.id}: Product found: {product.title}")
            cart.add_item(product)
            logger.info(f"User {request.user.id}: Product added to cart successfully")
            return Response({"message": "Product added to cart"}, status=status.HTTP_201_CREATED)
        except EcoStaff.DoesNotExist:
            logger.error(f"User {request.user.id}: Product with ID {product_id} not found")
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"User {request.user.id}: Error adding product to cart: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CartRemoveView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, item_id, *args, **kwargs):
        try:
            cart = Cart.objects.get(user=request.user)
            product = EcoStaff.objects.get(id=item_id)
            cart.remove_item(product)
            logger.info(f"User {request.user.id}: Product removed from cart")
            return Response({"message": "Product removed from cart"}, status=status.HTTP_204_NO_CONTENT)
        except Cart.DoesNotExist:
            logger.error(f"User {request.user.id}: Cart not found")
            return Response({"error": "Cart not found"}, status=status.HTTP_404_NOT_FOUND)
        except EcoStaff.DoesNotExist:
            logger.error(f"User {request.user.id}: Product with ID {item_id} not found")
            return Response({"error": "Product not found"}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            logger.error(f"User {request.user.id}: Error removing product from cart: {str(e)}")
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)


class CategoryListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data)


class CategoryDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, category_id):
        category = get_object_or_404(Category, pk=category_id)
        serializer = CategorySerializer(category)
        return Response(serializer.data)


class ProductListView(generics.ListAPIView):
    queryset = EcoStaff.objects.all()
    serializer_class = EcoStaffSerializer
    permission_classes = [AllowAny]
    pagination_class = StandardResultsSetPagination
    filter_backends = [DjangoFilterBackend, SearchFilter, OrderingFilter]
    filterset_fields = ['category', 'price']
    search_fields = ['title', 'description']
    ordering_fields = ['price', 'created_at']


class ProductDetailView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, product_id):
        product = get_object_or_404(EcoStaff, pk=product_id)
        serializer = EcoStaffSerializer(product)
        return Response(serializer.data)


class EcoStaffListView(generics.ListAPIView):
    queryset = EcoStaff.objects.all()
    serializer_class = EcoStaffSerializer
    permission_classes = [AllowAny]


class EcoStaffDetailView(generics.RetrieveAPIView):
    queryset = EcoStaff.objects.all()
    serializer_class = EcoStaffSerializer
    permission_classes = [AllowAny]


class EcoStaffCreateView(generics.CreateAPIView):
    queryset = EcoStaff.objects.all()
    serializer_class = EcoStaffSerializer

    def post(self, request, *args, **kwargs):
        data = request.data
        images = data.pop('images', [])
        ecostaff_serializer = self.get_serializer(data=data)
        ecostaff_serializer.is_valid(raise_exception=True)
        ecostaff = ecostaff_serializer.save()

        for image_data in images:
            image_serializer = EcoStaffImageSerializer(data={'image': image_data, 'ecostaff': ecostaff.id})
            image_serializer.is_valid(raise_exception=True)
            image_serializer.save()

        return Response(ecostaff_serializer.data, status=status.HTTP_201_CREATED)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def verify_token(request):
    return Response({'valid': True})
