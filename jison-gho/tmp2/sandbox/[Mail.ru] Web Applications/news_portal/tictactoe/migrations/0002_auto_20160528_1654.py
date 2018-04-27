# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-05-28 13:54
from __future__ import unicode_literals

from django.conf import settings
from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('tictactoe', '0001_initial'),
    ]

    operations = [
        migrations.AlterField(
            model_name='game',
            name='status',
            field=models.CharField(choices=[('A', 'Active'), ('E', 'Ended'), ('N', 'Not Started')], default='N', max_length=1),
        ),
        migrations.AlterField(
            model_name='game',
            name='winner',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='games_winner', to=settings.AUTH_USER_MODEL),
        ),
    ]
