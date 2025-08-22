#!/bin/bash
export NODE_ENV=development
echo "Starting server with NODE_ENV=$NODE_ENV"
exec node server/server.js