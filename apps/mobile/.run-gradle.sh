#!/bin/bash
. ~/.nvm/nvm.sh
export ANDROID_HOME=$HOME/android-sdk
export ANDROID_SDK_ROOT=$ANDROID_HOME
export JAVA_HOME=/usr/lib/jvm/java-17-openjdk-amd64
export PATH=$JAVA_HOME/bin:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools:$PATH
export EXPO_PUBLIC_API_URL=https://staging.theprimeway.app
export EXPO_PUBLIC_ENV=staging
cd ~/mobile/android
chmod +x gradlew
./gradlew assembleRelease --no-daemon 2>&1 | tail -100
