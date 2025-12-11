
variable "environment" {
  type        = string
}

variable "region" {
  type        = string
}

variable "instance_map" {
  type = map(object({
    team = string
  }))
}

variable "rbac_map" {  
    type = string
}

variable "group_map" {
    type        = string
}


variable "cognito_user_pool_id" {
  type = string
}

variable "cognito_app_client_id" {
  type = string
}

variable "frontend_origin" {
  type = string
}