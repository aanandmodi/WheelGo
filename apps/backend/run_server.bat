@echo off
set DJANGO_SETTINGS_MODULE=config.settings
py -m django runserver 0.0.0.0:8000
