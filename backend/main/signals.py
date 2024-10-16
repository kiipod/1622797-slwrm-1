# signals.py
import os
import shutil
from django.db.models.signals import post_save, post_delete
from django.dispatch import receiver
from django.contrib.auth.models import User
from django.conf import settings
from .models import Profile


@receiver(post_save, sender=User)
def create_user_profile(sender, instance, created, **kwargs):
    if created:
        Profile.objects.create(user=instance)


@receiver(post_save, sender=User)
def save_user_profile(sender, instance, **kwargs):
    try:
        instance.profile.save()
    except Profile.DoesNotExist:
        Profile.objects.create(user=instance)


@receiver(post_delete, sender=Profile)
def delete_avatar_and_folder_on_profile_delete(sender, instance, **kwargs):
    # Удаление аватара пользователя
    if instance.avatar:
        if os.path.isfile(instance.avatar.path):
            os.remove(instance.avatar.path)

    # Удаление папки пользователя
    user_folder = os.path.join(settings.MEDIA_ROOT, 'shop', f'user_{instance.user.id}')
    if os.path.exists(user_folder):
        shutil.rmtree(user_folder)

# Обработчики сигналов:
# create_user_profile: Срабатывает при сохранении нового пользователя (User).
# Если пользователь создается (created), то создается связанный с ним профиль (Profile).
#
# save_user_profile: Срабатывает каждый раз при сохранении объекта пользователя (User).
# Пытается сохранить связанный профиль (Profile). Если профиль не существует, он создается.
#
# delete_avatar_on_profile_delete: Срабатывает при удалении объекта профиля (Profile).
# Если профиль имеет аватар (файл), и он существует, этот файл удаляется с диска.
# Удаление папки пользователя: Добавлена логика для удаления папки пользователя
# (user_{instance.user.id}) из папки media/shop при удалении профиля.
# Используется функция shutil.rmtree для удаления всей папки и ее содержимого.
#
# Переименование обработчика сигнала: Обработчик delete_avatar_on_profile_delete был
# переименован в delete_avatar_and_folder_on_profile_delete, чтобы отразить новую функциональность.
