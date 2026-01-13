# ========================
# Build Stage
# ========================
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build
COPY . .
RUN mvn clean package -DskipTests


# ========================
# Runtime Stage
# ========================
FROM eclipse-temurin:21-jdk

WORKDIR /app
COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
