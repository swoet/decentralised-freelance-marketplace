provider "aws" {
  region = var.aws_region
}

variable "aws_region" { default = "us-east-1" }
variable "db_name" { default = "marketplace" }
variable "db_user" { default = "marketuser" }
variable "db_password" {}
variable "redis_node_type" { default = "cache.t3.micro" }
variable "ipfs_bucket_name" { default = "marketplace-ipfs-bucket" }

resource "aws_db_instance" "postgres" {
  allocated_storage    = 20
  engine               = "postgres"
  engine_version       = "14.7"
  instance_class       = "db.t3.micro"
  name                 = var.db_name
  username             = var.db_user
  password             = var.db_password
  parameter_group_name = "default.postgres14"
  skip_final_snapshot  = true
  publicly_accessible  = false
}

resource "aws_elasticache_cluster" "redis" {
  cluster_id           = "marketplace-redis"
  engine               = "redis"
  node_type            = var.redis_node_type
  num_cache_nodes      = 1
  parameter_group_name = "default.redis7"
  port                 = 6379
}

resource "aws_s3_bucket" "ipfs" {
  bucket = var.ipfs_bucket_name
  acl    = "private"
  versioning {
    enabled = true
  }
  server_side_encryption_configuration {
    rule {
      apply_server_side_encryption_by_default {
        sse_algorithm = "AES256"
      }
    }
  }
} 