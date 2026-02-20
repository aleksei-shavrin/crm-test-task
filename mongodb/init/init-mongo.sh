#!/bin/bash
echo "=== STARTING INIT SCRIPT ==="
echo "Root user: $MONGO_INITDB_ROOT_USERNAME"
echo "App user: $MONGO_INITDB_USERNAME"

mongosh <<EOF
use admin

db.createUser({
    user: "$MONGO_INITDB_USERNAME",
    pwd: "$MONGO_INITDB_PASSWORD",
    roles: [
        { role: "readWrite", db: "${MONGO_INITDB_DATABASE}" },
        { role: "dbAdmin", db: "${MONGO_INITDB_DATABASE}" }
    ]
});

use ${MONGO_INITDB_DATABASE}
db.createCollection('users');
db.createCollection('clients');
db.createCollection('tasks');

db.test.insertOne({ 
    name: "init-test", 
    createdAt: new Date(),
    initializedBy: "$MONGO_INITDB_USERNAME"
});

EOF