@echo off
set DJANGO_SETTINGS_MODULE=config.settings
py -m django makemigrations
py -m django migrate
