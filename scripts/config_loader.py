#!/usr/bin/env python3
"""
KeywordCrawler Python Config Loader (Open Source Edition)
Reads config.json from project root with sensible fallbacks and env override.
"""
import os
import json

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_ROOT = os.path.abspath(os.path.join(SCRIPT_DIR, '..'))
CONFIG_FILE = os.path.join(PROJECT_ROOT, 'config.json')

_raw = {}
if os.path.exists(CONFIG_FILE):
    try:
        with open(CONFIG_FILE, 'r', encoding='utf-8') as f:
            _raw = json.load(f)
    except Exception as e:
        print(f"[config_loader] Error reading config.json: {e}")

APP_NAME = _raw.get('app', {}).get('name', 'CorporateKeywordCrawler')
PORT = int(os.environ.get('PORT') or _raw.get('app', {}).get('port', 3000))
BASE_PATH = os.environ.get('NEXT_PUBLIC_BASE_PATH', _raw.get('app', {}).get('basePath', ''))

DB_PATH = os.path.abspath(os.path.join(PROJECT_ROOT, _raw.get('database', {}).get('sqlitePath', 'data/crawler.db')))
VECTOR_PATH = os.path.abspath(os.path.join(PROJECT_ROOT, _raw.get('database', {}).get('vectorStorePath', 'data/vector_store')))
COVERS_DIR = os.path.abspath(os.path.join(PROJECT_ROOT, _raw.get('assets', {}).get('coversDir', 'public/covers')))

ROUTER_BASE_URL = os.environ.get('ROUTER_BASE_URL', _raw.get('llm', {}).get('routerBaseUrl', 'http://localhost:8000/v1'))
LLM_MODEL = os.environ.get('LLM_MODEL', _raw.get('llm', {}).get('model', 'gpt-4o-mini'))
LLM_TIMEOUT = int(_raw.get('llm', {}).get('timeoutMs', 8000)) / 1000.0
