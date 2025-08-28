#!/bin/bash

# Liquid Liberty Subgraph Deployment Script
# This script automates the deployment process for the subgraph

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${GREEN}[INFO]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_prerequisites() {
    print_status "Checking prerequisites..."
    
    if ! command -v node &> /dev/null; then
        print_error "Node.js is not installed. Please install Node.js v16 or later."
        exit 1
    fi
    
    if ! command -v npm &> /dev/null; then
        print_error "npm is not installed. Please install npm."
        exit 1
    fi
    
    if ! command -v graph &> /dev/null; then
        print_warning "Graph CLI is not installed. Installing now..."
        npm install -g @graphprotocol/graph-cli
    fi
    
    print_status "Prerequisites check passed!"
}

# Install dependencies
install_dependencies() {
    print_status "Installing dependencies..."
    npm install
}

# Generate code
generate_code() {
    print_status "Generating code..."
    npm run codegen
}

# Build the subgraph
build_subgraph() {
    print_status "Building subgraph..."
    npm run build
}

# Deploy to Graph Studio
deploy_to_studio() {
    print_status "Deploying to Graph Studio..."
    
    if [ -z "$GRAPH_STUDIO_ACCESS_TOKEN" ]; then
        print_error "GRAPH_STUDIO_ACCESS_TOKEN environment variable is not set."
        print_warning "Please set it with: export GRAPH_STUDIO_ACCESS_TOKEN=your_token"
        exit 1
    fi
    
    graph auth --studio $GRAPH_STUDIO_ACCESS_TOKEN
    npm run deploy
}

# Deploy to hosted service
deploy_to_hosted() {
    print_status "Deploying to hosted service..."
    
    if [ -z "$HOSTED_SERVICE_ACCESS_TOKEN" ]; then
        print_error "HOSTED_SERVICE_ACCESS_TOKEN environment variable is not set."
        print_warning "Please set it with: export HOSTED_SERVICE_ACCESS_TOKEN=your_token"
        exit 1
    fi
    
    graph auth --product hosted-service $HOSTED_SERVICE_ACCESS_TOKEN
    npm run deploy:hosted
}

# Deploy locally
deploy_locally() {
    print_status "Deploying locally..."
    
    # Check if Docker is running
    if ! docker info &> /dev/null; then
        print_error "Docker is not running. Please start Docker and try again."
        exit 1
    fi
    
    # Start local Graph Node
    print_status "Starting local Graph Node..."
    docker-compose up -d
    
    # Wait for services to be ready
    print_status "Waiting for services to be ready..."
    sleep 30
    
    # Create and deploy subgraph
    npm run create:local
    npm run deploy:local
    
    print_status "Local deployment completed!"
    print_status "Graph Node: http://localhost:8000"
    print_status "GraphiQL: http://localhost:8001"
}

# Main deployment function
main() {
    local deployment_type=${1:-studio}
    
    print_status "Starting Liquid Liberty Subgraph deployment..."
    
    check_prerequisites
    install_dependencies
    generate_code
    build_subgraph
    
    case $deployment_type in
        "studio")
            deploy_to_studio
            ;;
        "hosted")
            deploy_to_hosted
            ;;
        "local")
            deploy_locally
            ;;
        *)
            print_error "Invalid deployment type. Use: studio, hosted, or local"
            exit 1
            ;;
    esac
    
    print_status "Deployment completed successfully!"
}

# Check command line arguments
if [ "$1" = "--help" ] || [ "$1" = "-h" ]; then
    echo "Usage: $0 [deployment_type]"
    echo ""
    echo "Deployment types:"
    echo "  studio  - Deploy to Graph Studio (default)"
    echo "  hosted  - Deploy to hosted service"
    echo "  local   - Deploy to local Graph Node"
    echo ""
    echo "Environment variables:"
    echo "  GRAPH_STUDIO_ACCESS_TOKEN - Required for studio deployment"
    echo "  HOSTED_SERVICE_ACCESS_TOKEN - Required for hosted deployment"
    echo ""
    echo "Examples:"
    echo "  $0 studio"
    echo "  $0 hosted"
    echo "  $0 local"
    exit 0
fi

# Run main function
main "$@"
