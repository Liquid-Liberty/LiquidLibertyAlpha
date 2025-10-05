@echo off
REM Liquid Liberty Subgraph Deployment Script for Windows
REM This script automates the deployment process for the subgraph

setlocal enabledelayedexpansion

REM Colors for output (Windows doesn't support ANSI colors by default)
set "INFO=[INFO]"
set "WARNING=[WARNING]"
set "ERROR=[ERROR]"

REM Function to print status
:print_status
echo %INFO% %~1
goto :eof

REM Function to print warning
:print_warning
echo %WARNING% %~1
goto :eof

REM Function to print error
:print_error
echo %ERROR% %~1
goto :eof

REM Check if required tools are installed
:check_prerequisites
call :print_status "Checking prerequisites..."

where node >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "Node.js is not installed. Please install Node.js v16 or later."
    exit /b 1
)

where npm >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "npm is not installed. Please install npm."
    exit /b 1
)

where graph >nul 2>nul
if %errorlevel% neq 0 (
    call :print_warning "Graph CLI is not installed. Installing now..."
    npm install -g @graphprotocol/graph-cli
)

call :print_status "Prerequisites check passed!"
goto :eof

REM Install dependencies
:install_dependencies
call :print_status "Installing dependencies..."
npm install
goto :eof

REM Generate code
:generate_code
call :print_status "Generating code..."
npm run codegen
goto :eof

REM Build the subgraph
:build_subgraph
call :print_status "Building subgraph..."
npm run build
goto :eof

REM Deploy to Graph Studio
:deploy_to_studio
call :print_status "Deploying to Graph Studio..."

if "%GRAPH_STUDIO_ACCESS_TOKEN%"=="" (
    call :print_error "GRAPH_STUDIO_ACCESS_TOKEN environment variable is not set."
    call :print_warning "Please set it with: set GRAPH_STUDIO_ACCESS_TOKEN=your_token"
    exit /b 1
)

graph auth --studio %GRAPH_STUDIO_ACCESS_TOKEN%
npm run deploy
goto :eof

REM Deploy to hosted service
:deploy_to_hosted
call :print_status "Deploying to hosted service..."

if "%HOSTED_SERVICE_ACCESS_TOKEN%"=="" (
    call :print_error "HOSTED_SERVICE_ACCESS_TOKEN environment variable is not set."
    call :print_warning "Please set it with: set HOSTED_SERVICE_ACCESS_TOKEN=your_token"
    exit /b 1
)

graph auth --product hosted-service %HOSTED_SERVICE_ACCESS_TOKEN%
npm run deploy:hosted
goto :eof

REM Deploy locally
:deploy_locally
call :print_status "Deploying locally..."

REM Check if Docker is running
docker info >nul 2>nul
if %errorlevel% neq 0 (
    call :print_error "Docker is not running. Please start Docker and try again."
    exit /b 1
)

REM Start local Graph Node
call :print_status "Starting local Graph Node..."
docker-compose up -d

REM Wait for services to be ready
call :print_status "Waiting for services to be ready..."
timeout /t 30 /nobreak >nul

REM Create and deploy subgraph
npm run create:local
npm run deploy:local

call :print_status "Local deployment completed!"
call :print_status "Graph Node: http://localhost:8000"
call :print_status "GraphiQL: http://localhost:8001"
goto :eof

REM Main deployment function
:main
set "deployment_type=%~1"
if "%deployment_type%"=="" set "deployment_type=studio"

call :print_status "Starting Liquid Liberty Subgraph deployment..."

call :check_prerequisites
if %errorlevel% neq 0 exit /b 1

call :install_dependencies
if %errorlevel% neq 0 exit /b 1

call :generate_code
if %errorlevel% neq 0 exit /b 1

call :build_subgraph
if %errorlevel% neq 0 exit /b 1

if "%deployment_type%"=="studio" (
    call :deploy_to_studio
) else if "%deployment_type%"=="hosted" (
    call :deploy_to_hosted
) else if "%deployment_type%"=="local" (
    call :deploy_locally
) else (
    call :print_error "Invalid deployment type. Use: studio, hosted, or local"
    exit /b 1
)

call :print_status "Deployment completed successfully!"
goto :eof

REM Check command line arguments
if "%1"=="--help" goto :help
if "%1"=="-h" goto :help

REM Run main function
call :main %1
exit /b %errorlevel%

:help
echo Usage: %0 [deployment_type]
echo.
echo Deployment types:
echo   studio  - Deploy to Graph Studio ^(default^)
echo   hosted  - Deploy to hosted service
echo   local   - Deploy to local Graph Node
echo.
echo Environment variables:
echo   GRAPH_STUDIO_ACCESS_TOKEN - Required for studio deployment
echo   HOSTED_SERVICE_ACCESS_TOKEN - Required for hosted deployment
echo.
echo Examples:
echo   %0 studio
echo   %0 hosted
echo   %0 local
exit /b 0
