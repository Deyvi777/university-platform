#!/bin/sh
# Arranque del sidecar de backups: genera la config de rclone desde las
# variables de entorno, programa el cron y queda corriendo crond en foreground.
# Si faltan las credenciales de R2 o la clave de cifrado, NO falla: queda
# inactivo avisando en los logs (mismo patrón que MailService sin SMTP_*),
# así el deploy nunca se rompe por no haber configurado los backups todavía.
set -eu

CRON_EXPR="${BACKUP_CRON:-30 3 * * *}"

if [ -z "${R2_ENDPOINT:-}" ] || [ -z "${R2_ACCESS_KEY_ID:-}" ] || \
   [ -z "${R2_SECRET_ACCESS_KEY:-}" ] || [ -z "${BACKUP_ENCRYPTION_PASSWORD:-}" ]; then
  echo "[backup] R2_ENDPOINT/R2_ACCESS_KEY_ID/R2_SECRET_ACCESS_KEY/BACKUP_ENCRYPTION_PASSWORD sin configurar — backups DESACTIVADOS"
  exec tail -f /dev/null
fi

# rclone crypt exige la contraseña "obscured" en el archivo de config
OBSCURED_PASSWORD="$(rclone obscure "$BACKUP_ENCRYPTION_PASSWORD")"

mkdir -p /root/.config/rclone
cat > /root/.config/rclone/rclone.conf <<EOF
[garage]
type = s3
provider = Other
endpoint = http://garage:3900
access_key_id = ${S3_ACCESS_KEY}
secret_access_key = ${S3_SECRET_KEY}
region = garage
force_path_style = true

[r2]
type = s3
provider = Cloudflare
endpoint = ${R2_ENDPOINT}
access_key_id = ${R2_ACCESS_KEY_ID}
secret_access_key = ${R2_SECRET_ACCESS_KEY}
region = auto
no_check_bucket = true

[r2crypt]
type = crypt
remote = r2:${R2_BUCKET:-certificate-backups}
password = ${OBSCURED_PASSWORD}
filename_encryption = off
EOF
chmod 600 /root/.config/rclone/rclone.conf

# busybox crond no garantiza el entorno del contenedor a los jobs:
# volcamos lo que backup.sh necesita a un archivo que él mismo sourcea.
{
  for var in POSTGRES_USER POSTGRES_PASSWORD POSTGRES_DB \
             BACKUP_DB_RETENTION BACKUP_DELETED_RETENTION; do
    eval "value=\${$var:-}"
    printf "export %s='%s'\n" "$var" "$value"
  done
} > /etc/backup.env
chmod 600 /etc/backup.env

echo "$CRON_EXPR /usr/local/bin/backup.sh > /proc/1/fd/1 2>&1" > /etc/crontabs/root

echo "[backup] activo — cron: '$CRON_EXPR' (TZ=${TZ:-UTC}) → r2:${R2_BUCKET:-certificate-backups} (cifrado)"
exec crond -f -l 6 -L /dev/stdout
