# Sidecar de backups automáticos (solo producción, docker-compose.prod.yml).
# Base postgres:18-alpine para que la versión de pg_dump coincida con el
# servidor; rclone hace el streaming cifrado a Cloudflare R2 (cero disco local).
FROM postgres:18-alpine

RUN apk add --no-cache rclone tzdata

COPY entrypoint.sh backup.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/entrypoint.sh /usr/local/bin/backup.sh

ENTRYPOINT ["/usr/local/bin/entrypoint.sh"]
