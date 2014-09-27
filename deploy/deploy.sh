#!/bin/bash

CUR_DIR="${BASH_SOURCE%/*}"

sudo ${CUR_DIR}/pull.sh "$1"
sudo ${CUR_DIR}/post_pull.sh

