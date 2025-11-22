#!/usr/bin/env bash

cd /var/www/html

echo "Pulling Changes from VCS"
git pull origin master

echo "Installing PHP Dependency (composer install)"
composer install --prefer-dist --no-dev

echo "Installing Node Project Dependency (npm Install)"
npm ci

echo "Dumping Project Dependency (composer dump-autoload)"
composer dump-autoload

echo "Migrating Database Changes (php artisan migrate)"
php artisan migrate --force

echo "Compiling Frontend Assets (npm run prod)"
npm run prod

#echo "Restarting Services"
supervisorctl restart all
echo "Deploy script finished execution"
