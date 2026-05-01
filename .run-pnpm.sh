#!/bin/bash
. ~/.nvm/nvm.sh
cd /mnt/c/Users/andre/Documents/theprimeway/monorepo
nohup pnpm install --reporter=append-only > .pnpm-install.log 2>&1 &
echo "PID=$!"
