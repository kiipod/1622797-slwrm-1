# Generated by Django 5.0.6 on 2024-06-10 15:47

from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('main', '0012_alter_cart_created_at'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='cart',
            name='created_at',
        ),
    ]