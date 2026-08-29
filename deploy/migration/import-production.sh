#!/usr/bin/env bash

set -Eeuo pipefail

if [[ $# -ne 4 ]]; then
	echo "Usage: $0 <deploy-path> <archive-path> <protected-admin-email> <run-id>" >&2
	exit 2
fi

DEPLOY_PATH="$1"
ARCHIVE_PATH="$2"
PROTECTED_ADMIN_EMAIL="$3"
RUN_ID="$4"

if [[ ! "$DEPLOY_PATH" =~ ^/[A-Za-z0-9._/-]+$ ]]; then
	echo "Invalid deployment path." >&2
	exit 2
fi
if [[ ! "$PROTECTED_ADMIN_EMAIL" =~ ^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$ ]]; then
	echo "Invalid protected admin email." >&2
	exit 2
fi
if [[ ! "$RUN_ID" =~ ^[0-9]+$ ]]; then
	echo "Invalid workflow run ID." >&2
	exit 2
fi
if [[ ! -f "$ARCHIVE_PATH" ]]; then
	echo "Migration archive not found: $ARCHIVE_PATH" >&2
	exit 2
fi

cd "$DEPLOY_PATH"

COMPOSE=(docker compose -f docker-compose.prod.yml)
POSTGRES_CONTAINER="influbid-postgres"
MINIO_NETWORK="influbid_internal"
ENV_FILE="$DEPLOY_PATH/.env"
IMPORT_DIRECTORY="$DEPLOY_PATH/imports/$RUN_ID"
PAYLOAD_DIRECTORY="$IMPORT_DIRECTORY/payload"
BACKUP_DIRECTORY="$DEPLOY_PATH/backups/local-import-$RUN_ID"
TEMP_DATABASE="influbid_import_${RUN_ID}"
CONTAINER_BACKUP="/tmp/pre-import-${RUN_ID}.dump"

if [[ ! -f "$ENV_FILE" ]]; then
	echo "Production .env not found: $ENV_FILE" >&2
	exit 2
fi

AVATARS_BUCKET="$(grep -E '^NEXT_PUBLIC_AVATARS_BUCKET_NAME=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d "\"'" || true)"
AVATARS_BUCKET="${AVATARS_BUCKET:-avatars}"
if [[ ! "$AVATARS_BUCKET" =~ ^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$ ]]; then
	echo "Invalid avatar bucket name." >&2
	exit 2
fi

mkdir -p "$PAYLOAD_DIRECTORY" "$BACKUP_DIRECTORY/avatars"
chmod 700 "$IMPORT_DIRECTORY" "$BACKUP_DIRECTORY"
docker run --rm \
	-v "$IMPORT_DIRECTORY:/work" \
	busybox:1.37 \
	unzip -q "/work/$(basename "$ARCHIVE_PATH")" -d /work/payload

DUMP_PATH="$PAYLOAD_DIRECTORY/database.dump"
AVATARS_PATH="$PAYLOAD_DIRECTORY/avatars"
if [[ ! -s "$DUMP_PATH" ]]; then
	echo "The migration archive does not contain a valid database.dump." >&2
	exit 2
fi
PG_DUMP_MAJOR="$(tr -d '[:space:]' <"$PAYLOAD_DIRECTORY/pg-dump-major.txt")"
if [[ ! "$PG_DUMP_MAJOR" =~ ^(16|17)$ ]]; then
	echo "Unsupported or missing pg_dump major version." >&2
	exit 2
fi
PG_CLIENT_IMAGE="postgres:${PG_DUMP_MAJOR}-alpine"

DB_USER="$(docker exec "$POSTGRES_CONTAINER" printenv POSTGRES_USER)"
DB_NAME="$(docker exec "$POSTGRES_CONTAINER" printenv POSTGRES_DB)"
DB_PASSWORD="$(docker exec "$POSTGRES_CONTAINER" printenv POSTGRES_PASSWORD)"
DB_USER="${DB_USER:-postgres}"
DB_NAME="${DB_NAME:-supastarter}"
if [[ -z "$DB_PASSWORD" ]]; then
	echo "Unable to read the production PostgreSQL password." >&2
	exit 2
fi

APPS_STOPPED=0
FILES_IMPORTED=0
DB_IMPORTED=0
SUCCESS=0

restore_local_dump() {
	docker run --rm \
		--network "$MINIO_NETWORK" \
		--env PGPASSWORD="$DB_PASSWORD" \
		-v "$DUMP_PATH:/imports/local.dump:ro" \
		"$PG_CLIENT_IMAGE" \
		pg_restore \
		-h postgres \
		-U "$DB_USER" \
		"$@" \
		/imports/local.dump
}

restore_avatar_backup() {
	echo "Restoring the pre-import avatar bucket..."
	docker run --rm \
		--network "$MINIO_NETWORK" \
		--env-file "$ENV_FILE" \
		--env MIGRATION_BUCKET="$AVATARS_BUCKET" \
		-v "$BACKUP_DIRECTORY/avatars:/backup:ro" \
		--entrypoint /bin/sh \
		minio/mc:latest \
		-c 'mc alias set production http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
			mc rm --recursive --force "production/$MIGRATION_BUCKET" >/dev/null 2>&1 || true
			mc mb "production/$MIGRATION_BUCKET" --ignore-existing >/dev/null &&
			mc cp --recursive /backup/ "production/$MIGRATION_BUCKET/" >/dev/null'
}

restore_database_backup() {
	echo "Restoring the pre-import production database..."
	docker exec "$POSTGRES_CONTAINER" psql \
		-U "$DB_USER" \
		-d postgres \
		-v ON_ERROR_STOP=1 \
		-c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = '$DB_NAME' AND pid <> pg_backend_pid();" \
		>/dev/null
	docker exec "$POSTGRES_CONTAINER" dropdb -U "$DB_USER" --if-exists "$DB_NAME"
	docker exec "$POSTGRES_CONTAINER" createdb -U "$DB_USER" "$DB_NAME"
	docker exec "$POSTGRES_CONTAINER" pg_restore \
		-U "$DB_USER" \
		-d "$DB_NAME" \
		--no-owner \
		--no-acl \
		--exit-on-error \
		"$CONTAINER_BACKUP"
}

cleanup() {
	local status=$?
	trap - EXIT
	set +e

	docker exec "$POSTGRES_CONTAINER" dropdb -U "$DB_USER" --if-exists "$TEMP_DATABASE" >/dev/null 2>&1

	if [[ "$status" -ne 0 && "$DB_IMPORTED" -eq 1 ]]; then
		"${COMPOSE[@]}" stop saas marketing >/dev/null 2>&1
		APPS_STOPPED=1
		restore_database_backup || echo "CRITICAL: automatic database rollback failed." >&2
	fi
	if [[ "$status" -ne 0 && "$FILES_IMPORTED" -eq 1 ]]; then
		restore_avatar_backup || echo "CRITICAL: automatic avatar rollback failed." >&2
	fi
	if [[ "$APPS_STOPPED" -eq 1 ]]; then
		"${COMPOSE[@]}" up -d saas marketing >/dev/null
	fi

	if [[ "$SUCCESS" -eq 1 ]]; then
		rm -rf "$IMPORT_DIRECTORY"
	fi

	exit "$status"
}
trap cleanup EXIT

echo "Verifying the protected production administrator..."
ADMIN_BEFORE="$(
	docker exec "$POSTGRES_CONTAINER" psql \
		-U "$DB_USER" \
		-d "$DB_NAME" \
		-At \
		-F '|' \
		-v ON_ERROR_STOP=1 \
		-c "SELECT u.id, u.email, coalesce(u.username, ''), coalesce(u.role, ''), coalesce(md5(string_agg(coalesce(a.password, ''), ',' ORDER BY a.id)), '')
			FROM \"user\" u
			LEFT JOIN account a ON a.\"userId\" = u.id
			WHERE lower(u.email) = lower('$PROTECTED_ADMIN_EMAIL')
			GROUP BY u.id, u.email, u.username, u.role;"
)"

if [[ -z "$ADMIN_BEFORE" || "$ADMIN_BEFORE" != *"|admin|"* ]]; then
	echo "Protected production admin '$PROTECTED_ADMIN_EMAIL' was not found with role admin." >&2
	exit 1
fi
ADMIN_ID="${ADMIN_BEFORE%%|*}"

echo "Creating the pre-import production backup..."
docker exec "$POSTGRES_CONTAINER" pg_dump \
	-U "$DB_USER" \
	-d "$DB_NAME" \
	--format=custom \
	--no-owner \
	--no-acl \
	--file="$CONTAINER_BACKUP"
docker cp "$POSTGRES_CONTAINER:$CONTAINER_BACKUP" "$BACKUP_DIRECTORY/database.dump"
chmod 600 "$BACKUP_DIRECTORY/database.dump"

echo "Validating the local dump in an isolated database..."
docker exec "$POSTGRES_CONTAINER" dropdb -U "$DB_USER" --if-exists "$TEMP_DATABASE"
docker exec "$POSTGRES_CONTAINER" createdb -U "$DB_USER" "$TEMP_DATABASE"
restore_local_dump \
	-d "$TEMP_DATABASE" \
	--no-owner \
	--no-acl \
	--exit-on-error

LOCAL_ADMIN_COLLISION="$(
	docker exec "$POSTGRES_CONTAINER" psql \
		-U "$DB_USER" \
		-d "$TEMP_DATABASE" \
		-At \
		-v ON_ERROR_STOP=1 \
		-c "SELECT count(*) FROM \"user\" WHERE id = '$ADMIN_ID' OR lower(email) = lower('$PROTECTED_ADMIN_EMAIL');"
)"
if [[ "$LOCAL_ADMIN_COLLISION" != "0" ]]; then
	echo "Import refused: local data conflicts with the protected production admin." >&2
	exit 1
fi

echo "Backing up the production avatar bucket..."
docker run --rm \
	--network "$MINIO_NETWORK" \
	--env-file "$ENV_FILE" \
	--env MIGRATION_BUCKET="$AVATARS_BUCKET" \
	-v "$BACKUP_DIRECTORY/avatars:/backup" \
	--entrypoint /bin/sh \
	minio/mc:latest \
	-c 'mc alias set production http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
		mc mb "production/$MIGRATION_BUCKET" --ignore-existing >/dev/null &&
		mc mirror --overwrite "production/$MIGRATION_BUCKET" /backup >/dev/null'

echo "Stopping application traffic during the import..."
"${COMPOSE[@]}" stop saas marketing
APPS_STOPPED=1

if [[ -d "$AVATARS_PATH" && -n "$(ls -A "$AVATARS_PATH" 2>/dev/null)" ]]; then
	echo "Importing local avatars into MinIO..."
	FILES_IMPORTED=1
	docker run --rm \
		--network "$MINIO_NETWORK" \
		--env-file "$ENV_FILE" \
		--env MIGRATION_BUCKET="$AVATARS_BUCKET" \
		-v "$AVATARS_PATH:/source:ro" \
		--entrypoint /bin/sh \
		minio/mc:latest \
		-c 'mc alias set production http://minio:9000 "$MINIO_ROOT_USER" "$MINIO_ROOT_PASSWORD" >/dev/null &&
			mc mb "production/$MIGRATION_BUCKET" --ignore-existing >/dev/null &&
			mc cp --recursive /source/ "production/$MIGRATION_BUCKET/" >/dev/null'
fi

echo "Importing database data in one transaction..."
restore_local_dump \
	-d "$DB_NAME" \
	--data-only \
	--no-owner \
	--no-acl \
	--disable-triggers \
	--single-transaction \
	--exit-on-error \
	--exclude-table=public.session \
	--exclude-table=public.verification
DB_IMPORTED=1

ADMIN_AFTER="$(
	docker exec "$POSTGRES_CONTAINER" psql \
		-U "$DB_USER" \
		-d "$DB_NAME" \
		-At \
		-F '|' \
		-v ON_ERROR_STOP=1 \
		-c "SELECT u.id, u.email, coalesce(u.username, ''), coalesce(u.role, ''), coalesce(md5(string_agg(coalesce(a.password, ''), ',' ORDER BY a.id)), '')
			FROM \"user\" u
			LEFT JOIN account a ON a.\"userId\" = u.id
			WHERE lower(u.email) = lower('$PROTECTED_ADMIN_EMAIL')
			GROUP BY u.id, u.email, u.username, u.role;"
)"
if [[ "$ADMIN_BEFORE" != "$ADMIN_AFTER" ]]; then
	echo "Protected admin changed unexpectedly; rolling back." >&2
	exit 1
fi

echo "Starting applications..."
"${COMPOSE[@]}" up -d saas marketing
APPS_STOPPED=0

SAAS_HOST_PORT="$(grep -E '^SAAS_HOST_PORT=' "$ENV_FILE" | tail -1 | cut -d= -f2- | tr -d "\"'" || true)"
SAAS_HOST_PORT="${SAAS_HOST_PORT:-3100}"
for attempt in 1 2 3 4 5 6; do
	if curl -fsS "http://127.0.0.1:${SAAS_HOST_PORT}/api/health" >/dev/null; then
		SUCCESS=1
		echo "Migration completed successfully."
		echo "Rollback backup retained at: $BACKUP_DIRECTORY"
		exit 0
	fi
	sleep 10
done

echo "SaaS health check failed after migration; rolling back." >&2
exit 1
