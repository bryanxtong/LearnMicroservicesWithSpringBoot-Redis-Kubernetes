FROM eclipse-temurin:17-jre-alpine
RUN addgroup -g 1000 -S appuser && adduser -u 1000 -S appuser -G appuser
WORKDIR /app
COPY ./target/logs-0.0.1-SNAPSHOT.jar app.jar
RUN chown -R appuser:appuser /app
USER appuser
EXPOSE 8580
HEALTHCHECK --interval=30s --timeout=3s --start-period=60s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:8580/actuator/health || exit 1
CMD ["java", "-jar", "app.jar"]
