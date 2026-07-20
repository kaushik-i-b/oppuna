Place the production GGUF model for the mobile Llama agent here:

```text
assets/models/oppuna-model.gguf
```

Do not commit a fake model file. If this real model is bundled in a native
build, Oppuna stages it into private app storage on first launch and uses it
through `llama.rn`. If the file is absent, chat falls back to the offline
rule-based wellness engine.
