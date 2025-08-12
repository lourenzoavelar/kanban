FROM ubuntu:20.04

LABEL maintainer="Taylor Otwell"

ARG WWWGROUP
ARG NODE_VERSION=16
ARG POSTGRES_VERSION=13

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update \
    && apt-get install -y gnupg gosu curl ca-certificates zip unzip git supervisor sqlite3 libcap2-bin libpng-dev python2 dnsutils \
    && curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x14aa40ec0831756756d7f66c4f4ea0aae5267a6c' | gpg --dearmor | tee /usr/share/keyrings/ppa_ondrej_php.gpg > /dev/null \
    && echo "deb [signed-by=/usr/share/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu focal main" > /etc/apt/sources.list.d/ppa_ondrej_php.list \
    && apt-get update \
    && apt-get install -y php8.0-cli php8.0-dev \
       php8.0-bcmath \
       php8.0-calendar \
       php8.0-ctype \
       php8.0-curl \
       php8.0-dom \
       php8.0-exif \
       php8.0-ffi \
       php8.0-fileinfo \
       php8.0-ftp \
       php8.0-gd \
       php8.0-gettext \
       php8.0-iconv \
       php8.0-igbinary \
       php8.0-imap \
       php8.0-intl \
       php8.0-ldap \
       php8.0-mbstring \
       php8.0-memcached \
       php8.0-msgpack \
       php8.0-mysqli \
       php8.0-mysqlnd \
       php8.0-opcache \
       php8.0-pcov \
       php8.0-pgsql \
       php8.0-phar \
       php8.0-posix \
       php8.0-readline \
       php8.0-redis \
       php8.0-shmop \
       php8.0-simplexml \
       php8.0-soap \
       php8.0-sockets \
       php8.0-sqlite3 \
       php8.0-swoole \
       php8.0-sysvmsg \
       php8.0-sysvsem \
       php8.0-sysvshm \
       php8.0-tokenizer \
       php8.0-xdebug \
       php8.0-xml \
       php8.0-xmlreader \
       php8.0-xmlwriter \
       php8.0-xsl \
       php8.0-zip \
    && php -r "readfile('https://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer \
    && apt-get update \
    && apt-get install -y mysql-client \
    && apt-get -y autoremove \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*
 
RUN update-alternatives --set php /usr/bin/php8.0

RUN apt-get update && apt-get install -y gettext-base


RUN apt-get update \
    && apt-get install -y apache2 libapache2-mod-php8.0

RUN a2enmod rewrite

COPY 000-default.conf.template /etc/apache2/sites-available/000-default.conf.template
RUN a2ensite 000-default.conf

RUN setcap "cap_net_bind_service=+ep" /usr/bin/php8.0

COPY start-container /usr/local/bin/start-container
#COPY supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY php.ini /etc/php/8.0/cli/conf.d/99-sail.ini
RUN chmod +x /usr/local/bin/start-container

EXPOSE 80

ENTRYPOINT ["start-container"]
