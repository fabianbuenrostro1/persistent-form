#!/bin/bash

# Array of keys to sync
KEYS=(
  "GOOGLE_SERVICE_ACCOUNT_KEY"
  "GOOGLE_SHEET_ID"
  "SMTP_HOST"
  "SMTP_PORT"
  "SMTP_USER"
  "SMTP_PASS"
  "EMAIL_FROM"
  "EMAIL_TO"
  "MAPBOX_ACCESS_TOKEN"
)

# Read .env.local and create a temporary map
# We can't just source it because of the JSON syntax which might not be valid shell export without quoting
# So we will grep for the keys.

for KEY in "${KEYS[@]}"; do
  # Extract value using grep and cut, assuming KEY=VALUE format
  # We use perl for robust regex to matching line starting with KEY=
  VALUE=$(grep "^$KEY=" .env.local | cut -d'=' -f2-)
  
  if [ -z "$VALUE" ]; then
    echo "Warning: Value for $KEY not found in .env.local"
    continue
  fi

  echo "Syncing $KEY..."
  
  # Remove existing
  vercel env rm "$KEY" production -y 2>/dev/null || true
  
  # Add new value
  # We use printf to ensure no trailing newline is added
  printf "%s" "$VALUE" | vercel env add "$KEY" production
  
  echo "Updated $KEY"
done
