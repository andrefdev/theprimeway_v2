#!/bin/bash
. ~/.nvm/nvm.sh
cd ~/mobile
nohup pnpm install --reporter=append-only > install.log 2>&1 &
echo "PID=$!"
