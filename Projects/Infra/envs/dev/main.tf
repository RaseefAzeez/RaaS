# Configure the AWS Provider
provider "aws" {
  region = var.region
}

module "raas" {
  source      = "../../modules/raas_core"
  environment = "${var.environment}"
  region = var.region
  rbac_map    = var.rbac_map
  instance_map = var.instance_map
  group_map = var.group_map
  cognito_user_pool_id = var.cognito_user_pool_id
  cognito_app_client_id = [var.cognito_app_client_id]
  frontend_origin = var.frontend_origin
}
