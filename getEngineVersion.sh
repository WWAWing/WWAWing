#!/bin/sh

node -e "console.log('v'+require('./packages/engine/package.json').version)"

