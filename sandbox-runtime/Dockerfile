FROM eclipse-temurin:17-jdk

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends nodejs \
  && rm -rf /var/lib/apt/lists/*

RUN useradd -m -u 10001 sandbox

COPY src ./src
COPY sandbox-runtime ./sandbox-runtime

RUN mkdir -p /app/.java-runtime/classes && chown -R sandbox:sandbox /app

USER sandbox

ENV SANDBOX_PORT=7070
EXPOSE 7070

CMD ["nodejs", "sandbox-runtime/server.js"]
