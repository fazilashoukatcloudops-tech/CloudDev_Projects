output "instance_id" {
  value = aws_instance.app.id
}

output "public_ip" {
  value = aws_eip.app.public_ip
}

output "site_domain_sslip" {
  value = "${replace(aws_eip.app.public_ip, ".", "-")}.sslip.io"
}

output "s3_bucket" {
  value = aws_s3_bucket.files.bucket
}

output "ssh_command" {
  value = "ssh -i ~/.ssh/documind-prod ubuntu@${aws_eip.app.public_ip}"
}
