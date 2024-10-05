#!/bin/sh

if [ "$DATABASE" = "postgres" ]
then
    echo "Waiting PostgreSQL..."

    while ! nc -z $DB_HOST $DB_PORT; do
      sleep 0.1
    done

    echo "PostgreSQL started!"
fi

python manage.py collectstatic --noinput
python manage.py migrate --noinput
python manage.py loaddata main/fixtures/initial_data.json
echo "from django.contrib.auth.models import User;
User.objects.filter(email='$ADMIN_EMAIL').delete();
User.objects.create_superuser('$DJANGO_ADMIN_USER', '$ADMIN_EMAIL', '$DJANGO_ADMIN_PASSWORD')" | python manage.py shell

exec "$@"