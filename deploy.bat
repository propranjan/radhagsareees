@echo off
REM Docker Deployment Script for Windows
REM Usage: deploy.bat [command]
REM Commands: build, up, down, logs, stop, restart, clean

setlocal enabledelayedexpansion

set DOCKER_COMPOSE_FILE=docker-compose-viton.yml

if "%1%"=="" (
    echo.
    echo Docker Deployment Commands:
    echo.
    echo   deploy.bat build       - Build Docker images
    echo   deploy.bat up          - Start services in foreground
    echo   deploy.bat up-d        - Start services in background
    echo   deploy.bat down        - Stop all services
    echo   deploy.bat logs        - Show service logs
    echo   deploy.bat stop        - Stop services (don't remove)
    echo   deploy.bat restart     - Restart services
    echo   deploy.bat clean       - Stop and remove everything
    echo   deploy.bat ps          - Show running containers
    echo   deploy.bat shell       - Open bash in VITON-HD service
    echo.
    goto :eof
)

if "%1%"=="build" (
    echo Building Docker images...
    docker-compose -f %DOCKER_COMPOSE_FILE% build
    goto :eof
)

if "%1%"=="up" (
    echo Starting services in foreground...
    docker-compose -f %DOCKER_COMPOSE_FILE% up
    goto :eof
)

if "%1%"=="up-d" (
    echo Starting services in background...
    docker-compose -f %DOCKER_COMPOSE_FILE% up -d
    echo.
    echo Services started. Check status with: deploy.bat ps
    echo View logs with: deploy.bat logs
    goto :eof
)

if "%1%"=="down" (
    echo Stopping services...
    docker-compose -f %DOCKER_COMPOSE_FILE% down
    goto :eof
)

if "%1%"=="logs" (
    echo Showing service logs (Ctrl+C to exit)...
    docker-compose -f %DOCKER_COMPOSE_FILE% logs -f
    goto :eof
)

if "%1%"=="viton-logs" (
    echo Showing VITON-HD service logs (Ctrl+C to exit)...
    docker-compose -f %DOCKER_COMPOSE_FILE% logs -f viton-hd-service
    goto :eof
)

if "%1%"=="web-logs" (
    echo Showing Web service logs (Ctrl+C to exit)...
    docker-compose -f %DOCKER_COMPOSE_FILE% logs -f web
    goto :eof
)

if "%1%"=="stop" (
    echo Stopping services...
    docker-compose -f %DOCKER_COMPOSE_FILE% stop
    goto :eof
)

if "%1%"=="restart" (
    echo Restarting services...
    docker-compose -f %DOCKER_COMPOSE_FILE% restart
    goto :eof
)

if "%1%"=="clean" (
    echo Stopping and removing all services and volumes...
    docker-compose -f %DOCKER_COMPOSE_FILE% down -v
    echo.
    echo Cleanup complete. Use "deploy.bat build" to start fresh.
    goto :eof
)

if "%1%"=="ps" (
    echo.
    docker-compose -f %DOCKER_COMPOSE_FILE% ps
    goto :eof
)

if "%1%"=="shell" (
    echo Opening bash in VITON-HD service...
    docker-compose -f %DOCKER_COMPOSE_FILE% exec viton-hd-service bash
    goto :eof
)

if "%1%"=="stats" (
    echo Showing resource usage (Ctrl+C to exit)...
    docker stats
    goto :eof
)

if "%1%"=="health" (
    echo Checking VITON-HD service health...
    docker-compose -f %DOCKER_COMPOSE_FILE% exec viton-hd-service curl http://localhost:5000/health
    goto :eof
)

REM If we get here, unknown command
echo Unknown command: %1%
echo Run "deploy.bat" with no arguments to see available commands.
