#!/usr/bin/env bash
# Appends Docker/infrastructure defaults to the minimal PRODUCTION_ENV block.
# Usage: PRODUCTION_ENV="$(cat minimal.env)" NEXT_PUBLIC_SAAS_URL=... bash deploy/append-production-env.sh

set -euo pipefail

if [ -z "${PRODUCTION_ENV:-}" ]; then
	echo "PRODUCTION_ENV is required" >&2
	exit 1
fi

read_env_val() {
	local key="$1"
	grep -E "^${key}=" <<< "$PRODUCTION_ENV" | head -1 | cut -d= -f2- | tr -d "\"'"
}

POSTGRES_PASSWORD="$(read_env_val POSTGRES_PASSWORD)"
MINIO_ROOT_PASSWORD="$(read_env_val MINIO_ROOT_PASSWORD)"

if [ -z "$POSTGRES_PASSWORD" ]; then
	echo "POSTGRES_PASSWORD is required in PRODUCTION_ENV" >&2
	exit 1
fi

if [ -z "$MINIO_ROOT_PASSWORD" ]; then
	echo "MINIO_ROOT_PASSWORD is required in PRODUCTION_ENV" >&2
	exit 1
fi

POSTGRES_USER="${POSTGRES_USER:-postgres}"
POSTGRES_DB="${POSTGRES_DB:-supastarter}"
MINIO_ROOT_USER="${MINIO_ROOT_USER:-minioadmin}"
GHCR_OWNER="${GHCR_OWNER:-iamreda}"

{
	printf '%s\n' "$PRODUCTION_ENV"
	printf 'POSTGRES_USER=%s\n' "$POSTGRES_USER"
	printf 'POSTGRES_DB=%s\n' "$POSTGRES_DB"
	printf 'DATABASE_URL=postgresql://%s:%s@postgres:5432/%s\n' "$POSTGRES_USER" "$POSTGRES_PASSWORD" "$POSTGRES_DB"
	printf 'MINIO_ROOT_USER=%s\n' "$MINIO_ROOT_USER"
	printf 'STORAGE_PROVIDER=s3\n'
	printf 'S3_ENDPOINT=http://minio:9000\n'
	printf 'S3_REGION=us-east-1\n'
	printf 'S3_ACCESS_KEY_ID=%s\n' "$MINIO_ROOT_USER"
	printf 'S3_SECRET_ACCESS_KEY=%s\n' "$MINIO_ROOT_PASSWORD"
	printf 'NEXT_PUBLIC_AVATARS_BUCKET_NAME=avatars\n'
	printf 'GHCR_OWNER=%s\n' "$GHCR_OWNER"
	printf 'NEXT_PUBLIC_SAAS_URL=%s\n' "${NEXT_PUBLIC_SAAS_URL:?NEXT_PUBLIC_SAAS_URL is required}"
	printf 'NEXT_PUBLIC_MARKETING_URL=%s\n' "${NEXT_PUBLIC_MARKETING_URL:?NEXT_PUBLIC_MARKETING_URL is required}"
}
