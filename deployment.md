# 🛠️ Laravel Server Setup Guide (PHP 8.2, NGINX, MySQL 8+, Node.js 22, Supervisor)

This guide walks through setting up a Laravel server on Ubuntu with PHP 8.2, MySQL, NGINX, Node.js (via NVM), and Supervisor.

---

## 📦 Install PHP and Required Packages

```bash
add-apt-repository ppa:ondrej/php -y && apt update

apt install php8.2 php8.2-cli php8.2-fpm php8.2-curl php8.2-mbstring php8.2-mysql php8.2-xml php8.2-bcmath php8.2-zip php8.2-fpm unzip curl git nginx mysql-server supervisor -y
```

---

## 🧰 Install Composer

```bash
curl -sS https://getcomposer.org/installer | php
mv composer.phar /usr/local/bin/composer
```

---

## ⚙️ Install Node.js via NVM

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.7/install.sh | bash

export NVM_DIR="$HOME/.nvm"
source "$NVM_DIR/nvm.sh"

nvm install 22
nvm use 22
nvm alias default 22

node -v
nvm -v
```

---

## 🛡️ Secure MySQL

```bash
apt install mysql-server -y
mysql_secure_installation
```

Then log in to MySQL:

```sql
CREATE DATABASE your_app_db;

CREATE USER 'your_user'@'localhost' IDENTIFIED BY 'your_password';

GRANT ALL PRIVILEGES ON your_app_db.* TO 'your_user'@'localhost';

FLUSH PRIVILEGES;
```

---

## 🔐 Set Up SSH Key for GitHub Deployment

```bash
ssh-keygen
```

> Copy the public key from `/root/.ssh/id_rsa.pub` and add it to GitHub:
> **GitHub → Repository → Settings → Deploy Keys → Add Key**

---

## 📁 Clone the Project and Set Up Laravel

```bash
git clone git@github.com:username/repository.git
mv repository/ html

cd html
cp .env.example .env
./deploy.sh
```

---

## 🧵 Configure Laravel Queue Worker (Supervisor)

Install Supervisor (if not already):

```bash
apt install supervisor -y
```

Create Supervisor config:

```bash
nano /etc/supervisor/conf.d/laravel-worker.conf
```

Paste the following:

```ini
[program:laravel-worker]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work --sleep=3 --tries=1 --timeout=0
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/worker_default.log

[program:shopify]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work database --queue=shopify --sleep=3 --tries=1 --timeout=0
autostart=true
autorestart=true
user=www-data
numprocs=2
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/worker_shopify.log

[program:invitations]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work database --queue=invitations --sleep=3 --tries=1 --timeout=0
autostart=true
autorestart=true
user=www-data
numprocs=3
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/worker_invitations.log

[program:common]
process_name=%(program_name)s_%(process_num)02d
command=php /var/www/html/artisan queue:work database --queue=common --sleep=3 --tries=1 --timeout=0
autostart=true
autorestart=true
user=www-data
numprocs=1
redirect_stderr=true
stdout_logfile=/var/www/html/storage/logs/worker_common.log
```

Reload Supervisor:

```bash
supervisorctl reread
supervisorctl update
supervisorctl start laravel-worker:*
```

---

## 🔒 Set Permissions

```bash
chown -R www-data:www-data /var/www/html/storage
chmod -R 775 /var/www/html/storage /var/www/html/bootstrap/cache
```

---

## 🕑 Set Up Cron Job for Scheduler

```bash
crontab -e
```

Add this line:

```cron
* * * * * cd /var/www/html && php artisan schedule:run >> /dev/null 2>&1
```

---

## 🌐 Configure NGINX

Install NGINX:

```bash
apt install nginx -y
```

Create NGINX site config:

```bash
nano /etc/nginx/sites-available/laravel
```

Paste:

```nginx
server {
    listen 80;
    server_name yourdomain.com;

    root /var/www/html/public;
    index index.php index.html;

    location / {
        try_files $uri $uri/ /index.php?$query_string;
    }

    location ~ \.php$ {
        include snippets/fastcgi-php.conf;
        fastcgi_pass unix:/run/php/php8.2-fpm.sock;
    }

    location ~ /\.ht {
        deny all;
    }
}
```

Enable the site and restart NGINX:

```bash
ln -s /etc/nginx/sites-available/laravel /etc/nginx/sites-enabled/
nginx -t

sudo systemctl stop apache2
sudo systemctl disable apache2

systemctl restart nginx
```

---

## 🔐 SSL with Certbot

```bash
apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d app.yourdomain.com
systemctl restart nginx
```

---

## ⚙️ Extra: MySQL Configuration (Optional Tuning)

```bash
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

Add/Update:

```ini
max_allowed_packet      = 512M
wait_timeout = 900
interactive_timeout = 900
net_read_timeout = 300
net_write_timeout = 300

# InnoDB Settings
innodb_lock_wait_timeout = 300
innodb_buffer_pool_size         = 3G
innodb_log_file_size            = 256M
innodb_log_buffer_size          = 32M
innodb_flush_log_at_trx_commit  = 1
innodb_thread_concurrency       = 4
innodb_flush_method             = O_DIRECT
```

Restart MySQL if needed:

```bash
systemctl restart mysql
```

---

## ✅ Done!

You now have a complete Laravel environment with PHP 8.2, MySQL, Node.js, and NGINX — ready for production.
