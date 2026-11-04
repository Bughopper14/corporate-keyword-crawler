#!/usr/bin/env python3
"""
Dedicated Vector Store Sync & Semantic Retrieval Engine for KeywordCrawler.
Uses local ChromaDB vector database with all-MiniLM-L6-v2 embeddings.
"""

import sys
import os
import json
import sqlite3
import argparse
import chromadb
from sentence_transformers import SentenceTransformer

DB_SQLITE = './data/crawler.db'
VECTOR_PATH = './data/vector_store'
COLLECTION_NAME = 'news_articles'

def get_chroma():
    os.makedirs(VECTOR_PATH, exist_ok=True)
    client = chromadb.PersistentClient(path=VECTOR_PATH)
    col = client.get_or_create_collection(
        name=COLLECTION_NAME,
        metadata={"description": "Dedicated Vector Store for KeywordCrawler Full Articles"}
    )
    return col

def get_model():
    return SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")

def sync_articles():
    conn = sqlite3.connect(DB_SQLITE)
    c = conn.cursor()
    c.execute("""
        SELECT r.id, r.title, r.snippet, r.full_content, r.domain, r.keyword_used, r.impact_sentiment, r.published_date, c.name
        FROM scraped_records r
        LEFT JOIN companies c ON c.id = r.company_id
        WHERE (r.full_content IS NOT NULL AND length(r.full_content) > 100)
           OR (r.snippet IS NOT NULL AND length(r.snippet) > 50)
    """)
    rows = c.fetchall()
    conn.close()

    col = get_chroma()
    existing_data = col.get(include=['metadatas', 'documents'])
    existing_ids = set(existing_data['ids'])
    
    # Map of existing indexed lengths to detect upgraded articles
    existing_lens = {}
    if existing_data and existing_data.get('documents'):
        for doc_id, doc_body in zip(existing_data['ids'], existing_data['documents']):
            existing_lens[doc_id] = len(doc_body or "")

    print(f"ChromaDB currently has {len(existing_ids)} indexed records. SQLite candidates: {len(rows)}")

    to_index = []
    to_delete = []
    for row in rows:
        rid, title, snippet, full_content, domain, kw, sentiment, pub_date, company = row
        doc_id = f"art_{rid}"
        content = full_content if (full_content and len(full_content) > 100) else snippet
        curr_len = len(content or "")

        # If completely new OR content was upgraded with full comprehensive text
        if doc_id not in existing_ids or (curr_len > existing_lens.get(doc_id, 0) + 100):
            if doc_id in existing_ids:
                to_delete.append(doc_id)

            doc_text = f"Judul: {title}\nPerusahaan: {company or '-'}\nDomain: {domain}\nKonten:\n{content}"
            to_index.append((doc_id, doc_text, {
                "record_id": rid,
                "title": title[:200] if title else "",
                "company": company or "",
                "domain": domain or "",
                "sentiment": sentiment or "NEUTRAL",
                "published_date": pub_date or ""
            }))

    if to_delete:
        col.delete(ids=to_delete)
        print(f"Purged {len(to_delete)} stale short vectors to replace with upgraded deep content.")

    if not to_index:
        print("All candidate articles are already indexed in ChromaDB vector store.")
        return

    print(f"Generating vector embeddings for {len(to_index)} new articles...")
    model = get_model()

    ids = [item[0] for item in to_index]
    docs = [item[1] for item in to_index]
    metas = [item[2] for item in to_index]

    # Process in batches of 32
    batch_size = 32
    for i in range(0, len(ids), batch_size):
        b_ids = ids[i:i+batch_size]
        b_docs = docs[i:i+batch_size]
        b_metas = metas[i:i+batch_size]

        embeddings = model.encode(b_docs).tolist()
        col.add(ids=b_ids, embeddings=embeddings, documents=b_docs, metadatas=b_metas)
        print(f"Indexed batch {i//batch_size + 1} / {(len(ids)-1)//batch_size + 1}")

    print(f"Sync complete! Total records in vector store: {col.count()}")

def query_vector(query_text: str, limit: int = 3, record_id: int = None):
    col = get_chroma()
    if col.count() == 0:
        print(json.dumps([]))
        return

    model = get_model()
    q_emb = model.encode([query_text]).tolist()

    where_filter = None
    if record_id:
        where_filter = {"record_id": record_id}

    results = col.query(
        query_embeddings=q_emb,
        n_results=min(limit, col.count()),
        where=where_filter
    )

    output = []
    if results and 'documents' in results and results['documents']:
        docs = results['documents'][0]
        metas = results['metadatas'][0] if 'metadatas' in results else []
        dists = results['distances'][0] if 'distances' in results else []
        for d, m, dist in zip(docs, metas, dists):
            output.append({
                "content": d,
                "metadata": m,
                "distance": round(dist, 4) if dist is not None else 0.0
            })

    print(json.dumps(output))

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--sync', action='store_true', help='Sync SQLite records into ChromaDB vector store')
    parser.add_argument('--query', type=str, help='Query text for semantic search')
    parser.add_argument('--record_id', type=int, help='Optional record ID to constrain vector search')
    parser.add_argument('--limit', type=int, default=3, help='Max items to return')
    args = parser.parse_args()

    if args.sync:
        sync_articles()
    elif args.query:
        query_vector(args.query, limit=args.limit, record_id=args.record_id)
    else:
        parser.print_help()
