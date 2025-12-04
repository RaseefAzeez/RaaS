
# Configure the AWS Provider for Prod Env
provider "aws" {
  region = "us-east-1"
}

module "raas" {
  source      = "../../modules/raas_core"
  environment = "prod"
}
