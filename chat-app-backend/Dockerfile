FROM eclipse-temurin:21-jdk

WORKDIR /app

COPY chat-app-backend/target/*.jar app.jar

EXPOSE 8080

ENTRYPOINT ["java", "-jar", "app.jar"]
