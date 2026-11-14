# AWS Architecture (Design v1)

## Request Flow
Browser -> Caddy (TLS 443) -> Nginx (Web + API Proxy) -> API (Express) -> DB/Redis/S3

## Components
- VPC: 10.0.0.0/16 with 1 Public Subnet (no NAT to save cost)
- EC2: t3.medium (Ubuntu 24.04) with Docker Compose
- Security Group: 80/443 world, 22 admin only, 5432/6379 internal
- IAM: EC2 role (no access keys) with S3 Put/Get/Delete
- S3: Private bucket with SSE-S3 encryption

## Cost Control
- EC2 t3.medium ~$30/mo
- Elastic IP ~$3.6/mo
- Always run terraform destroy when done