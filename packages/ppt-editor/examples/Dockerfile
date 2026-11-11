FROM node:24-bookworm-slim
RUN apt-get update && apt-get install -y --no-install-recommends libreoffice-impress fonts-noto-cjk && rm -rf /var/lib/apt/lists/*
WORKDIR /app
# Build and pack the package on the host, then place the tarball next to this Dockerfile.
COPY element-ai-vue-ppt-0.1.0.tgz ./package.tgz
RUN npm install ./package.tgz vue@3 && rm package.tgz
COPY server-container.mjs ./server.mjs
USER node
ENV HOST=0.0.0.0 PORT=8787 PPT_DATA_DIR=/data
EXPOSE 8787
CMD ["node", "server.mjs"]
