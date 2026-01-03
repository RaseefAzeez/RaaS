
#API Gateway creation processed here

resource "aws_apigatewayv2_api" "raas_api_gateway" {
  name          = "raas-${var.environment}-apigateway"
  protocol_type = "HTTP"

  cors_configuration {
    allow_origins = [var.frontend_origin]

    allow_methods = ["GET", "POST", "OPTIONS"]

    allow_headers = [
      "authorization",
      "content-type"
    ]

    max_age = 3600
  }

}

resource "aws_apigatewayv2_authorizer" "raas_jwt_authorizer" {
  api_id          = aws_apigatewayv2_api.raas_api_gateway.id
  name            = "raas-jwt-authorizer"
  authorizer_type = "JWT"

  jwt_configuration {
    issuer   = "https://cognito-idp.${var.region}.amazonaws.com/${var.cognito_user_pool_id}"
    audience = [var.cognito_app_client_id]
  }

  identity_sources = ["$request.header.Authorization"]
}


#API Gateway Lambda Integration

resource "aws_apigatewayv2_integration" "raas_lambda_integration" {
  api_id                 = aws_apigatewayv2_api.raas_api_gateway.id
  integration_type       = "AWS_PROXY"
  integration_method     = "POST"
  description            = "API-Gatway Lambda-Integration"
  integration_uri        = aws_lambda_function.lambda_function_def.invoke_arn
  payload_format_version = "2.0"
}

resource "aws_apigatewayv2_route" "get_instances" {
  api_id    = aws_apigatewayv2_api.raas_api_gateway.id
  route_key = "GET /instances"

  target = "integrations/${aws_apigatewayv2_integration.raas_lambda_integration.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.raas_jwt_authorizer.id
}


resource "aws_apigatewayv2_route" "post_reboot" {
  api_id    = aws_apigatewayv2_api.raas_api_gateway.id
  route_key = "POST /reboot"

  target = "integrations/${aws_apigatewayv2_integration.raas_lambda_integration.id}"

  authorization_type = "JWT"
  authorizer_id      = aws_apigatewayv2_authorizer.raas_jwt_authorizer.id
}


#API Gateway route set up (POST)- proxy integration 

# resource "aws_apigatewayv2_route" "raas_api_gateway_route" {
#   api_id    = aws_apigatewayv2_api.raas_api_gateway.id
#   route_key = "POST /reboot"

#   target = "integrations/${aws_apigatewayv2_integration.raas_lambda_integration.id}"
# }

#API Gateway Stages

resource "aws_apigatewayv2_stage" "stage" {
  api_id      = aws_apigatewayv2_api.raas_api_gateway.id
  name        = "${var.environment}-stage"
  auto_deploy = true
}

#Lambda Permission for API Gateway

resource "aws_lambda_permission" "raas_allow_apigatway" {
  statement_id  = "AllowAPIGatewaytoInvokeLambda"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.lambda_function_def.function_name
  principal     = "apigateway.amazonaws.com"

  # The /* part allows invocation from any stage, method and resource path
  # within API Gateway.
  source_arn = "${aws_apigatewayv2_api.raas_api_gateway.execution_arn}/*/*"
}


output "api_endpoint" {
  description = "HTTP API endpoint (invoke URL) for RaaS"
  value       = aws_apigatewayv2_api.raas_api_gateway.api_endpoint
}
output "authorizer_id" {
  value = aws_apigatewayv2_authorizer.raas_jwt_authorizer.id
}
