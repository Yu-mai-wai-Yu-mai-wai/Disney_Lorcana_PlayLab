#!/bin/bash
yum update -y
yum install -y git aws-cli nginx nodejs

# Create directory structure
mkdir -p /var/www/lorcana-web
mkdir -p /var/www/lorcana-backend

# Sync frontend SPA and backend bundle from S3
aws s3 sync s3://lorcana-playlab-static-953899323223 /var/www/lorcana-web --region us-east-1 || true
aws s3 cp s3://lorcana-playlab-assets-953899323223/server.cjs /var/www/lorcana-backend/server.cjs --region us-east-1 || true

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

    location /ws {
        proxy_pass http://127.0.0.1:3001;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
    }

    location / {
        try_files $uri $uri/ /index.html;
    }
}
EOF

# Ensure default nginx config does not conflict on port 80
sed -i 's/listen       80/listen       8080/g' /etc/nginx/nginx.conf || true
sed -i 's/listen       \[::\]:80/listen       \[::\]:8080/g' /etc/nginx/nginx.conf || true

systemctl restart nginx
systemctl enable nginx
