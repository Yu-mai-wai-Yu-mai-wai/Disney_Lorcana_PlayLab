#!/bin/bash
yum update -y
yum install -y git aws-cli nginx nodejs

# Create directory structure
mkdir -p /var/www/lorcana-web
mkdir -p /var/www/lorcana-backend

# Sync frontend SPA and backend bundle from S3
aws s3 sync s3://lorcana-playlab-static-953899323223 /var/www/lorcana-web --region us-east-1 || true
aws s3 cp s3://lorcana-playlab-assets-953899323223/server.cjs /var/www/lorcana-backend/server.cjs --region us-east-1 || true

# Secrets from SSM (via LabInstanceProfile). Fail closed: no env file = backend never starts.
ssm() { aws ssm get-parameter --region us-east-1 --name "$1" --with-decryption --query Parameter.Value --output text; }
umask 077
if JWT=$(ssm /lorcana/jwt-secret) && ADMIN=$(ssm /lorcana/admin-passcode) && SQS=$(ssm /lorcana/sqs-url); then
  printf 'JWT_SECRET=%s\nADMIN_PASSCODE=%s\nLORCANA_SQS_URL=%s\n' "$JWT" "$ADMIN" "$SQS" > /etc/lorcana.env
else
  echo "[FATAL] Could not read /lorcana/* from SSM; backend will not start" >&2
fi
unset JWT ADMIN SQS
umask 022

# Create systemd service for Lorcana Backend
cat << 'EOF' > /etc/systemd/system/lorcana-backend.service
[Unit]
Description=Disney Lorcana PlayLab Backend Server
After=network.target

[Service]
Type=simple
User=root
WorkingDirectory=/var/www/lorcana-backend
ExecStart=/usr/bin/node /var/www/lorcana-backend/server.cjs
Restart=always
RestartSec=5
EnvironmentFile=/etc/lorcana.env
Environment=NODE_ENV=production
Environment=PORT=3001
Environment=AWS_REGION=us-east-1
Environment=USERS_TABLE=UsersTable
Environment=DECKS_TABLE=DecksTable
Environment=ROOM_TABLE=LorcanaRoomStateV2
Environment=MATCHMAKING_TABLE=LorcanaMatchmaking

[Install]
WantedBy=multi-user.target
EOF

systemctl daemon-reload
systemctl enable --now lorcana-backend

# Configure Nginx for Frontend SPA + Reverse Proxy + Health Check
cat << 'EOF' > /etc/nginx/conf.d/lorcana.conf
server {
    listen 80 default_server;
    server_name _;
    root /var/www/lorcana-web;
    index index.html;

    # Text assets travel compressed (the card data is 2.35 MB of JSON)
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css application/json application/javascript image/svg+xml;

    # Same security headers as nginx.conf in repo
    add_header X-Frame-Options "DENY" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    location = /health {
        access_log off;
        add_header Content-Type text/plain;
        return 200 'healthy';
    }

    location /api/ {
        proxy_pass http://127.0.0.1:3001/;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    }

    # Realtime runs on API Gateway WebSocket + Lambda (state in DynamoDB), not on EC2

    # Vite emits hashed names under /assets/, so a file never changes under the same name: cache for a year.
    # add_header inside a location replaces the inherited ones, so the security headers are repeated here.
    # Cache-Control has no "always" on purpose: a 404 must not be cached as immutable.
    location /assets/ {
        add_header Cache-Control "public, max-age=31536000, immutable";
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
        try_files $uri =404;
    }

    # index.html names the hashed files, so it is revalidated on every load; a new publish shows up immediately
    location = /index.html {
        add_header Cache-Control "no-cache" always;
        add_header X-Frame-Options "DENY" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header Referrer-Policy "strict-origin-when-cross-origin" always;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Ensure fallback index.html exists with Instance ID and Availability Zone
if [ ! -f /var/www/lorcana-web/index.html ]; then
  TOKEN=$(curl -s -X PUT "http://169.254.169.254/latest/api/token" -H "X-aws-ec2-metadata-token-ttl-seconds: 60" 2>/dev/null || true)
  AZ=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/placement/availability-zone 2>/dev/null || echo "us-east-1a")
  INSTANCE_ID=$(curl -s -H "X-aws-ec2-metadata-token: $TOKEN" http://169.254.169.254/latest/meta-data/instance-id 2>/dev/null || hostname)
  cat << HTML > /var/www/lorcana-web/index.html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Disney Lorcana PlayLab - AWS Multi-AZ</title>
  <style>
    body { background: #0B0F19; color: #F1F5F9; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; display: flex; align-items: center; justify-content: center; min-height: 100vh; margin: 0; }
    .card { background: #141a26; border: 2px solid #F59E0B; border-radius: 20px; padding: 40px; text-align: center; box-shadow: 0 0 30px rgba(245, 158, 11, 0.2); max-width: 500px; }
    h1 { color: #F59E0B; margin: 0 0 10px 0; font-size: 24px; }
    .badge { display: inline-block; background: rgba(16, 185, 129, 0.2); color: #10B981; border: 1px solid #10B981; padding: 4px 12px; border-radius: 9999px; font-weight: bold; font-size: 12px; margin-bottom: 20px; }
    .info-box { background: #0B0F19; border: 1px solid #30363d; border-radius: 12px; padding: 15px; text-align: left; font-family: monospace; font-size: 14px; margin-top: 15px; }
    .info-row { display: flex; justify-content: space-between; padding: 6px 0; border-bottom: 1px solid #21262d; }
    .info-row:last-child { border-bottom: none; }
    .label { color: #94A3B8; }
    .value { color: #F59E0B; font-weight: bold; }
  </style>
</head>
<body>
  <div class="card">
    <h1>🏰 Disney Lorcana PlayLab</h1>
    <div class="badge">● AWS LEAN MULTI-AZ CLOUD READY</div>
    <div class="info-box">
      <div class="info-row"><span class="label">Instance ID:</span><span class="value">$INSTANCE_ID</span></div>
      <div class="info-row"><span class="label">Availability Zone:</span><span class="value" style="color: #10B981;">$AZ</span></div>
      <div class="info-row"><span class="label">ASG Cluster:</span><span class="value">lorcana-asg (Min: 2)</span></div>
      <div class="info-row"><span class="label">ALB Health:</span><span class="value">HTTP 200 OK</span></div>
    </div>
  </div>
</body>
</html>
HTML
fi

# Ensure default nginx config does not conflict on port 80
sed -i -E 's/listen\s+80;/listen 8080;/g' /etc/nginx/nginx.conf || true
sed -i -E 's/listen\s+\[::\]:80;/listen [::]:8080;/g' /etc/nginx/nginx.conf || true

systemctl restart nginx
systemctl enable nginx
