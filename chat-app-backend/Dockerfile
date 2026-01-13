# ---------- BUILD STAGE ----------
FROM maven:3.9.6-eclipse-temurin-21 AS build

WORKDIR /build

# Copy only backend project
COPY chat-app-backend ./chat-app-backend

# Move into actual Maven project folder
WORKDIR /build/chat-app-backend

# Build Spring Boot jar
RUN mvn clean package -DskipTests


# ---------- RUN STAGE ----------
FROM eclipse-temurin:21-jdk

WORKDIR /app

# Copy jar from build stage
COPY --from=build /build/chat-app-backend/target/*.jar app.jar

EXPOSE 8080

CMD ["java", "-jar", "app.jar"]
