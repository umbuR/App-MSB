from fastapi import APIRouter, Request
from .database import db
from datetime import datetime

router = APIRouter(prefix="/api/sync", tags=["Sync"])

@router.post("/")
async def sync_data(request: Request):
    """Endpoint untuk sinkronisasi data offline dari IndexedDB ke MongoDB"""
    data = await request.json()
    
    # data is expected to be a dictionary with collection names as keys
    # and lists of documents as values
    
    results = {}
    
    for collection_name, documents in data.items():
        if not documents:
            continue
            
        collection = db.get_collection(collection_name)
        
        # Process each document
        for doc in documents:
            # Remove sync_status before saving to MongoDB
            if 'sync_status' in doc:
                del doc['sync_status']
                
            # Use 'id' from frontend as '_id' in MongoDB or just update by 'id'
            doc_id = doc.get('id')
            if doc_id:
                # Upsert document
                await collection.update_one(
                    {'id': doc_id},
                    {'$set': doc},
                    upsert=True
                )
        
        results[collection_name] = len(documents)
        
    return {"message": "Sync successful", "synced_counts": results}
