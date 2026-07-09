#!/bin/sh
# Backup diario → Cloudflare R2 (remoto cifrado "r2crypt", ver entrypoint.sh).
# Todo va en streaming: nada se escribe al disco del VPS.
# Ejecutable a mano dentro del contenedor: docker exec <backup> backup.sh
set -eu

. /etc/backup.env
export PGPASSWORD="$POSTGRES_PASSWORD"

STAMP="$(date +%F-%H%M)"
echo "[backup] inicio $STAMP"

# 1) Postgres: dump comprimido (formato custom) directo a R2
pg_dump -Fc -h postgres -U "$POSTGRES_USER" -d "$POSTGRES_DB" \
  | rclone rcat "r2crypt:db/${POSTGRES_DB}-${STAMP}.dump"
echo "[backup] dump de ${POSTGRES_DB} subido"

# retención de dumps (cada uno es autocontenido)
rclone delete --retries 1 --min-age "${BACKUP_DB_RETENTION:-30d}" r2crypt:db \
  || echo "[backup] aviso: falló la retención de db/"

# 2) Garage (archivos subidos): espejo incremental. Lo que se borra en la
# plataforma no se pierde del backup: va a files-borrados/<fecha> (--backup-dir)
rclone sync garage:university-files r2crypt:files \
  --backup-dir "r2crypt:files-borrados/${STAMP}"
echo "[backup] archivos sincronizados"

# retención de borrados + limpieza de carpetas vacías (en S3 un prefijo aún
# inexistente lista vacío, no es error)
rclone delete --retries 1 --min-age "${BACKUP_DELETED_RETENTION:-90d}" r2crypt:files-borrados \
  || echo "[backup] aviso: falló la retención de files-borrados/"
rclone rmdirs r2crypt:files-borrados --leave-root 2>/dev/null || true

echo "[backup] OK $(date +%F-%H%M)"
