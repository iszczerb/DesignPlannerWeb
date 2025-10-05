# Use .NET 9 SDK for building
FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY backend/DesignPlanner.Core/DesignPlanner.Core.csproj backend/DesignPlanner.Core/
COPY backend/DesignPlanner.Data/DesignPlanner.Data.csproj backend/DesignPlanner.Data/
COPY backend/DesignPlanner.Api/DesignPlanner.Api.csproj backend/DesignPlanner.Api/

# Restore dependencies
RUN dotnet restore backend/DesignPlanner.Api/DesignPlanner.Api.csproj

# Copy everything else
COPY backend/ backend/

# Build and publish
RUN dotnet publish backend/DesignPlanner.Api/DesignPlanner.Api.csproj -c Release -o /app/publish

# Use .NET 9 runtime for running
FROM mcr.microsoft.com/dotnet/aspnet:9.0
WORKDIR /app
COPY --from=build /app/publish .

# Expose port
EXPOSE 8080

# Set environment variables
ENV ASPNETCORE_URLS=http://0.0.0.0:8080

# Run the application
ENTRYPOINT ["dotnet", "DesignPlanner.Api.dll"]
