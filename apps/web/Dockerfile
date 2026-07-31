FROM nginx:alpine

LABEL org.opencontainers.image.authors="Ben Musson"

COPY apps/web/nginx.conf /etc/nginx/conf.d/default.conf
COPY dist/apps/web/ /usr/share/nginx/html/

EXPOSE 80