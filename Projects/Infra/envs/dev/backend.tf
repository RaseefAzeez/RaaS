terraform {
  backend "s3" {
    bucket       = "raas-terraform-state-bucket"
    key          = "envs/dev/terraform.tfstate"
    region       = "us-east-1"
    use_lockfile = true
  }
}
