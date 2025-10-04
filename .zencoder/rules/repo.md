---
description: Repository Information Overview
alwaysApply: true
---

# TandoorBaaz Repo Information

I'll help you generate a comprehensive repository information file. Let me start by exploring your repository structure to gather all the necessary information.

Let me check the package.json file to understand the project dependencies and configuration:

Now let's look at the Dockerfile to understand the containerization setup:

Let's check the docker-compose.yml file:

Let's look at the main entry point file:

Let's check the server.js file:

Let's check the relay.js file:

Let's check the README.md file:

Now, let's create the .zencoder/rules directory if it doesn't exist:

powershell
New-Item -ItemType Directory -Path "c:\dev\tandoorbaaz\.zencoder\rules" -Force
Now, let's create the repo.md file with all the collected information:

## Summary

TandoorBaaz is a Node.js application that hosts multiple websites under the /public directory and serves them dynamically. It includes a restaurant management system with features for order processing, analytics, inventory management, and payment processing.

## Structure

- **public/**: Contains multiple sub-websites organized by functionality
  - **accounts/**: Account management interface
  - **buy/**: Main ordering and restaurant management system
  - **coupon/**: Coupon management system
  - **khata/**: Payment tracking system
  - **ocr/**: Optical character recognition tools
  - **partner/**: Partner management interface
  - **upi/**: UPI payment integration
- **Dockerfile & docker-compose.yml**: Container configuration
- **server.js**: Main application entry point
- **server.js**: Service orchestration
- **relay.js**: Browser integration for error handling

## Language & Runtime

**Language**: JavaScript (Node.js)
**Version**: ES Modules (type: "module")
**Runtime**: Node.js 18 (as specified in Dockerfile)
**Package Manager**: npm

## Dependencies

**Main Dependencies**:

- express: ^4.21.2 - Web server framework
- maher-zubair-baileys: ^6.6.5 - WhatsApp integration
- puppeteer: ^24.9.0 - Browser automation
- qrcode: ^1.5.4 - QR code generation
- ws: ^8.18.2 - WebSocket implementation
- nodemailer: ^6.10.0 - Email sending
- chokidar: ^4.0.3 - File watching

## Build & Installation

```bash
npm install
npm start
```

## Docker

**Dockerfile**: Uses Node.js 18 as base image
**Services**:

- web: Runs the main application on port 3000
- whatsapp-bot: Runs WhatsApp integration on port 3010
  **Configuration**:
- Exposes ports 3000 and 3010
- Mounts the application directory as a volume
- Preserves node_modules in container

## Main Components

**Web Server**:

- Express.js application serving multiple websites
- Dynamic routing based on directory structure
- REST API for order management (CRUD operations)

**Frontend Applications**:

- Multiple web interfaces in the public directory
- Analytics dashboard with charts and data visualization
- Order management system
- Inventory tracking
- Payment processing

**Integration**:

- WhatsApp bot integration (commented out in server.js)
- Browser automation with Puppeteer
- Error monitoring and automatic fixing via WebSocket

## Usage

The application serves multiple websites from the public directory, with each subdirectory representing a different application. The main entry point is server.js, which dynamically routes requests to the appropriate files based on the URL path.

The server can be started with `npm start`, which runs the server.js file. Docker Compose can be used to start both the web server and the WhatsApp bot services.
