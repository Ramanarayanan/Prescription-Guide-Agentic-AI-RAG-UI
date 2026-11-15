import requests

base = "http://127.0.0.1:8000"

store_payload = {
    "name": "Test User",
    "dob": "1990-01-01",
    "history": "Patient has mild hypertension and takes metformin.",
    "drug": "metformin",
}

r = requests.post(f"{base}/store", json=store_payload)
print("/store ->", r.status_code, r.text)

analyze_payload = {"drug": "aspirin"}
data_id = f"{store_payload['name'].lower().replace(' ', '_')}_{store_payload['dob']}"
ra = requests.post(f"{base}/analyze/{data_id}", json=analyze_payload)
print(f"/analyze/{data_id} ->", ra.status_code, ra.text)
