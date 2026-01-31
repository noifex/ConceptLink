# ==========================================
# Stage 1: Build（ビルド環境）
# ==========================================
FROM gradle:jdk21 AS build

WORKDIR /app

# Gradleキャッシュを活用するため、依存関係を先にコピー
COPY build.gradle settings.gradle ./
COPY gradle ./gradle
RUN gradle dependencies --no-daemon || true

# ソースコードをコピー
COPY src ./src

# JARファイルをビルド
RUN gradle bootJar --no-daemon

# ==========================================
# Stage 2: Runtime（実行環境）
# ==========================================
FROM eclipse-temurin:21-jre-alpine

WORKDIR /app

# ビルドステージからJARをコピー
COPY --from=build /app/build/libs/*.jar app.jar

# ヘルスチェック用のエンドポイント
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8080/actuator/health || exit 1

# ポート公開
EXPOSE 8080

# アプリケーション起動
ENTRYPOINT ["java", "-jar", "app.jar"]

