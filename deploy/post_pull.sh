#!/bin/sh

cd /webapps/noderps/noderps

# DEploy configuration
cp deploy/nginx/noderps.conf /etc/nginx/sites-available/noderps.cfg
ln -nsf /etc/nginx/sites-available/noderps.cfg /etc/nginx/sites-enabled/noderps.cfg
cp deploy/haproxy/noderps.cfg /etc/haproxy/noderps.cfg

# Restart services
service nginx reload
start-stop-daemon --stop --name haproxy
haproxy -f /etc/haproxy/noderps.cfg -D
forever stop room.js
forever start room.js

