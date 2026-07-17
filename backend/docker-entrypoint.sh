#!/bin/sh
set -e

echo "Waiting for database and applying migrations..."
until npx prisma migrate deploy; do
  echo "Migration failed, retrying in 3s..."
  sleep 3
done

echo "Checking whether demo data needs seeding..."
NEEDS_SEED=$(node -e "
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
prisma.user.count()
  .then((count) => { console.log(count === 0 ? 'yes' : 'no'); process.exit(0); })
  .catch(() => { console.log('yes'); process.exit(0); });
")

if [ "$NEEDS_SEED" = "yes" ]; then
  echo "Seeding database with demo data..."
  npm run seed
else
  echo "Database already has data, skipping seed."
fi

echo "Starting server..."
exec node dist/src/main
