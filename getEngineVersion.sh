#!/bin/sh

npx lerna ls 2> /dev/null | grep "engine" | awk '{ print $2 }'

