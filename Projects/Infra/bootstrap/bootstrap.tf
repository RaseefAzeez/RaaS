terraform {
  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 6.0"
    }
  }
}

# Configure the AWS Provider
provider "aws" {
  region = "us-east-1"
}

module "iam_oidc_provider" {
  source    = "terraform-aws-modules/iam/aws//modules/iam-oidc-provider"
  version = "~> 6.0"

  url = "https://token.actions.githubusercontent.com"
  client_id_list = ["sts.amazonaws.com"]

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

# Module for OIDC role with policy added with (admin access)
module "iam_role_github_oidc" {
  source    = "terraform-aws-modules/iam/aws//modules/iam-role"
  
    role_name = "GitHub-OIDC-RaaS-Deploy-Role"

    trusted_oidc_providers = [
    module.iam_oidc_provider.arn
  ]
    
  # This should be updated to suit your organization, repository, references/branches, etc.
  oidc_subjects = [
    "RaseefAzeez/RaaS:ref:refs/heads/infra-dev-setup",
    "RaseefAzeez/RaaS:ref:refs/heads/main"
  ]

  

  policies = {
    // S3ReadOnly = "arn:aws:iam::aws:policy/AmazonS3ReadOnlyAccess"
        TerraformFull = "arn:aws:iam::aws:policy/AdministratorAccess"
  }

  tags = {
    Terraform   = "true"
    Environment = "dev"
  }
}

output "github_oidc_role_arn" {
  value = module.iam_role_github_oidc.iam_role_arn
}