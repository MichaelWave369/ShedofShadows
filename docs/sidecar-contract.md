# BLACKOUT sidecar receipt v1 (proposal only)

A Shed of Shadows victory can export a JSON receipt. This is a standalone narrative souvenir. BLACKOUT does not currently import or validate this file.

Fields: contract = blackout-sidecar-receipt, version = 1, source = shed-of-shadows, target = blackout, kind = local-narrative-receipt, verified = false, completedCampaign = night-shift, numeric score/hits/shots, evidence = [{ id, label, provenance }], disclaimer.

## Guardrails
- No direct cross-origin storage reads/writes, no hidden requests, and no mutations of BLACKOUT saves.
- Player-supplied JSON is editable and must never be considered proof of achievement or a security credential.
- Any future importer must be reviewed in BLACKOUT and require explicit consent and strict schema validation.
- The K-marked fragment is fictional side-story material, not an assertion about unrevealed canon.

## Future compatibility
Combat logic in src/engine.js is DOM-independent. Quest 3 WebXR can map raycast aim to normalized (x,y) while retaining game hit rules. Co-op requires a separate authoritative session/network design.
