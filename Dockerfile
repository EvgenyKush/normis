# Сайт статический и собирается на машине разработчика скриптом build-site.ps1.
# В образ кладём только готовые страницы: исходники, тесты, редакторский реестр
# и планы наружу не выкладываются.
FROM nginx:1.27-alpine

COPY deploy/nginx.conf /etc/nginx/conf.d/default.conf

COPY index.html support.html /usr/share/nginx/html/
COPY assets /usr/share/nginx/html/assets
COPY course /usr/share/nginx/html/course
COPY letters /usr/share/nginx/html/letters

EXPOSE 8080
