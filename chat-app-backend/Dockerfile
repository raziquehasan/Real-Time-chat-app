# ---------- BUILD STAGE ----------
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build

# Copy backend source code
COPY . .

# Build Spring Boot jar
RUN mvn clean package -DskipTests


# ---------- RUN STAGE ----------
FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy jar from build stage
COPY --from=build /build/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
