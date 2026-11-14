resource "aws_key_pair" "admin" {
  key_name   = "${local.name}-admin"
  public_key = var.ssh_public_key
}

resource "aws_instance" "app" {
  ami                         = "ami-0dee22c13ea7a9a67" # Hardcoded Ubuntu 24.04 for ap-south-1
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.app.id]
  key_name                    = aws_key_pair.admin.key_name
  iam_instance_profile        = aws_iam_instance_profile.app.name
  associate_public_ip_address = true
  user_data                   = file("${path.module}/user_data.sh")

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 2
  }

  root_block_device {
    volume_type           = "gp3"
    volume_size           = var.root_volume_gb
    encrypted             = true
    delete_on_termination = true
  }

  tags = { Name = "${local.name}-app" }
  lifecycle { ignore_changes = [ami, user_data] }
}

resource "aws_eip" "app" {
  domain   = "vpc"
  instance = aws_instance.app.id
  tags     = { Name = "${local.name}-eip" }
}
