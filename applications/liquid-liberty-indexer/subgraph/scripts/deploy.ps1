# Liquid Liberty Subgraph Deployment Script for Windows PowerShell
# This script automates the deployment process for the subgraph

param(
    [Parameter(Position=0)]
    [ValidateSet("studio", "hosted", "local")]
    [string]$DeploymentType = "studio"
)

# Colors for output
$Red = "Red"
$Green = "Green"
$Yellow = "Yellow"

# Function to print colored output
function Write-Status {
    param([string]$Message)
    Write-Host "[INFO] $Message" -ForegroundColor $Green
}

function Write-Warning {
    param([string]$Message)
    Write-Host "[WARNING] $Message" -ForegroundColor $Yellow
}

function Write-Error {
    param([string]$Message)
    Write-Host "[ERROR] $Message" -ForegroundColor $Red
}

# Check if required tools are installed
function Test-Prerequisites {
    Write-Status "Checking prerequisites..."
    
    if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
        Write-Error "Node.js is not installed. Please install Node.js v16 or later."
        exit 1
    }
    
    if (-not (Get-Command npm -ErrorAction SilentlyContinue)) {
        Write-Error "npm is not installed. Please install npm."
        exit 1
    }
    
    if (-not (Get-Command graph -ErrorAction SilentlyContinue)) {
        Write-Warning "Graph CLI is not installed. Installing now..."
        npm install -g @graphprotocol/graph-cli
    }
    
    Write-Status "Prerequisites check passed!"
}

# Install dependencies
function Install-Dependencies {
    Write-Status "Installing dependencies..."
    npm install
}

# Generate code
function Invoke-Codegen {
    Write-Status "Generating code..."
    npm run codegen
}

# Build the subgraph
function Build-Subgraph {
    Write-Status "Building subgraph..."
    npm run build
}

# Deploy to Graph Studio
function Deploy-ToStudio {
    Write-Status "Deploying to Graph Studio..."
    
    if (-not $env:GRAPH_STUDIO_ACCESS_TOKEN) {
        Write-Error "GRAPH_STUDIO_ACCESS_TOKEN environment variable is not set."
        Write-Warning "Please set it with: `$env:GRAPH_STUDIO_ACCESS_TOKEN='your_token'"
        exit 1
    }
    
    graph auth --studio $env:GRAPH_STUDIO_ACCESS_TOKEN
    npm run deploy
}

# Deploy to hosted service
function Deploy-ToHosted {
    Write-Status "Deploying to hosted service..."
    
    if (-not $env:HOSTED_SERVICE_ACCESS_TOKEN) {
        Write-Error "HOSTED_SERVICE_ACCESS_TOKEN environment variable is not set."
        Write-Warning "Please set it with: `$env:HOSTED_SERVICE_ACCESS_TOKEN='your_token'"
        exit 1
    }
    
    graph auth --product hosted-service $env:HOSTED_SERVICE_ACCESS_TOKEN
    npm run deploy:hosted
}

# Deploy locally
function Deploy-Locally {
    Write-Status "Deploying locally..."
    
    # Check if Docker is running
    try {
        docker info | Out-Null
    } catch {
        Write-Error "Docker is not running. Please start Docker and try again."
        exit 1
    }
    
    # Start local Graph Node
    Write-Status "Starting local Graph Node..."
    docker-compose up -d
    
    # Wait for services to be ready
    Write-Status "Waiting for services to be ready..."
    Start-Sleep -Seconds 30
    
    # Create and deploy subgraph
    npm run create:local
    npm run deploy:local
    
    Write-Status "Local deployment completed!"
    Write-Status "Graph Node: http://localhost:8000"
    Write-Status "GraphiQL: http://localhost:8001"
}

# Main deployment function
function Start-Deployment {
    param([string]$Type)
    
    Write-Status "Starting Liquid Liberty Subgraph deployment..."
    
    Test-Prerequisites
    Install-Dependencies
    Invoke-Codegen
    Build-Subgraph
    
    switch ($Type) {
        "studio" { Deploy-ToStudio }
        "hosted" { Deploy-ToHosted }
        "local" { Deploy-Locally }
        default {
            Write-Error "Invalid deployment type. Use: studio, hosted, or local"
            exit 1
        }
    }
    
    Write-Status "Deployment completed successfully!"
}

# Show help if requested
if ($args -contains "--help" -or $args -contains "-h") {
    Write-Host "Usage: .\deploy.ps1 [deployment_type]" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Deployment types:" -ForegroundColor $Green
    Write-Host "  studio  - Deploy to Graph Studio (default)" -ForegroundColor $Green
    Write-Host "  hosted  - Deploy to hosted service" -ForegroundColor $Green
    Write-Host "  local   - Deploy to local Graph Node" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Environment variables:" -ForegroundColor $Green
    Write-Host "  `$env:GRAPH_STUDIO_ACCESS_TOKEN - Required for studio deployment" -ForegroundColor $Green
    Write-Host "  `$env:HOSTED_SERVICE_ACCESS_TOKEN - Required for hosted deployment" -ForegroundColor $Green
    Write-Host ""
    Write-Host "Examples:" -ForegroundColor $Green
    Write-Host "  .\deploy.ps1 studio" -ForegroundColor $Green
    Write-Host "  .\deploy.ps1 hosted" -ForegroundColor $Green
    Write-Host "  .\deploy.ps1 local" -ForegroundColor $Green
    exit 0
}

# Run deployment
Start-Deployment -Type $DeploymentType
