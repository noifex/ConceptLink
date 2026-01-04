FROM node:20-alpine AS build

WORKDIR /app

# package.jsonを先にコピー（キャッシュ活用）
COPY package*.json ./

# 依存関係インストール
RUN npm ci

# ソースコードをコピー
COPY . .

# 本番用ビルド
RUN npm run build

# ==========================================
# Stage 2: Runtime（Nginx）
# ==========================================
FROM nginx:alpine

# ビルド成果物をコピー
COPY --from=build /app/dist /usr/share/nginx/html

# Nginx設定をコピー
COPY nginx.conf /etc/nginx/conf.d/default.conf

# ポート公開
EXPOSE 80

# Nginx起動（デフォルトコマンドを使用）
CMD ["nginx", "-g", "daemon off;"]