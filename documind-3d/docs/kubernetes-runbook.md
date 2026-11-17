# K8s Runbook
Context: `kind-documind`, namespace `documind`.
## Diagnose
`kubectl -n documind get pods`, `get events --sort-by=.lastTimestamp`, `describe pod`, `logs --previous`
## STATUS -> Fix
- Pending: check describe Events (resources/PVC)
- ImagePullBackOff: `kind load docker-image <tag> --name documind`
- CrashLoopBackOff: `logs --previous`; `rollout undo deploy/<n>`
- OOMKilled (137): raise memory limit
- Running 0/1: dependency down (db/redis)
## Recover
- Bad rollout: `kubectl -n documind rollout undo deploy/<n>`
- Specific rev: `rollout undo --to-revision=N`
- Config changed: `rollout restart deploy/<n>`
- Full reset (LOCAL): `kubectl delete ns documind` -> re-apply
## Verify
`curl http://localhost:8088/api/v1/health`
## Notes
- Liveness=process, Readiness=deps, maxUnavailable=0 ? zero-downtime
- Redis down ? API NotReady (no restart), auto-recovers
