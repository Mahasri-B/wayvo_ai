#!/usr/bin/env bash
set -e
pip install -r requirements.txt
python ingestion/seed_all.py || true
