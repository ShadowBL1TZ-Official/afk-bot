# Minecraft AFK Bot

## Overview
This is a Minecraft bot project that uses the mineflayer library to create an automated bot that can stay connected to a Minecraft server and perform simple AFK (Away From Keyboard) actions to avoid being kicked for inactivity.

## Project Architecture
- **Language**: Node.js
- **Main Framework**: mineflayer v4.33.0
- **Project Type**: Console application / Bot
- **Entry Point**: bot.js

## Current State
- Complete web-based Minecraft bot control panel with Modrinth-style design
- Real-time console showing server logs, chat messages, and authentication prompts
- Server/account configuration interface with connect/disconnect functionality
- WebSocket-based real-time communication between frontend and backend
- Secure admin token authentication system
- Unified console with filtering by log type (Chat, Server, Console, Auth, Errors)
- Chat input for sending messages and commands to the Minecraft server
- Auto-reconnection and AFK prevention features

## Configuration
The bot connects to `donutsmp.net:25565` using Microsoft authentication. To run the bot, you need to:

1. Set the `MC_EMAIL` environment variable with your Minecraft account email
2. The bot will prompt for Microsoft authentication on first run
3. Once authenticated, the bot will automatically reconnect if disconnected

## Features
- Automatic reconnection on disconnect
- AFK prevention (moves head slightly every 30 seconds)
- Console logging of connection status

## Setup Instructions
1. The ADMIN_TOKEN has been configured for web interface security
2. Access the web interface through the Replit webview
3. Enter the admin token when prompted on first access
4. Configure server settings (host, port, email, authentication type)
5. Click Connect to start the bot connection
6. Follow any Microsoft authentication prompts in the console
7. Use the chat input to send messages or commands to the server
8. Monitor all activity through the real-time console with filters

## Recent Changes
- 2025-09-22: Created complete web-based UI with Modrinth-style design
- 2025-09-22: Implemented real-time WebSocket communication for logs and status
- 2025-09-22: Added secure admin token authentication system
- 2025-09-22: Built unified console with filtering capabilities
- 2025-09-22: Added server configuration interface and chat functionality
- 2025-09-22: Fixed infinite recursion issue in logger system
- 2025-09-22: Configured Express server with REST API and static file serving
- 2025-09-21: Fixed syntax error in bot.js and added npm start script
- 2025-09-21: Project imported and set up for Replit environment

## User Preferences
- Project imported from GitHub - maintaining original structure and functionality
- Console-based application with continuous workflow