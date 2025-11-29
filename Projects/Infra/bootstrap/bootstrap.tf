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

  //create             = true
  name               = "GitHub-OIDC-RaaS-Deploy-Role"
  enable_github_oidc = true

  # oidc_provider_urls = [
  #   "token.actions.githubusercontent.com"
  # ]

  # oidc_audiences = [
  #   "sts.amazonaws.com"
  # ]

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

output "github_oidc_role_arn" {
  value = module.iam_role_github_oidc.arn
}
