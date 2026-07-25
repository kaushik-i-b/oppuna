# Qwen model identity (Oppuna)

Authoritative machine-readable metadata: [`config/local-model.json`](../config/local-model.json).

## Exact production model

| Field | Value |
| --- | --- |
| Family | Qwen2.5 (`family: qwen2.5`) |
| Exact model | Qwen2.5-1.5B-Instruct |
| Parameters | 1.5B |
| Quantization | Q4_K_M |
| GGUF architecture | `qwen2` |
| Packaged filename | `model.gguf` |
| Expected bytes | `986048768` (~941 MB) |
| SHA-256 | `1adf0b11065d8ad2e8123ea110d1ec956dab4ab038eab665614adba04b6c3370` |
| License | Apache License, Version 2.0 (`apache-2.0`) |
| Chat template | ChatML (`<\|im_start\|>` / `<\|im_end\|>`) |
| Default context | 4096 (device tier may lower) |
| Upstream GGUF | `bartowski/Qwen2.5-1.5B-Instruct-GGUF` → `Qwen2.5-1.5B-Instruct-Q4_K_M.gguf` |
| Source URL | https://huggingface.co/bartowski/Qwen2.5-1.5B-Instruct-GGUF |

Values above are verified against the local GGUF header (`general.architecture=qwen2`, ChatML template present) and a streaming SHA-256 of `assets/ai-model/model.gguf`.

## Runtime stack

`React Native` → `llama.rn` → `llama.cpp` → local GGUF on device filesystem.

- No cloud LLM, Ollama, or runtime model download
- No general `INTERNET` permission for wellness/AI
- Safety/crisis routing runs **before** any model call

## ChatML / stops

Stop sequences are listed in `config/local-model.json` (`stopSequences`) and consumed by TypeScript via `LOCAL_MODEL_STOP_SEQUENCES`. Primary stops: `<|im_end|>`, `<|im_start|>`, `<|endoftext|>`.

## Historical note (obsolete)

Oppuna previously experimented with a Gemma-family GGUF. That path is **removed / obsolete** — do not reintroduce Gemma weights, Gemma license assets, or Gemma chat tokens in production code. Existing `release/*.aab` artifacts built before the Qwen cutover are **stale** and must not be submitted.

## Related docs

- `docs/QWEN_DISTRIBUTION.md` — packaging / PAD
- `docs/PLAY_MODEL_VALIDATION.md` — device validation
- `docs/PRODUCTION_READINESS.md` — release gates
