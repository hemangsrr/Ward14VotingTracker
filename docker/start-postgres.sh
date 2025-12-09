#!/bin/bash
# Wrapper script to start PostgreSQL with version detection

PG_VERSION=$(ls /usr/lib/postgresql/ | head -n 1)
PG_BIN="/usr/lib/postgresql/${PG_VERSION}/bin"

exec ${PG_BIN}/postgres -D /var/lib/postgresql/data
