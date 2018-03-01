# -*- coding: utf-8 -*-
# Generated by Django 1.9.5 on 2016-05-31 19:52
from __future__ import unicode_literals

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('contenttypes', '0002_remove_content_type_name'),
        ('news', '0012_auto_20160531_2202'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='like',
            name='article',
        ),
        migrations.AddField(
            model_name='like',
            name='item_id',
            field=models.PositiveIntegerField(default=41),
            preserve_default=False,
        ),
        migrations.AddField(
            model_name='like',
            name='item_type',
            field=models.ForeignKey(default=39, on_delete=django.db.models.deletion.CASCADE, to='contenttypes.ContentType'),
            preserve_default=False,
        ),
    ]
