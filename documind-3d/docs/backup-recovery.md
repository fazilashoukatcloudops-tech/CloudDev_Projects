# Backup and Recovery

## Plan
- PostgreSQL: pg_dump daily to S3, 35-day retention
- PDFs: S3 versioning, 30 days
- Redis: not backed up
- Secrets: Ansible regenerates

## Tested scenarios (K8s)
- API pod crash -> auto-restart
- Redis down -> API NotReady, auto-recovers
- DB pod delete -> PVC preserved
- Bad rollout -> rollout undo

## Not drilled
- Full DB restore

## Limitations
- No PITR, single AZ, no cross-region
