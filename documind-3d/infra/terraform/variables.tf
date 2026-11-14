variable "region" {
  type    = string
  default = "ap-south-1"
}

variable "project" {
  type    = string
  default = "documind"
}

variable "environment" {
  type    = string
  default = "prod"
}

variable "instance_type" {
  type    = string
  default = "t3.medium"
}

variable "root_volume_gb" {
  type    = number
  default = 30
}

variable "vpc_cidr" {
  type    = string
  default = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  type    = string
  default = "10.0.1.0/24"
}

variable "admin_cidr" {
  type        = string
  description = "SSH ke liye apna public IP"
  validation {
    condition     = can(cidrnetmask(var.admin_cidr)) && can(regex("/(2[4-9]|3[0-2])$", var.admin_cidr))
    error_message = "admin_cidr valid CIDR ho aur /24 ya chhota."
  }
}

variable "ssh_public_key" {
  type        = string
  description = "Contents of ~/.ssh/documind-prod.pub"
  validation {
    condition     = can(regex("^ssh-(ed25519|rsa) ", var.ssh_public_key))
    error_message = "Public key do."
  }
}

variable "force_destroy_bucket" {
  type    = bool
  default = false
}
