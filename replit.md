# Minecraft AFK Bot

## Overview
This is a Minecraft bot project that uses the mineflayer library to create an automated bot that can stay connected to a Minecraft server and perform simple AFK (Away From Keyboard) actions to avoid being kicked for inactivity.

## Project Architecture
- **Language**: Node.js
- **Main Framework**: mineflayer v4.33.0
- **Project Type**: Console application / Bot
- **Entry Point**: bot.js

## Current State
- Project has been imported from GitHub and configured for Replit
- Syntax errors have been fixed
- Dependencies are properly installed
- Workflow is configured to run the bot continuously
- Bot is ready to connect but requires user authentication

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
1. Add your Minecraft email to the `MC_EMAIL` environment variable in Replit secrets
2. Run the project - it will start the bot workflow automatically
3. Follow the Microsoft authentication prompts in the console
4. The bot will connect and start its AFK routine

## Recent Changes
- 2025-09-21: Fixed syntax error in bot.js (missing comma)
- 2025-09-21: Added npm start script to package.json
- 2025-09-21: Configured Minecraft Bot workflow for continuous running
- 2025-09-21: Project imported and set up for Replit environment

## User Preferences
- Project imported from GitHub - maintaining original structure and functionality
- Console-based application with continuous workflow