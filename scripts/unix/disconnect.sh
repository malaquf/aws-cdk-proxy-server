#!/bin/sh

FORWARDED_PORT=3128

lsof -P | grep ':'${FORWARDED_PORT} | awk '{print $2}' | xargs kill -9

echo "Disconnected"