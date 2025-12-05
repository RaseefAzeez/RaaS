
# Configure the AWS Provider for Prod Env
provider "aws" {
  region = var.region
}

module "raas" {
  source      = "../../modules/raas_core"
  environment = var.environment
}
