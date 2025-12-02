terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Configure the AWS Provider here
provider "aws" {
  region = "us-east-1"
}


# Module for OIDC role with policy added with (admin access provided)
module "iam_role_github_oidc" {
  source = "terraform-aws-modules/iam/aws//modules/iam-role"

  name               = "GitHub-OIDC-RaaS-Deploy-Role"
  use_name_prefix = false
  enable_github_oidc = true
  # This should be updated to suit your organization, repository, references/branches, etc.
  oidc_wildcard_subjects = [
    "repo:RaseefAzeez/RaaS:environment:infra-dev-setup"
  ]

  policies = {
    TerraformFull = "arn:aws:iam::aws:policy/AdministratorAccess"
  }

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

# S3 bucket for storing terraform state files
resource "aws_s3_bucket" "terraform_state_bucket" {
  bucket = "raas-terraform-state-bucket"

  tags = {
    Name        = "RaaS-Terraform-State-Bucket"
    Environment = "dev"
  }
}

# #dynamodb table for terraform state locking
# resource "aws_dynamodb_table" "basic-dynamodb-table" {
#   name           = "lockstatefileTable"
#   billing_mode   = "PROVISIONED"
#   read_capacity  = 20
#   write_capacity = 20
#   hash_key       = "LockID"

# attribute {
#     name = "LockID"
#     type = "S"
#   }

#   tags = {
#     Name        = "dynamodb-lock-table"
#     Environment = "dev"
#   }
# }


output "github_oidc_role_arn" {
  value = module.iam_role_github_oidc.arn
}
