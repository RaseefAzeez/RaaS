
variable "environment" {
  description = "enviroment name - dev or prod"
  type        = string
}

variable "region" {
  description = "AWS region to deploy resources"
  type        = string
}

variable "instance_map" {
  description = "values for tagging and identifying EC2 instances" 
  type = map(object({
    team = string
  }))
}

variable "rbac_map" {  
    description = "values for lambda to check condition with instances based on tags to provide RBAC permissions"
    type = string
}

variable "group_map" {
    description = "cannonical mapping of group from IAM identity center"
    type        = string
}

variable "cognito_user_pool_id" {
  description = "value of cognito user pool id"
  type = string
}

variable "cognito_app_client_id" {
  description = "value of cognito app client id"
  type = string
}

variable "frontend_origin" {
  description = "value of frontend origin for CORS configuration"
  type = string
}