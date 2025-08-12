FROM ubuntu:20.04

LABEL maintainer="Taylor Otwell"

ARG WWWGROUP
ARG NODE_VERSION=16
ARG POSTGRES_VERSION=13

WORKDIR /var/www/html

ENV DEBIAN_FRONTEND noninteractive
ENV TZ=UTC

RUN ln -snf /usr/share/zoneinfo/$TZ /etc/localtime && echo $TZ > /etc/timezone

RUN apt-get update
RUN apt-get install -y gnupg gosu curl ca-certificates zip unzip git supervisor sqlite3 libcap2-bin libpng-dev python2 dnsutils

RUN curl -sS 'https://keyserver.ubuntu.com/pks/lookup?op=get&search=0x14aa40ec0831756756d7f66c4f4ea0aae5267a6c' | gpg --dearmor | tee /usr/share/keyrings/ppa_ondrej_php.gpg > /dev/null
RUN echo "deb [signed-by=/usr/share/keyrings/ppa_ondrej_php.gpg] https://ppa.launchpadcontent.net/ondrej/php/ubuntu focal main" > /etc/apt/sources.list.d/ppa_ondrej_php.list

RUN apt-get update
RUN apt-get install -y php8.1-cli php8.1-dev php8.1-bcmath php8.1-calendar php8.1-ctype php8.1-curl php8.1-dom php8.1-exif php8.1-ffi php8.1-fileinfo php8.1-ftp php8.1-gd php8.1-gettext php8.1-iconv php8.1-igbinary php8.1-imap php8.1-intl php8.1-ldap php8.1-mbstring php8.1-memcached php8.1-msgpack php8.1-mysqli php8.1-mysqlnd php8.1-opcache php8.1-pcov php8.1-pgsql php8.1-phar php8.1-posix php8.1-readline php8.1-redis php8.1-shmop php8.1-simplexml php8.1-soap php8.1-sockets php8.1-sqlite3 php8.1-swoole php8.1-sysvmsg php8.1-sysvsem php8.1-sysvshm php8.1-tokenizer php8.1-xdebug php8.1-xml php8.1-xmlreader php8.1-xmlwriter php8.1-xsl php8.1-zip

RUN php -r "readfile('https://getcomposer.org/installer');" | php -- --install-dir=/usr/bin/ --filename=composer
RUN curl -sLS https://deb.nodesource.com/setup_$NODE_VERSION.x | bash -

RUN curl -sS https://dl.yarnpkg.com/debian/pubkey.gpg | gpg --dearmor | tee /usr/share/keyrings/yarnkey.gpg >/dev/null
RUN echo "deb [signed-by=/usr/share/keyrings/yarnkey.gpg] https://dl.yarnpkg.com/debian/ stable main" > /etc/apt/sources.list.d/yarn.list
RUN apt-get update
RUN apt-get install -y yarn
RUN apt-get install -y mysql-client

RUN apt-get -y autoremove
RUN apt-get clean
RUN rm -rf /var/lib/apt/lists/* /tmp/* /var/tmp/*

RUN update-alternatives --set php /usr/bin/php8.1

RUN apt-get update
RUN apt-get install -y gettext-base

RUN apt-get update
RUN apt-get install -y apache2 libapache2-mod-php8.1

RUN a2enmod rewrite

COPY 000-default.conf.template /etc/apache2/sites-available/000-default.conf.template
RUN a2ensite 000-default.conf

RUN setcap "cap_net_bind_service=+ep" /usr/bin/php8.1

COPY start-container /usr/local/bin/start-container
COPY php.ini /etc/php/8.1/cli/conf.d/99-sail.ini
COPY supervisord.conf /etc/supervisor/supervisord.conf
RUN chmod +x /usr/local/bin/start-container

EXPOSE 80

ENTRYPOINT ["start-container"]
