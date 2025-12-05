
#API Gateway creation

resource "aws_apigatewayv2_api" "raas_api_gateway" {
  name          = "raas-${var.environment}-apigateway"
  protocol_type = "HTTP"
}

#API Gateway Lambda Integration

resource "aws_apigatewayv2_integration" "raas_lambda_integration" {
  api_id           = aws_apigatewayv2_api.raas_api_gateway.id
  integration_type = "AWS_PROXY"

  //connection_type           = "INTERNET"
  //content_handling_strategy = "CONVERT_TO_TEXT"
  description = "API-Gatway Lambda-Integration"
  //integration_method        = "POST"
  integration_uri = aws_lambda_function.lambda_function_def.invoke_arn
  //passthrough_behavior   = "WHEN_NO_MATCH"
  payload_format_version = "2.0"
}

#API Gateway route set up (POST)- proxy integration 

resource "aws_apigatewayv2_route" "raas_api_gateway_route" {
  api_id    = aws_apigatewayv2_api.raas_api_gateway.id
  route_key = "POST /reboot"

  target = "integrations/${aws_apigatewayv2_integration.raas_lambda_integration.id}"
}

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
  source_arn = "${aws_apigatewayv2_api.raas_api_gateway.execution_arn}/*"
}
