# K8s Runbook

## Diagnose
- kubectl -n documind get pods
- kubectl -n documind get events --sort-by=.lastTimestamp
- kubectl -n documind describe pod <n>
- kubectl -n documind logs <pod> --previous

## STATUS to Fix
- Pending: check events
- ImagePullBackOff: kind load docker-image <tag> --name documind
- CrashLoopBackOff: logs --previous, rollout undo
- OOMKilled: raise memory limit
- Running 0/1: dependency down

## Recover
- rollout undo deploy/<n>
- rollout restart deploy/<n>
- Full reset: kubectl delete ns documind; re-apply

## Notes
- Liveness=process, Readiness=deps
- maxUnavailable=0 -> zero-downtime
- Redis down -> API NotReady
