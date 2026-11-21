#!/usr/bin/env python3
"""Tests for scripts/agents/cost.py: each message's usage counted once, priced by model and cache TTL."""

import importlib.util
import json
import os
import shutil
import tempfile
import unittest

KIT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
spec = importlib.util.spec_from_file_location("cost", os.path.join(KIT, "scripts/agents/cost.py"))
cost = importlib.util.module_from_spec(spec)
spec.loader.exec_module(cost)


class Cost(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.mkdtemp(prefix="avel-cost-")

    def tearDown(self):
        shutil.rmtree(self.tmp, ignore_errors=True)

    def test_a_message_is_counted_once_and_priced_by_model_and_ttl(self):
        usage = {"input_tokens": 1_000_000, "output_tokens": 1_000_000, "cache_read_input_tokens": 1_000_000,
                 "cache_creation": {"ephemeral_1h_input_tokens": 1_000_000, "ephemeral_5m_input_tokens": 0}}
        line = {"type": "assistant", "requestId": "r1", "message": {"id": "m1", "model": "claude-opus-5-5", "usage": usage}}
        with open(os.path.join(self.tmp, "s.jsonl"), "w") as f:
            f.write(json.dumps(line) + "\n" + json.dumps(line) + "\n")  # a message split over two lines
            f.write(json.dumps({"type": "user"}) + "\n")
        usd, parts, calls = cost.cost_of(self.tmp)
        self.assertEqual(calls, 1)
        # Opus 5.5: $4 input, $20 output, $0.20 cache read, a 1-hour write at 2 x input ($8)
        self.assertAlmostEqual(usd, 4 + 20 + 0.20 + 8)
        self.assertAlmostEqual(parts["cache write"], 8)

    def test_sonnet_and_a_5_minute_write(self):
        usage = {"input_tokens": 0, "output_tokens": 0, "cache_read_input_tokens": 0, "cache_creation_input_tokens": 1_000_000}
        with open(os.path.join(self.tmp, "s.jsonl"), "w") as f:
            f.write(json.dumps({"type": "assistant", "message": {"id": "m", "model": "claude-sonnet-5-5", "usage": usage}}) + "\n")
        usd, _, _ = cost.cost_of(self.tmp)
        self.assertAlmostEqual(usd, 2 * 1.25)

    def test_a_worktree_path_maps_to_its_transcript_folder(self):
        self.assertEqual(cost.transcript_dir("/home/u/projects/factory-wt/backend-sprint-05-t-b20-build-a1", "/r"),
                         "/r/-home-u-projects-factory-wt-backend-sprint-05-t-b20-build-a1")


if __name__ == "__main__":
    unittest.main()
