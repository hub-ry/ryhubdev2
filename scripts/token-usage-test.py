import importlib.util
import tempfile
import unittest
from pathlib import Path

spec = importlib.util.spec_from_file_location('token_usage', Path(__file__).with_name('token-usage.py'))
module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(module)


class UsageTests(unittest.TestCase):
    def test_streamed_claude_and_omp_copy_count_once(self):
        collector = module.Collector(Path('/unused'))
        row = {'type': 'assistant', 'timestamp': '2026-10-08T08:00:00Z', 'message': {'id': 'msg_one', 'usage': {'input_tokens': 10, 'output_tokens': 2, 'cache_read_input_tokens': 100}}}
        collector.ingest('claude', row, {}, 'a')
        row['message']['usage']['output_tokens'] = 5
        collector.ingest('claude', row, {}, 'b')
        collector.ingest('omp', {'timestamp': row['timestamp'], 'message': {'role': 'assistant', 'provider': 'anthropic', 'responseId': 'msg_one', 'usage': {'input': 10, 'output': 5, 'cacheRead': 100}}}, {}, 'c')
        self.assertEqual(list(collector.records.values()), [('2026-10-08', 'claude', 115, 100)])

    def test_codex_cumulative_repeats_and_reasoning(self):
        collector = module.Collector(Path('/unused'))
        state = {}
        for total, cached in [(100, 50), (100, 50), (180, 90)]:
            row = {'timestamp': '2026-10-08T08:00:00Z', 'payload': {'type': 'token_count', 'info': {'total_token_usage': {'total_tokens': total, 'cached_input_tokens': cached, 'reasoning_output_tokens': 20}}}}
            collector.ingest('codex', row, state, 'session')
        self.assertEqual(sum(r[2] for r in collector.records.values()), 180)
        self.assertEqual(sum(r[3] for r in collector.records.values()), 90)

    def test_partial_append_and_local_midnight(self):
        with tempfile.TemporaryDirectory() as directory:
            home = Path(directory)
            folder = home / '.claude/projects'
            folder.mkdir(parents=True)
            path = folder / 'session.jsonl'
            row = {'type': 'assistant', 'timestamp': '2026-10-08T02:00:00Z', 'message': {'id': 'msg_one', 'usage': {'input_tokens': 10, 'output_tokens': 5}}}
            import json
            path.write_text(json.dumps(row))
            collector = module.Collector(home)
            collector.collect()
            self.assertEqual(len(collector.records), 0)
            with path.open('a') as stream:
                stream.write('\n')
            collector.collect()
            collector.collect()
            self.assertEqual(list(collector.records.values()), [('2026-10-07', 'claude', 15, 0)])


if __name__ == '__main__':
    unittest.main()
