import asyncio
import sys
import time
import unittest
from pathlib import Path
from unittest.mock import patch

from fastapi.testclient import TestClient

BACKEND_DIR = Path(__file__).resolve().parent.parent
if str(BACKEND_DIR) not in sys.path:
    sys.path.insert(0, str(BACKEND_DIR))

import main


class DummyEmbeddings:
    def embed_documents(self, texts):
        return [[0.0, 1.0] for _ in texts]

    def embed_query(self, text):
        return [0.0, 1.0]


class PatientLookupTest(unittest.TestCase):
    def test_patient_lookup_ignores_extra_name_whitespace(self):
        app = TestClient(main.app)

        with patch.object(main, "get_embeddings", return_value=DummyEmbeddings()):
            store_response = app.post(
                "/store",
                json={
                    "name": "  Alice   Smith  ",
                    "dob": "2000-01-02",
                    "history": "Patient has mild hypertension.",
                    "drug": "metformin",
                },
            )
            self.assertEqual(store_response.status_code, 200, store_response.text)

            lookup_response = app.get(
                "/patient-details",
                params={"name": "Alice Smith", "dob": "2000-01-02"},
            )

        self.assertEqual(lookup_response.status_code, 200, lookup_response.text)
        payload = lookup_response.json()
        self.assertEqual(payload["name"], "Alice Smith")
        self.assertEqual(payload["dob"], "2000-01-02")


class AnalyzeTimeoutTest(unittest.TestCase):
    def test_analyze_uses_fast_fallback_when_crew_times_out(self):
        from services import analyze_service

        class SlowCrew:
            async def kickoff_async(self):
                await asyncio.sleep(1.5)
                return "slow result"

        start = time.perf_counter()
        with patch.object(analyze_service, "build_crew", return_value=SlowCrew()):
            with patch.object(analyze_service, "_run_lightweight_llm", return_value="fallback result"):
                result = asyncio.run(
                    analyze_service.run_analyze_crew_async(
                        {"name": "Alice Smith", "dob": "2000-01-02", "history": "Hypertension", "drug": "metformin"},
                        "alice_smith_2000-01-02",
                        "aspirin",
                        {"similarity_search": lambda *args, **kwargs: []},
                    )
                )

        self.assertEqual(result, "fallback result")
        self.assertLess(time.perf_counter() - start, 1.0)


if __name__ == "__main__":
    unittest.main()
