FROM nginxinc/nginx-unprivileged:stable-alpine

WORKDIR /usr/share/nginx/html

COPY --chown=101:101 index.html ./index.html
COPY --chown=101:101 styles.css ./styles.css
COPY --chown=101:101 app.js ./app.js

EXPOSE 8080
