#!/bin/bash

BRANCH="$1"
if [ -z "$BRANCH" ]
then
    BRANCH="master"
fi

git fetch
git checkout "$BRANCH"
git reset --hard "origin/$BRANCH"

